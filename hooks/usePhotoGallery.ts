// hooks/usePhotoGallery.ts
import { useState, useEffect, useCallback } from 'react';
import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';

export type Photo = {
  id: string;
  uri: string;
  creationTime: number;
  width: number;
  height: number;
};

const mapAssetToPhoto = (asset: MediaLibrary.Asset): Photo => ({
  id: asset.id,
  uri: asset.uri,
  creationTime: asset.creationTime,
  width: asset.width,
  height: asset.height,
});

export function usePhotoGallery() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPhotosCount, setTotalPhotosCount] = useState<number>(0);
  const [photoHistory, setPhotoHistory] = useState<Photo[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number>(-1);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [usedIndices, setUsedIndices] = useState<Set<number>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0); // Klíč pro manuální refresh

  // Efekt pro inicializaci a načtení první fotky
  useEffect(() => {
    const initializeAndLoadFirst = async () => {
      console.log('Initializing gallery (refreshKey:', refreshKey, ')');
      setLoading(true);
      setError(null);
      setCurrentPhotoIndex(-1); // Reset
      setPhotoHistory([]);      // Reset
      const localInitialUsedIndices = new Set<number>(); // Začínáme s prázdnými pro tuto (re)inicializaci
      // setUsedIndices(localInitialUsedIndices); // Nastavíme až po úspěšném načtení první fotky


      if (Platform.OS === 'web') {
        setError('Web platform is not supported');
        setHasPermission(false);
        setLoading(false);
        return;
      }

      try {
        const perm = await MediaLibrary.requestPermissionsAsync();
        if (perm.status !== 'granted') {
          setError('Permission to access media library was denied. Please enable it in settings.');
          setHasPermission(false);
          setLoading(false);
          return;
        }
        setHasPermission(true);

        const assetsSummary = await MediaLibrary.getAssetsAsync({ mediaType: MediaLibrary.MediaType.photo, first: 1 });
        if (assetsSummary.totalCount === 0) {
          setError('No photos found in your gallery.'); // Správně
          setTotalPhotosCount(0);
          setUsedIndices(new Set()); // I když nejsou fotky, resetujme pro konzistenci
          setLoading(false);
          return;
        }
        setTotalPhotosCount(assetsSummary.totalCount);

        // Načtení první fotky
        let randomIndex = Math.floor(Math.random() * assetsSummary.totalCount);
        // Pro první fotku nemusíme kontrolovat localInitialUsedIndices, protože je prázdné.

        const assetsToFetch = randomIndex + 1;
        const assetsPage = await MediaLibrary.getAssetsAsync({
          mediaType: MediaLibrary.MediaType.photo,
          first: assetsToFetch,
          sortBy: MediaLibrary.SortBy.creationTime, // Můžete zvážit i jiné řazení, pokud je relevantní
        });

        if (assetsPage.assets && assetsPage.assets.length > randomIndex) {
          const asset = assetsPage.assets[randomIndex];
          const photo = mapAssetToPhoto(asset);
          
          setPhotoHistory([photo]);
          setCurrentPhotoIndex(0);
          localInitialUsedIndices.add(randomIndex);
          setUsedIndices(localInitialUsedIndices); // Aktualizujeme stav usedIndices
          setError(null); // Úspěch, vymažeme případnou předchozí chybu
        } else {
          console.error(`Failed to get asset at index ${randomIndex}. Fetched ${assetsPage.assets?.length} of ${assetsSummary.totalCount}`);
          setError('Failed to retrieve the first photo asset. The gallery might be empty or the index was out of bounds.');
          setUsedIndices(new Set()); // Reset
        }
      } catch (err: any) {
        console.error('Error during initialization or first load:', err);
        setError(`Initialization failed: ${err.message}`);
        setHasPermission(perm => perm ?? false); // Zachovat stávající, pokud už byl nastaven, jinak false
        setUsedIndices(new Set()); // Reset
      } finally {
        setLoading(false);
      }
    };

    initializeAndLoadFirst();
  }, [refreshKey]); // Tento useEffect běží jen při mountu a změně refreshKey

  const showNextRandomPhoto = useCallback(async () => {
    if (!hasPermission) {
      setError('Media library permission not granted.');
      setLoading(false); // Ukončit loading, pokud se sem dostaneme
      return;
    }
    // Pokud jsme na konci historie a nejsou další fotky k náhodnému výběru
    if (currentPhotoIndex >= photoHistory.length - 1 && usedIndices.size >= totalPhotosCount && totalPhotosCount > 0) {
        setError("You've seen all photos! Resetting for another round.");
        setUsedIndices(new Set()); // Reset a necháme uživatele zkusit znovu
        setLoading(false);
        return;
    }
    // Pokud jsme na konci historie A MÁME JEŠTĚ NEVIDĚNÉ FOTKY
    // nebo pokud chceme načíst novou náhodnou, i když nejsme na konci (např. tlačítko "další náhodná")
    if (currentPhotoIndex >= photoHistory.length - 1 || true /* Vždy načíst novou náhodnou pro "další" */) {
        if (totalPhotosCount === 0) {
            setError("No photos found in your gallery.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        let localTempUsedIndices = new Set(usedIndices);
        if (localTempUsedIndices.size >= totalPhotosCount && totalPhotosCount > 0) {
          console.log('All photos shown, resetting used indices for next random.');
          localTempUsedIndices = new Set<number>();
        }

        let randomIndex: number;
        let attempts = 0;
        const maxAttempts = Math.min(100, totalPhotosCount); // Omezení pokusů

        do {
          randomIndex = Math.floor(Math.random() * totalPhotosCount);
          attempts++;
        } while (localTempUsedIndices.has(randomIndex) && attempts < maxAttempts && localTempUsedIndices.size < totalPhotosCount);

        // Pokud jsme po max pokusech nenašli nepoužitý a stále jsou nepoužité, zkusíme najít první volný
        if (localTempUsedIndices.has(randomIndex) && localTempUsedIndices.size < totalPhotosCount && attempts >= maxAttempts) {
            let foundUnused = false;
            for (let i = 0; i < totalPhotosCount; i++) {
                if (!localTempUsedIndices.has(i)) {
                    randomIndex = i;
                    foundUnused = true;
                    break;
                }
            }
            if (!foundUnused) { // Mělo by být už pokryto resetem localTempUsedIndices
                 randomIndex = Math.floor(Math.random() * totalPhotosCount); // Absolutní fallback
            }
        }
        // Pokud ani po tomto nemáme nepoužitý index (a localTempUsedIndices nebylo resetováno), tak bereme náhodný
        if (localTempUsedIndices.has(randomIndex) && localTempUsedIndices.size >= totalPhotosCount) {
            randomIndex = Math.floor(Math.random() * totalPhotosCount); // Vezmeme jakýkoli, pokud jsme vše viděli a nerestartovali
        }


        try {
          const assetsToFetch = randomIndex + 1;
          const assetsPage = await MediaLibrary.getAssetsAsync({
            mediaType: MediaLibrary.MediaType.photo,
            first: assetsToFetch,
            sortBy: MediaLibrary.SortBy.creationTime,
          });

          if (assetsPage.assets && assetsPage.assets.length > randomIndex) {
            const asset = assetsPage.assets[randomIndex];
            const photo = mapAssetToPhoto(asset);
            
            setPhotoHistory(prevHistory => {
              // "Ořízneme" historii, pokud uživatel šel zpět a teď načítá novou "další" fotku
              const baseHistory = prevHistory.slice(0, currentPhotoIndex + 1);
              const newHistory = [...baseHistory, photo];
              setCurrentPhotoIndex(newHistory.length - 1);
              return newHistory;
            });

            const newUsedIndices = new Set(localTempUsedIndices); // Pracujeme s kopií z tohoto volání
            newUsedIndices.add(randomIndex);
            setUsedIndices(newUsedIndices); // Aktualizujeme hlavní stav
            setError(null);
          } else {
            throw new Error(`Failed to retrieve the next random photo asset (index ${randomIndex}).`);
          }
        } catch (err: any) {
          console.error('Error in showNextRandomPhoto:', err);
          setError(`Failed to load next photo: ${err.message}`);
        } finally {
          setLoading(false);
        }
    } else {
        // Uživatel byl v historii a jde dopředu na již načtenou fotku
        setCurrentPhotoIndex(prev => prev + 1);
        // setLoading(false) není potřeba, protože jsme nic nenačítali
    }
  }, [hasPermission, totalPhotosCount, usedIndices, photoHistory, currentPhotoIndex]);

  const showPreviousPhoto = useCallback(() => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(prev => prev - 1);
    }
  }, [currentPhotoIndex]);

  const refresh = useCallback(() => {
    console.log("Manually refreshing gallery...");
    setRefreshKey(prev => prev + 1);
  }, []);

  const currentPhoto = currentPhotoIndex >= 0 && photoHistory[currentPhotoIndex] ? photoHistory[currentPhotoIndex] : null;
  const canShowPrevious = currentPhotoIndex > 0;
  const remainingPhotosCount = totalPhotosCount > 0 ? Math.max(0, totalPhotosCount - usedIndices.size) : 0;

  return {
    loading,
    error,
    currentPhoto,
    canShowPrevious,
    showNextRandomPhoto,
    showPreviousPhoto,
    hasPermission,
    totalPhotos: totalPhotosCount,
    remainingPhotosCount,
    refresh,
  };
}