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
  const [remainingPhotos, setRemainingPhotos] = useState<Photo[]>([]);

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
        setError('Web platform is not supported');
        setLoading(false);
        return;
      }

      // Načítáme všechny fotky z galerie
      let allAssets: MediaLibrary.Asset[] = [];
      let hasNextPage = true;
      let after;

      while (hasNextPage) {
        const assets = await MediaLibrary.getAssetsAsync({
          mediaType: 'photo',
          first: 1000, // Načítáme po dávkách
          after: after,
        });

        allAssets = [...allAssets, ...assets.assets];
        hasNextPage = assets.hasNextPage;
        after = assets.endCursor;
      }

      if (allAssets.length === 0) {
        setError('No photos found in your gallery');
        setLoading(false);
        return;
      }

      const mappedPhotos = allAssets.map(asset => ({
        id: asset.id,
        uri: asset.uri,
        creationTime: asset.creationTime,
        width: asset.width,
        height: asset.height,
      }));

      setPhotos(mappedPhotos);
      setRemainingPhotos([...mappedPhotos]);
      
      // Vybereme náhodnou první fotku
      const randomIndex = Math.floor(Math.random() * mappedPhotos.length);
      const initialPhoto = mappedPhotos[randomIndex];
      
      setPhotoHistory([initialPhoto]);
      setCurrentPhotoIndex(0);
      
      // Odebereme první fotku ze zbývajících
      const updatedRemaining = mappedPhotos.filter(
        photo => photo.id !== initialPhoto.id
      );
      setRemainingPhotos(updatedRemaining);
      
      setLoading(false);
    } catch (err) {
      setError('Failed to load photos');
      setLoading(false);
    }
  }

  function showNextRandomPhoto() {
    if (photos.length === 0) return;
    
    let photosToChooseFrom = remainingPhotos;
    
    // Pokud už nejsou žádné zbývající fotky, resetujeme seznam
    if (remainingPhotos.length === 0) {
      photosToChooseFrom = [...photos];
      setRemainingPhotos([...photos]);
    }
    
    // Vybereme náhodnou fotku ze zbývajících
    const randomIndex = Math.floor(Math.random() * photosToChooseFrom.length);
    const newPhoto = photosToChooseFrom[randomIndex];
    
    // Přidáme fotku do historie
    setPhotoHistory(prev => [...prev, newPhoto]);
    setCurrentPhotoIndex(prev => prev + 1);
    
    // Odebereme fotku ze zbývajících
    const updatedRemaining = photosToChooseFrom.filter(
      photo => photo.id !== newPhoto.id
    );
    setRemainingPhotos(updatedRemaining);
  }

  function showPreviousPhoto() {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(prev => prev - 1);
    }
  }

  const canShowPrevious = currentPhotoIndex > 0;
  const currentPhoto = photoHistory[currentPhotoIndex];

  return {
    loading,
    error,
    currentPhoto,
    canShowPrevious,
    showNextRandomPhoto,
    showPreviousPhoto,
    hasPermission,
    totalPhotos: photos.length,
    remainingPhotosCount: remainingPhotos.length,
  };
}