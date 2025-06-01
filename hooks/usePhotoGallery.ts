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
  const [totalPhotosCount, setTotalPhotosCount] = useState<number>(0);
  const [photoHistory, setPhotoHistory] = useState<Photo[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number>(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [usedIndices, setUsedIndices] = useState<Set<number>>(new Set());

  useEffect(() => {
    async function getPermissions() {
      try {
        setLoading(true);
        const { status } = await MediaLibrary.requestPermissionsAsync();
        setHasPermission(status === 'granted');
        
        if (status === 'granted') {
          await loadPhotosCount();
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

  async function loadPhotosCount() {
    try {
      if (Platform.OS === 'web') {
        setError('Web platform is not supported');
        setLoading(false);
        return;
      }

      // Zjistíme jen celkový počet fotek
      const assets = await MediaLibrary.getAssetsAsync({
        mediaType: 'photo',
        first: 1, // Načteme jen jednu pro zjištění celkového počtu
      });

      if (assets.totalCount === 0) {
        setError('No photos found in your gallery');
        setLoading(false);
        return;
      }

      setTotalPhotosCount(assets.totalCount);
      
      // Načteme první náhodnou fotku
      await loadRandomPhoto(true);
      
      setLoading(false);
    } catch (err) {
      setError('Failed to load photos count');
      setLoading(false);
    }
  }

  async function loadRandomPhoto(isInitial = false) {
    try {
      if (totalPhotosCount === 0) return;
      
      let randomIndex: number;
      let attempts = 0;
      const maxAttempts = 100; // Zabránění nekonečné smyčky
      
      // Pokud už jsme použili všechny indexy, resetujeme
      if (usedIndices.size >= totalPhotosCount) {
        setUsedIndices(new Set());
      }
      
      // Najdeme náhodný index, který jsme ještě nepoužili
      do {
        randomIndex = Math.floor(Math.random() * totalPhotosCount);
        attempts++;
      } while (usedIndices.has(randomIndex) && attempts < maxAttempts);
      
      // Načteme konkrétní fotku podle indexu
      const assets = await MediaLibrary.getAssetsAsync({
        mediaType: 'photo',
        first: 1,
        after: randomIndex > 0 ? `${randomIndex - 1}` : undefined,
      });
      
      if (assets.assets.length === 0) {
        // Fallback - načteme fotku podle přesného indexu jinak
        const fallbackAssets = await MediaLibrary.getAssetsAsync({
          mediaType: 'photo',
          first: randomIndex + 1,
        });
        
        if (fallbackAssets.assets.length > randomIndex) {
          const asset = fallbackAssets.assets[randomIndex];
          const photo = mapAssetToPhoto(asset);
          handlePhotoLoaded(photo, randomIndex, isInitial);
        }
      } else {
        const asset = assets.assets[0];
        const photo = mapAssetToPhoto(asset);
        handlePhotoLoaded(photo, randomIndex, isInitial);
      }
    } catch (err) {
      setError('Failed to load random photo');
    }
  }

  function mapAssetToPhoto(asset: MediaLibrary.Asset): Photo {
    return {
      id: asset.id,
      uri: asset.uri,
      creationTime: asset.creationTime,
      width: asset.width,
      height: asset.height,
    };
  }

  function handlePhotoLoaded(photo: Photo, index: number, isInitial: boolean) {
    setUsedIndices(prev => new Set([...prev, index]));
    
    if (isInitial) {
      setPhotoHistory([photo]);
      setCurrentPhotoIndex(0);
    } else {
      setPhotoHistory(prev => [...prev, photo]);
      setCurrentPhotoIndex(prev => prev + 1);
    }
  }

  function showNextRandomPhoto() {
    if (totalPhotosCount === 0) return;
    loadRandomPhoto();
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
    totalPhotos: totalPhotosCount,
    remainingPhotosCount: totalPhotosCount - usedIndices.size,
  };
}