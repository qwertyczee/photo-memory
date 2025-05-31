import { useState, useEffect } from 'react';
import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';

export type Photo = {
  id: string;
  uri: string;
  creationTime: number;
  width: number;
  height: number;
};

export function usePhotoGallery() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoHistory, setPhotoHistory] = useState<Photo[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number>(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    async function getPermissions() {
      try {
        setLoading(true);
        const { status } = await MediaLibrary.requestPermissionsAsync();
        setHasPermission(status === 'granted');
        
        if (status === 'granted') {
          await loadPhotos();
        } else {
          setError('Permission to access media library was denied');
          setLoading(false);
        }
      } catch (err) {
        setError('Failed to get permissions');
        setLoading(false);
      }
    }

    getPermissions();
  }, []);

  async function loadPhotos() {
    try {
      if (Platform.OS === 'web') {
        const demoPhotos = getDemoPhotos();
        setPhotos(demoPhotos);
        const initialPhoto = demoPhotos[Math.floor(Math.random() * demoPhotos.length)];
        setPhotoHistory([initialPhoto]);
        setCurrentPhotoIndex(0);
        setLoading(false);
        return;
      }

      const assets = await MediaLibrary.getAssetsAsync({
        mediaType: 'photo',
        first: 100,
        sortBy: [MediaLibrary.SortBy.creationTime],
      });

      if (assets.assets.length === 0) {
        setError('No photos found in your gallery');
        setLoading(false);
        return;
      }

      const mappedPhotos = assets.assets.map(asset => ({
        id: asset.id,
        uri: asset.uri,
        creationTime: asset.creationTime,
        width: asset.width,
        height: asset.height,
      }));

      setPhotos(mappedPhotos);
      const initialPhoto = mappedPhotos[Math.floor(Math.random() * mappedPhotos.length)];
      setPhotoHistory([initialPhoto]);
      setCurrentPhotoIndex(0);
      setLoading(false);
    } catch (err) {
      setError('Failed to load photos');
      setLoading(false);
    }
  }

  function showNextRandomPhoto() {
    if (photos.length === 0) return;
    
    let newPhoto: Photo;
    do {
      newPhoto = photos[Math.floor(Math.random() * photos.length)];
    } while (
      photoHistory.length > 0 &&
      newPhoto.id === photoHistory[photoHistory.length - 1].id
    );

    setPhotoHistory(prev => [...prev, newPhoto]);
    setCurrentPhotoIndex(prev => prev + 1);
  }

  function showPreviousPhoto() {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(prev => prev - 1);
    }
  }

  const canShowPrevious = currentPhotoIndex > 0;
  const currentPhoto = photoHistory[currentPhotoIndex];

  function getDemoPhotos(): Photo[] {
    return [
      {
        id: '1',
        uri: 'https://images.pexels.com/photos/2486168/pexels-photo-2486168.jpeg',
        creationTime: new Date('2023-01-15').getTime(),
        width: 1200,
        height: 800,
      },
      {
        id: '2',
        uri: 'https://images.pexels.com/photos/1591382/pexels-photo-1591382.jpeg',
        creationTime: new Date('2023-02-22').getTime(),
        width: 1200,
        height: 800,
      },
      {
        id: '3',
        uri: 'https://images.pexels.com/photos/1292115/pexels-photo-1292115.jpeg',
        creationTime: new Date('2023-03-10').getTime(),
        width: 1200,
        height: 800,
      },
    ];
  }

  return {
    loading,
    error,
    currentPhoto,
    canShowPrevious,
    showNextRandomPhoto,
    showPreviousPhoto,
    hasPermission,
  };
}