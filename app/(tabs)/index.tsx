import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
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