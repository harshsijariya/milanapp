import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useGuardedRouter } from '../utils/useGuardedRouter';
import { colors } from '../components/theme';

export default function WelcomeScreen() {
  const router = useGuardedRouter();
  const [checking, setChecking] = useState(true);

  /**
   * On focus, not on mount.
   *
   * This screen is the root route, so it stays mounted underneath everything
   * else. A mount-only check meant that anything landing back here - closing
   * profile setup, or Android recreating the process after the photo picker -
   * showed Login/Create account to someone who was still signed in. It read as
   * having been logged out, and tapping "Create new account" then really did
   * start a second account.
   */
  useFocusEffect(
    useCallback(() => {
      let active = true;

      (async () => {
        const token = await AsyncStorage.getItem('auth_token');
        if (!active) return;

        if (token) router.replace('/(tabs)/home');
        else setChecking(false);
      })();

      return () => {
        active = false;
      };
    }, [router]),
  );

  // Holding the screen blank until the token is read avoids flashing the
  // logged-out buttons at a signed-in user for a frame.
  if (checking) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color="#FFFFFF" />
      </View>
    );
  }

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
    backgroundColor: colors.brand,
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: 100,
    paddingBottom: 48,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
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
