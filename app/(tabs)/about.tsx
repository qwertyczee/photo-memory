import { View, Text, StyleSheet, SafeAreaView, ScrollView, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Photo Memory</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <Text style={styles.sectionText}>
            Photo Memory displays a single, randomly selected photo from your gallery each time you open the app, along with the date it was taken.
          </Text>
          <Text style={styles.sectionText}>
            This helps you rediscover forgotten memories and moments from your photo collection.
          </Text>
        </View>
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featureItem}>
            <Text style={styles.featureText}>• Random selection from your photo library</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureText}>• Display of photo capture date</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureText}>• Simple, elegant interface</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureText}>• Refresh to see a different memory</Text>
          </View>
        </View>
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          <Text style={styles.sectionText}>
            Your photos never leave your device. This app only accesses your photo library locally to display images within the app.
          </Text>
        </View>
        
        <Text style={styles.footer}>
          Created with ❤️ using React Native and Expo
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    padding: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#333333',
    marginBottom: 4,
  },
  version: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#888888',
  },
  sectionContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#333333',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#555555',
    lineHeight: 24,
    marginBottom: 10,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#555555',
    lineHeight: 24,
  },
  footer: {
    textAlign: 'center',
    marginVertical: 30,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#888888',
  },
});