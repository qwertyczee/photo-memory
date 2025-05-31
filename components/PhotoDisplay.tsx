import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { Photo } from '@/hooks/usePhotoGallery';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing, withSequence, withDelay } from 'react-native-reanimated';
import { RefreshCcw, ArrowLeft } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

type PhotoDisplayProps = {
  photo: Photo | null;
  loading: boolean;
  error: string | null;
  onNext: () => void;
  onPrevious: () => void;
  canShowPrevious: boolean;
};

export default function PhotoDisplay({ photo, loading, error, onNext, onPrevious, canShowPrevious }: PhotoDisplayProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1.05);
  const dateOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    if (photo && !loading) {
      opacity.value = 0;
      scale.value = 1.05;
      dateOpacity.value = 0;
      buttonOpacity.value = 0;
      
      opacity.value = withTiming(1, { duration: 800, easing: Easing.ease });
      scale.value = withTiming(1, { duration: 1000, easing: Easing.ease });
      dateOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
      buttonOpacity.value = withDelay(800, withTiming(1, { duration: 400 }));
    }
  }, [photo, loading]);

  const imageAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const dateAnimatedStyle = useAnimatedStyle(() => ({
    opacity: dateOpacity.value,
    transform: [{ translateY: withTiming(dateOpacity.value * 0 + (1 - dateOpacity.value) * 20, { duration: 600 }) }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading your memories...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onNext}>
          <Text style={styles.refreshButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!photo) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No photos found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.imageContainer, imageAnimatedStyle]}>
        <Image 
          source={{ uri: photo.uri }} 
          style={styles.image} 
          resizeMode="cover"
        />
      </Animated.View>
      
      <Animated.View style={[styles.dateContainer, dateAnimatedStyle]}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={60} tint="dark" style={styles.blurView}>
            <Text style={styles.dateText}>{formatDate(photo.creationTime)}</Text>
          </BlurView>
        ) : (
          <View style={styles.dateContainerAndroid}>
            <Text style={styles.dateText}>{formatDate(photo.creationTime)}</Text>
          </View>
        )}
      </Animated.View>

      <Animated.View style={[styles.buttonContainer, buttonAnimatedStyle]}>
        {canShowPrevious && (
          <TouchableOpacity 
            style={[styles.iconButton, styles.previousButton]} 
            onPress={onPrevious}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color="#ffffff" />
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={[styles.iconButton, styles.nextButton]} 
          onPress={onNext}
          activeOpacity={0.7}
        >
          <RefreshCcw size={24} color="#ffffff" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  imageContainer: {
    flex: 1,
    width: width,
    height: height,
  },
  image: {
    width: '100%',
    height: '100%',
    flex: 1,
  },
  dateContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  blurView: {
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  dateContainerAndroid: {
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  dateText: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333333',
    fontFamily: 'Inter-Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Inter-Regular',
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    height: 50,
    width: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  previousButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  nextButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
});