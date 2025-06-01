import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { usePhotoGallery } from '@/hooks/usePhotoGallery';
import PhotoDisplay from '@/components/PhotoDisplay';
import { StatusBar } from 'expo-status-bar';

export default function MemoryScreen() {
  const {
    loading,
    error,
    currentPhoto,
    canShowPrevious,
    showNextRandomPhoto,
    showPreviousPhoto,
    refresh,
  } = usePhotoGallery();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <PhotoDisplay
        photo={currentPhoto}
        loading={loading}
        error={error}
        onNext={showNextRandomPhoto}
        onPrevious={showPreviousPhoto}
        canShowPrevious={canShowPrevious}
        onRetry={refresh}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});