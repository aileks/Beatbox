import { useState, useEffect, useRef } from 'react';
import { Trash, MoreHorizontal, Play } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentSong, addToQueue, addAllToQueue, clearQueue } from '../../redux/queue';
import LikeButton from './LikeButton';
import AddToLibrary from './AddToLibrary';
import EditPlaylist from '../ManagePlaylists/EditPlaylist';
import DropDown from './DropDown';
import { useParams } from 'react-router-dom';

export default function ListDetails({ list }) {
  // Reordered declarations to keep things in consistent order, moved hooks to top to prevent the error of "more hooks rendered than previous render" on refresh
  const dispatch = useDispatch();
  const [songDurations, setSongDurations] = useState({});
  const [editingPlaylist, setEditingPlaylist] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const user = useSelector(state => state.session.user);
  const currentSong = useSelector(selectCurrentSong);
  const [showAlert, setShowAlert] = useState(false);
  const dropdownRef = useRef(null);

  const handleLoadedMetadata = (songId, audioElement) => {
    const duration = audioElement?.duration;

    setSongDurations(prevDurations => ({
      ...prevDurations,
      [songId]: duration,
    }));
  };

  const formatTime = time => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePlayAllSongs = () => {
    try {
      if (list.songs?.length > 0) {
        dispatch(clearQueue()).then(() => {
          dispatch(addAllToQueue(list.songs));
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const playSong = song => {
    dispatch(clearQueue()).then(() => dispatch(addToQueue(song)));
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  {
    /* included alert message if user doesnt own playlist */
  }
  const handleEditPlaylist = () => {
    if (user?.id == list.ownerId) {
      setEditingPlaylist(true);
      setMenuOpen(false);
    } else {
      setShowAlert(true);
    }
  };

  const handleCloseAlert = () => {
    setShowAlert(false);
  };

  const handleClickOutside = event => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setMenuOpen(false);
    }
  };

  useEffect(() => {
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const handleCloseEdit = () => {
    setEditingPlaylist(false);
  };

  {
    /* The block of code before is cause a mismatch of renders if page is manually refreshed. Might needs to take a different approach to the conditional rendering. Commenting out the conditional below stops the error. */
  }

  // if (!list) {
  //   return (
  //     <h2 className="self-center text-center mt-12 text-2xl font-bold">
  //       Loading...
  //     </h2>
  //   );
  // }

  const artist = list?.artist
    ? list?.artist[0].band_name
      ? `${list?.artist[0].band_name}`
      : `${list?.artist[0].first_name} ${list?.artist[0].last_name}`
    : null;
  const owner = list?.owner
    ? list?.owner[0].band_name
      ? `${list?.owner[0].band_name}`
      : `${list?.owner[0].first_name} ${list?.owner[0].last_name}`
    : null;
  const releaseYear = new Date(list?.releaseDate).getFullYear() || null;
  const songCount = list?.songs?.length;
  const coverArt = list?.albumCover || '/playlist.jpeg';

  {
    /* IMPORTANT! ...this ensures editing is reset so you can navigate back to component */
  }
  // useEffect(() => {
  //   return () => {
  //     setEditingPlaylist(false);
  //   };
  // }, []);

  if (editingPlaylist) {
    return (
      <EditPlaylist
        list={list}
        onClose={handleCloseEdit}
      />
    );
  }

  return (
    <div className='mt-14 mx-44 overflow-x-clip max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin scrollbar-thumb-primary scrollbar-thumb-rounded-full scrollbar-track-transparent'>
      <div className='mb-6 w-[80vw] relative'>
        <span className='flex gap-2 items-center'>
          <img
            className='max-w-56 max-h-56 rounded-md border border-accent'
            src={
              list?.name === 'Liked'
                ? '/liked.jpeg'
                : list?.name === 'Library'
                  ? '/library.jpeg'
                  : coverArt
            }
            alt='album artwork'
          />

          <div className='flex flex-col justify-center space-y-1'>
            <div className='flex justify-between items-center space-y-1 relative'>
              <p className='flex font-semibold justify-start'>
                Album
              </p>

              {menuOpen && (
                <div
                  ref={dropdownRef}
                  className='absolute text-foreground bg-card right-0 top-6 mt-2 rounded-lg shadow-lg z-10 p-2 w-1/2'
                >
                  <ul>
                    <li>
                      <button
                        onClick={handleEditPlaylist}
                        className='block px-4 py-2 text-sm w-full text-center hover:bg-muted rounded-lg'
                      >
                        Edit Playlist
                      </button>
                    </li>

                    <li>
                      <button className='block px-4 py-2 text-sm w-full text-center hover:bg-muted rounded-lg'>
                        Create New Playlist
                      </button>
                    </li>
                  </ul>
                </div>
              )}

              {/* Conditional rendering of the alert */}
              {showAlert && (
                <div className='fixed top-0 left-0 w-full h-full flex items-center justify-center'>
                  <div className='bg-card p-6 rounded-lg shadow-lg'>
                    <h3 className='text-xl font-semibold'>Permission Denied</h3>
                    <p className='mt-2'>You don't have permission to edit this playlist.</p>
                    <button
                      onClick={handleCloseAlert}
                      className='mt-4 px-4 py-2 bg-primary text-white rounded-lg'
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>

            <h1 className='text-3xl font-bold'>{list?.name}</h1>

            <p className='text-sm'>
              {`${artist || owner} • `}
              {releaseYear && <>{` ${releaseYear} • `}</>} {songCount}
              {`${songCount === 1 ? ' song' : ' songs'}`}
            </p>

            <p className='text-sm text-wrap w-fit'>{list?.description}</p>
          </div>

          <div className='absolute bottom-2 left-40 ml-2'>
            <button
              className='p-3 bg-green-500 w-fit rounded-lg'
              onClick={handlePlayAllSongs}
            >
              <Play />
            </button>
          </div>
        </span>
      </div>

      <ul className='bg-card text-card-foreground w-full border border-border h-2/3 rounded-md'>
        {list?.songs?.length ? (
          list?.songs?.map((song, index) => (
            <li
              key={index + '1'}
              className='flex flex-col hover:bg-muted h-full rounded-sm'
            >
              <div className='flex mx-4 items-center py-4'>
                <div className='flex gap-4 items-center mr-2'>
                  <AddToLibrary
                    key={index + '2'}
                    song={song}
                  />

                  <LikeButton
                    key={index + '3'}
                    song={song}
                  />

                  <DropDown song={song} />
                </div>

                <div
                  className='flex w-full mx-2 items-center justify-evenly cursor-pointer'
                  onClick={() => playSong(song)}
                >
                  <audio
                    src={song.url}
                    onLoadedMetadata={e => handleLoadedMetadata(song.id, e.target)}
                    className='hidden'
                  />

                  <div className='flex-1'>
                    <h3
                      className={`font-semibold ${
                        currentSong?.id === song.id ? 'text-green-500' : ''
                      }`}
                    >
                      {song.name}
                    </h3>
                  </div>

                  <div className='flex-1 text-center'>
                    <p
                      className={`font-semibold ${
                        currentSong?.id === song.id ? 'text-green-500' : ''
                      }`}
                    >
                      {artist}
                    </p>
                  </div>

                  <div className='flex-1 text-right'>
                    <p
                      className={`font-semibold ${
                        currentSong?.id === song.id ? 'text-green-500' : ''
                      }`}
                    >
                      {songDurations[song.id] ? formatTime(songDurations[song.id]) : '--:--'}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          ))
        ) : (
          <h2 className='text-center text-2xl my-2'>No songs yet</h2>
        )}
      </ul>
    </div>
  );
}
