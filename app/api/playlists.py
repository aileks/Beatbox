from flask import Blueprint, request
from sqlalchemy.util import print_
from app.models import Models, db
from flask_login import current_user, login_required
from app.forms.playlist_form import PlaylistForm
from flask_wtf.csrf import generate_csrf

Playlist = Models.Playlist  # pyright: ignore
PlaylistSong = Models.PlaylistSong  # pyright: ignore
Song = Models.Song  # pyright: ignore
playlists = Blueprint("playlists", __name__)


@playlists.route("")
def all_playlists():
    Playlists = Playlist.query.all()
    return [ply.to_json() for ply in Playlists if ply.is_public]


@playlists.route("/current")
@login_required
def my_playlists():
    Playlists = Playlist.query.filter_by(owner_id=current_user.id).all()
    return [genre.to_json() for genre in Playlists]


@playlists.route("/<playlist_id>")
def get_playlist(playlist_id):
    playlist = Playlist.query.get(int(playlist_id))

    if not playlist:
        return {"errors": "Playlist not found"}, 404

    if not playlist.is_public and current_user.id != playlist.owner_id:
        return {"errors": "User not authorized"}, 403

    return playlist.to_json()


@playlists.route("/<playlist_id>", methods=["DELETE"])
def delete_playlist(playlist_id):
    playlist = Playlist.query.get(int(playlist_id))

    if not playlist:
        return {"errors": "Playlist not found"}, 404

    if (
        not playlist.is_public
        and current_user.id != playlist.owner_id
        or playlist.name in ["Library", "Liked", "Queue"]
    ):
        return {"errors": "User not authorized"}, 403

    db.session.delete(playlist)
    db.session.commit()
    return {"message": "Successfully deleted"}


@playlists.route("/<playlist_id>", methods=["PUT"])
def edit_playlist(playlist_id):
    playlist = Playlist.query.get(int(playlist_id))

    if not playlist:
        return {"errors": "Playlist not found"}, 404

    data = request.get_json()
    bad_data = ({"errors": "Bad Data"}, 400)

    if (
        type(data["is_public"]) is not bool
        or type(data["name"]) is not str
        or type(data["description"]) is not str
    ):
        return bad_data

    playlist.is_public = data["is_public"]
    playlist.name = data["name"]
    playlist.description = data["description"]
    db.session.commit()

    return Playlist.query.get(int(playlist_id)).to_json()


@playlists.route("", methods=["POST"])
def create_playlist():
    data = request.get_json()
    bad_data = ({"errors": "Bad Data"}, 400)

    if (
        type(data["is_public"]) is not bool
        or type(data["name"]) is not str
        or type(data["description"]) is not str
    ):
        return bad_data

    playlist = Playlist(
        name=data["name"],
        description=data["description"],
        is_public=data["is_public"],
        owner_id=current_user.id,
    )

    db.session.add(playlist)
    db.session.commit()

    new_playlist = Playlist.query.get(playlist.id)

    return new_playlist.to_json(), 201


@playlists.route("/create", methods=["POST"])
def create_playlist_but_worse():
    data = request.get_json()

    if not data.get("name") or not data.get("description"):
        return {"errors": "Playlist name and description are required."}, 400

    current_artist = Models.Artist.query.get(current_user.id)  # pyright: ignore

    playlist = Playlist()
    playlist.name = data["name"]
    playlist.description = data["description"]
    playlist.is_public = data.get("is_public", False)
    playlist.owner_id = current_user.id

    db.session.add(playlist)
    db.session.commit()

    return playlist.to_json(), 201


@playlists.route("/<playlist_id>/songs", methods=["POST"])
def add_playlist_songs(playlist_id):
    song_ids = request.get_json()["songs"]  # pyright: ignore

    playlist_songs = []

    for i in range(len(song_ids)):  # pyright: ignore
        playlist_songs.append(
            PlaylistSong(
                song_index=i,
                song_id=song_ids[i],  # pyright: ignore
                playlist_id=int(playlist_id),  # pyright: ignore
            )
        )

    db.session.add(playlist_songs)
    db.session.commit()

    playlist = Playlist.query.get(int(playlist_id))

    return playlist.to_json()


