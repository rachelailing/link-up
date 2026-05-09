import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Image, ScrollView } from 'react-native';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header/Brand */}
        <View style={styles.header}>
          <View style={styles.brandContainer}>
            <Image 
              source={require('./assets/icon.png')} 
              style={styles.logo} 
            />
            <Text style={styles.brandText}>Link <Text style={styles.brandBold}>Up</Text></Text>
          </View>
        </View>

        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.pill}>
            <View style={styles.dot} />
            <Text style={styles.pillText}>Campus-based platform</Text>
          </View>
          
          <Text style={styles.title}>Earn & hire safely within your campus.</Text>
          <Text style={styles.subtitle}>
            Connect with campus employers for gigs and projects — with trust built-in.
          </Text>

          <View style={styles.ctaContainer}>
            <TouchableOpacity style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Find side hustles</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Post a job</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Stats/Features */}
        <View style={styles.features}>
          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>Unified Dashboard</Text>
            <Text style={styles.featureDesc}>Manage your jobs and earnings in one place.</Text>
          </View>
          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>Trust + Ratings</Text>
            <Text style={styles.featureDesc}>Built-in verification and student feedback.</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    marginRight: 10,
  },
  brandText: {
    fontSize: 20,
    color: '#0F172A',
  },
  brandBold: {
    fontWeight: 'bold',
  },
  hero: {
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4F46E5',
    marginRight: 8,
  },
  pillText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  ctaContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  secondaryButtonText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '600',
  },
  features: {
    paddingHorizontal: 24,
    gap: 16,
  },
  featureCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
  },
  featureDesc: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
});
