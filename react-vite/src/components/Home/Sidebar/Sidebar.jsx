import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchMyPlaylists, selectMyPlaylistsArray } from '../../../redux/myPlaylists';
import { selectLikedPlaylist, fetchLikedPlaylist } from '../../../redux/liked';
import { fetchLibrary, selectLibraryPlaylist } from '../../../redux/library';
import { useEffect } from 'react';
import { SquarePlus } from 'lucide-react';
import CreatePlaylistForm from '../../ManagePlaylists/CreatePlaylistForm';

import { useModal } from '../../../context/Modal';
import { fetchAllSongs } from '../../../redux/songs';

const Sidebar = () => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.session.user);
  const playlists = useSelector(selectMyPlaylistsArray);
  const liked = useSelector(selectLikedPlaylist);
  const library = useSelector(selectLibraryPlaylist);
  const { setModalContent } = useModal();

  useEffect(() => {
    if (user) {
      dispatch(fetchLikedPlaylist());
      dispatch(fetchLibrary());
      dispatch(fetchMyPlaylists());
      dispatch(fetchAllSongs())
    }
  }, [dispatch, user]);

  return (
    <>
      {user && (
        <div className='absolute rounded-md top-20 left-4 h-3/4'>
          <div className='flex flex-col h-full bg-secondary rounded-md items-center  overflow-y-auto overflow-x-clip scrollbar-thin scrollbar-thumb-primary scrollbar-thumb-rounded-full scrollbar-track-transparent'>
            <div className='flex flex-col justify-between items-center'>
              <div className='flex flex-col p-4 gap-4'>
                <Link
                  to={`/playlist/${library.id}`}
                  title={library.name}
                >
                  <img
                    className='w-12 h-12 rounded-md border border-muted hover:border-accent hover:scale-125 transition-all duration-200'
                    src='/library.jpeg'
                    alt='library logo for library'
                  />
                </Link>
              </div>

              <div className='flex flex-col p-4 gap-4'>
                <Link
                  to={`/playlist/${liked.id}`}
                  title={liked?.name}
                >
                  <img
                    className='w-12 h-12 rounded-md border border-muted hover:border-accent hover:scale-125 transition-all duration-200'
                    src='/liked.jpeg'
                    alt='heart logo for favorites playlist'
                  />
                </Link>
              </div>

              <div className='flex flex-col p-4 hover:scale-125 transition-transform duration-200'>
                <button
                  onClick={() => setModalContent(<CreatePlaylistForm />)}
                  className='bg-card flex justify-center items-center rounded-md'
                >
                  <SquarePlus
                    className='text-primary bg-secondary'
                    size={54}
                  />
                </button>
              </div>
            </div>

            <div className='flex flex-col h-full rounded-b-md w-full items-center justify-start'>
              {playlists?.length
                ? playlists?.map(playlist => (
                    <div
                      key={playlist?.id}
                      className='flex flex-col p-4 gap-4'
                    >
                      <Link
                        to={`/playlist/${playlist?.id}`}
                        title={playlist?.name}
                      >
                        <img
                          className='w-12 h-12 rounded-md border border-muted hover:border-accent hover:scale-125 transition-all duration-200'
                          src='/playlist.jpeg'
                          alt='heart logo for favorites playlist'
                        />
                      </Link>
                    </div>
                  ))
                : ''}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
