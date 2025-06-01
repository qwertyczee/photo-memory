import { useState, useEffect, useCallback } from 'react'; // Přidán useCallback
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
  const [loading, setLoading] = useState(true); // Jednotný stav načítání
  const [error, setError] = useState<string | null>(null);
  const [totalPhotosCount, setTotalPhotosCount] = useState<number>(0);
  const [photoHistory, setPhotoHistory] = useState<Photo[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number>(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [usedIndices, setUsedIndices] = useState<Set<number>>(new Set());

  // Pomocná funkce pro mapování assetu na Photo typ
  const mapAssetToPhoto = useCallback((asset: MediaLibrary.Asset): Photo => {
    return {
      id: asset.id,
      uri: asset.uri,
      creationTime: asset.creationTime,
      width: asset.width,
      height: asset.height,
    };
  }, []);

  // Funkce pro nahrání náhodné fotky
  const loadRandomPhoto = useCallback(async (isInitial = false) => {
    try {
      // Zobrazit indikátor načítání a vyčistit chyby, pokud se nejedná o počáteční načítání
      if (!isInitial) {
        setLoading(true);
        setError(null);
      }

      if (totalPhotosCount === 0) {
        setError('No photos available in your gallery.');
        return;
      }

      let randomIndex: number;
      let attempts = 0;
      const maxAttempts = 50; // Omezení pokusů pro nalezení unikátního indexu

      // Pokud byly všechny indexy použity, resetujeme `usedIndices` pro další cyklus
      if (usedIndices.size >= totalPhotosCount) {
        setUsedIndices(new Set());
        console.log("All photos shown, resetting history to allow repetition.");
      }

      // Najdeme náhodný index, který jsme ještě v tomto cyklu nepoužili
      do {
        randomIndex = Math.floor(Math.random() * totalPhotosCount);
        attempts++;
        if (attempts > maxAttempts) {
          console.warn("Max attempts reached for finding a unique random index. Using potentially repeated index.");
          break; // Předejdeme nekonečné smyčce
        }
      } while (usedIndices.has(randomIndex));

      // Jediný spolehlivý způsob, jak získat N-tou fotku s MediaLibrary, je načíst N+1 fotek a vzít poslední.
      // sortBy je klíčové pro zajištění konzistentního pořadí.
      const assetsResult = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.photo, // Explicitně MediaType.photo
        first: randomIndex + 1, // Načíst dostatek assetů k dosažení požadovaného indexu
        sortBy: ['creationTime'], // Důležité pro konzistentní "N-tou" fotku
        // Můžete zkusit i 'modificationTime' nebo 'id' pro sortBy, pokud creationTime není ideální
      });

      if (assetsResult.assets.length > randomIndex) {
        const asset = assetsResult.assets[randomIndex];
        const photo = mapAssetToPhoto(asset);

        setUsedIndices(prev => new Set([...prev, randomIndex]));

        if (isInitial) {
          setPhotoHistory([photo]);
          setCurrentPhotoIndex(0);
        } else {
          setPhotoHistory(prev => [...prev, photo]);
          setCurrentPhotoIndex(prev => prev + 1);
        }
      } else {
        // Toto by se nemělo stávat, pokud je totalPhotosCount přesný, ale pro robustnost
        setError('Failed to retrieve photo at selected random index. Please try again.');
        console.error(`Error: Could not retrieve photo at index ${randomIndex}. Fetched ${assetsResult.assets.length} assets, but expected at least ${randomIndex + 1}. Total count: ${totalPhotosCount}`);
      }
    } catch (err: any) {
      console.error("Error loading random photo:", err);
      setError(`Failed to load random photo: ${err.message || 'Unknown error'}`);
    } finally {
      // Vždy ukončit stav načítání po pokusu o načtení fotky
      setLoading(false);
    }
  }, [totalPhotosCount, usedIndices, mapAssetToPhoto]); // Přidány závislosti pro useCallback

  // Funkce pro načtení celkového počtu fotek (voláno jednou na začátku)
  const loadPhotosCount = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        setError('Web platform is not supported for MediaLibrary.');
        setLoading(false);
        return;
      }

      const assets = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.photo,
        first: 1, // Stačí načíst jednu pro získání celkového počtu
      });

      if (assets.totalCount === 0) {
        setError('No photos found in your gallery.');
        setLoading(false);
        return;
      }

      setTotalPhotosCount(assets.totalCount);
      await loadRandomPhoto(true); // Načíst první náhodnou fotku
    } catch (err: any) {
      setError(`Failed to load photos count: ${err.message || 'Unknown error'}`);
      setLoading(false);
    }
  }, [loadRandomPhoto]); // loadRandomPhoto je závislost

  // useEffect pro získání oprávnění a počáteční načtení
  useEffect(() => {
    async function getPermissions() {
      setLoading(true); // Začít načítání pro oprávnění a počáteční data
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        setHasPermission(status === 'granted');
        
        if (status === 'granted') {
          await loadPhotosCount();
        } else {
          setError('Permission to access media library was denied. Please grant permission in settings to view photos.');
          setLoading(false); // Ukončit načítání, pokud oprávnění není uděleno
        }
      } catch (err: any) {
        setError(`Failed to get permissions: ${err.message || 'Unknown error'}`);
        setLoading(false); // Ukončit načítání na chybě
      }
    }

    getPermissions();
  }, [loadPhotosCount]); // loadPhotosCount je závislost

  // Funkce pro zobrazení další náhodné fotky
  const showNextRandomPhoto = useCallback(() => {
    if (loading) return; // Zabránit vícenásobným kliknutím, pokud se již načítá
    loadRandomPhoto(); // loadRandomPhoto již handled setLoading(true/false)
  }, [loading, loadRandomPhoto]);

  // Funkce pro zobrazení předchozí fotky z historie
  const showPreviousPhoto = useCallback(() => {
    if (currentPhotoIndex > 0 && !loading) { // Povolit pouze, pokud je historie a nic se nenačítá
      setLoading(true); // Označit, že se načítá předchozí fotka
      setError(null); // Vyčistit chyby
      setCurrentPhotoIndex(prev => {
        setLoading(false); // Ukončit načítání po aktualizaci stavu
        return prev - 1;
      });
    }
  }, [currentPhotoIndex, loading]);

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
    remainingPhotosCount: totalPhotosCount - usedIndices.size, // Počet fotek, které ještě nebyly zobrazeny v aktuálním cyklu
  };
}