import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useGuardedRouter } from '../utils/useGuardedRouter';

export default function WelcomeScreen() {
  const router = useGuardedRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      router.replace('/(tabs)/home');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoSection}>
        <Ionicons name="heart" size={52} color="#FFFFFF" />
        <Text style={styles.logoText}>Gahoi Milan</Text>
      </View>

      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={styles.pillButton}
          onPress={() => router.push('/login')}
          activeOpacity={0.85}
        >
          <Ionicons name="log-in-outline" size={20} color="#262626" style={styles.pillIcon} />
          <Text style={styles.pillButtonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.pillButton}
          onPress={() => router.push('/register')}
          activeOpacity={0.85}
        >
          <Ionicons name="person-add-outline" size={20} color="#262626" style={styles.pillIcon} />
          <Text style={styles.pillButtonText}>Create new account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F43F5E',
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: 100,
    paddingBottom: 48,
  },
  logoSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  buttonSection: {
    gap: 14,
  },
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 16,
  },
  pillIcon: {
    position: 'absolute',
    left: 22,
  },
  pillButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#262626',
  },
});
