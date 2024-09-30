import { useState } from 'react';
import AlbumDetails from './AlbumDetails';
import SongDetails from './SongDetails';
import { useModal } from '../../context/Modal';

const UploadSongModal = () => {
  const { closeModal } = useModal()
  const [albumId, setAlbumId] = useState('');

  return (
    <div className='p-4 bg-card min-w-[40vw] max-h-[80vh] overflow-y-auto'>
      <h2 className='text-2xl font-bold mb-4'>Upload Your Song</h2>
      <AlbumDetails setAlbumId={setAlbumId} />
      <SongDetails albumId={albumId} onClose={closeModal}/>
    </div>
  );
};

export default UploadSongModal;