@playlists.route("/<playlist_id>/song", methods=["POST"])
def add_playlist_song(playlist_id):
    playlist = Playlist.query.get(playlist_id)

    exists = PlaylistSong.query.filter_by(
        song_id=request.get_json()["song_id"], playlist_id=int(playlist_id)
    ).first()

    if exists:
        return {"errors": "Cannot add duplicate song"}, 400

    db.session.add(
        PlaylistSong(
            song_index=len(getattr(playlist, "songs", [])),
            song_id=request.get_json()["song_id"],  # pyright: ignore
            playlist_id=int(playlist_id),
        )
    )
    db.session.commit()

    return Playlist.query.get(playlist_id).to_json()


@playlists.route("/liked")
@login_required
def get_liked():
    liked = Playlist.query.filter_by(
        owner_id=current_user.id, is_public=False, name="Liked"
    ).first()

    if not liked:
        return {"errors": "Liked playlist not found"}, 404

    return liked.to_json()


@playlists.route("/liked/<int:song_id>", methods=["DELETE"])
@login_required
def remove_from_liked(song_id):
    liked = Playlist.query.filter_by(
        owner_id=current_user.id, is_public=False, name="Liked"
    ).first()

    if not liked:
        return {"errors": "Liked playlist not found"}, 404

    PlaylistSong.query.filter_by(playlist_id=liked.id, song_id=song_id).delete()
    db.session.commit()

    return {"message": "Song unliked successfully"}, 200


@playlists.route("/queue")
@login_required
def get_queue():
    queue = Playlist.query.filter_by(
        owner_id=current_user.id, is_public=False, name="Queue"
    ).first()

    if not queue:
        return {"errors": "Could not fetch Queue"}, 404

    return queue.to_json()


@playlists.route("/queue", methods=["POST"])
def add_to_queue():
    queue = Playlist.query.filter_by(
        owner_id=current_user.id, is_public=False, name="Queue"
    ).first()

    if not queue:
        return {"errors": "Could not fetch Queue"}, 404

    song_id = request.get_json()["song"]  # pyright: ignore

    current_max_index = (
        db.session.query(db.func.max(PlaylistSong.song_index))
        .filter_by(playlist_id=queue.id)
        .scalar()  # Returns the specific index value OR None of there isn't a max
    )

    if not current_max_index:
        current_max_index = 0

    new_queue_song = PlaylistSong(
        song_index=current_max_index + 1,
        song_id=song_id,
        playlist_id=queue.id,
    )

    db.session.add(new_queue_song)
    db.session.commit()

    return queue.to_json()


@playlists.route("/queue", methods=["DELETE"])
def clear_queue():
    queue = Playlist.query.filter_by(
        owner_id=current_user.id, is_public=False, name="Queue"
    ).first()

    if not queue:
        return {"error": "Queue not found"}, 404

    PlaylistSong.query.filter_by(playlist_id=queue.id).delete()
    db.session.commit()

    return {"message": "Queue cleared successfully"}, 200


@playlists.route("/library")
@login_required
def get_library():
    library = Playlist.query.filter_by(
        owner_id=current_user.id, is_public=False, name="Library"
    ).first()

    if not library:
        return {"errors": "Could not fetch Library"}, 404

    return library.to_json()


# @playlists.route("/<int:playlist_id>/songs/<int:song_id>", methods=["DELETE"])
# def remove_song(playlist_id, song_id):
#     playlist = Playlist.query.get(playlist_id)
#     song = Playlist.query.get(song_id)

#     if not playlist:
#         return {"errors": "Playlist not found"}, 404

#     if not song:
#         return {"errors": "Song not found"}, 404

#     PlaylistSong.query.filter_by(playlist_id=playlist_id, song_id=song_id).delete()
#     db.session.commit()

#     return {"message": "Song removed successfully"}, 200


@playlists.route("/<int:playlist_id>/songs/<int:song_id>", methods=["DELETE"])
def remove_song(playlist_id, song_id):
    playlist = Playlist.query.get(playlist_id)
    song = Song.query.get(song_id)

    if not playlist:
        return {"errors": "Playlist not found"}, 404

    if not song:
        return {"errors": "Song not found"}, 404

    playlist_song = PlaylistSong.query.filter_by(
        playlist_id=playlist_id, song_id=song_id
    ).first()

    if not playlist_song:
        return {"errors": "Song not found in this playlist"}, 404

    db.session.delete(playlist_song)
    db.session.commit()

    return {"message": "Song removed successfully"}, 200
