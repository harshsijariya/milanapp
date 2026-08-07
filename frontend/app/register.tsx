import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert, InteractionManager } from 'react-native';
import FormScroll from '../components/FormScroll';
import FormField from '../components/FormField';
import { colors } from '../components/theme';

import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../utils/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useGuardedRouter } from '../utils/useGuardedRouter';
import { isGoogleConfigured, signInWithGoogle } from '../utils/googleSignIn';

export default function RegisterScreen() {
  const router = useGuardedRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onGooglePress = async () => {
    if (!isGoogleConfigured) {
      Alert.alert(
        'Google Sign-In not configured',
        'Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env, then rebuild the app.'
      );
      return;
    }

    setLoading(true);
    try {
      const idToken = await signInWithGoogle();
      if (!idToken) return; // user cancelled

      const res = await authAPI.googleAuth({ idToken });

      await AsyncStorage.setItem('auth_token', res.data.token);
      if (res.data.expiresIn) {
        const expiryTime = new Date().getTime() + res.data.expiresIn;
        await AsyncStorage.setItem('token_expiry', expiryTime.toString());
      }

      // Returning from Google's native account-picker Activity, Fabric is still
      // re-mounting this surface - navigating in that frame corrupts the view
      // tree ("addViewAt: The specified child already has a parent").
      setLoading(false);
      InteractionManager.runAfterInteractions(() => {
        // New Google accounts land on profile setup to fill in the rest.
        router.replace('/profile-setup?first=1');
      });
      return;
    } catch (error: any) {
      console.error('Google Auth Error:', error);
      Alert.alert(
        'Google Signup Failed',
        error.response?.data?.message ||
          error.response?.data?.detail ||
          error.message ||
          'Please try again'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword || !mobileNumber) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    const mobilePattern = /^[0-9]{10}$/;
    if (!mobilePattern.test(mobileNumber.replace(/[^0-9]/g, ''))) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.register({ name, email, password, mobileNo: mobileNumber });

      const token = response.data?.token || response.data || '';
      const user = response.data?.user || { email, name };

      if (typeof token === 'string' && token.length > 0) {
        await AsyncStorage.setItem('auth_token', token);
      }
      await AsyncStorage.setItem('user_data', JSON.stringify(user));
      await AsyncStorage.setItem('temp_mobile', mobileNumber);

      router.replace('/profile-setup?first=1');
    } catch (error: any) {
      console.error('Caught error in handleRegister:', error);
      if (error.response?.status === 409) {
        Alert.alert('Account Exists', 'An account with this email or mobile number already exists. Please login instead.');
      } else {
        const errMsg = error.response?.data?.detail || error.message || 'Please try again';
        Alert.alert('Registration Failed', errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* FormScroll, not KeyboardAvoidingView: behavior was `undefined` on
          Android, so it did nothing at all - which is why the confirm-password
          field sat under the keyboard. */}
      <FormScroll contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          testID="register-back-btn"
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#262626" />
        </TouchableOpacity>

        <View style={styles.header}>
          {/* Solid brand fill - see login.tsx. */}
          <View style={styles.logoSquare}>
            <Ionicons name="people" size={36} color={colors.white} />
          </View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join us to find your perfect match</Text>
        </View>

        <View style={styles.formContainer}>
          <FormField
            testID="register-name-input"
            icon="person-outline"
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
            autoComplete="name"
            textContentType="name"
          />

          <FormField
            testID="register-email-input"
            icon="mail-outline"
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
          />

          <FormField
            testID="register-mobile-input"
            icon="call-outline"
            placeholder="Mobile Number"
            value={mobileNumber}
            onChangeText={setMobileNumber}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
          />

          <FormField
            testID="register-password-input"
            icon="lock-closed-outline"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secure
            autoComplete="new-password"
            textContentType="newPassword"
          />

          <FormField
            testID="register-confirm-password-input"
            icon="shield-checkmark-outline"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secure
            autoComplete="new-password"
            textContentType="newPassword"
          />

          {/* Primary button - same pink used for the primary action button on Complete Your Profile */}
          <TouchableOpacity
            testID="register-submit-btn"
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {/* Flat brand fill, matching the landing screen and the Log in
                button - see login.tsx for why the gradient went. */}
            <View style={[styles.registerButton, loading && styles.buttonDisabled]}>
              <Text style={styles.registerButtonText}>{loading ? 'Creating Account...' : 'Sign up'}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity
            testID="register-google-btn"
            style={[styles.googleButton, loading && styles.buttonDisabled]}
            activeOpacity={0.8}
            disabled={loading}
            onPress={onGooglePress}
          >
            <Ionicons name="logo-google" size={20} color="#EA4335" />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          testID="register-login-link"
          style={styles.loginButton}
          onPress={() => router.push('/login')}
          activeOpacity={0.8}
        >
          <Text style={styles.loginButtonText}>Already have an account? Log in</Text>
        </TouchableOpacity>

        <View style={styles.footerBrand}>
          <Ionicons name="heart" size={14} color="#DBDBDB" />
          <Text style={styles.footerBrandText}>Gahoi Milan</Text>
        </View>
      </FormScroll>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  backButton: {
    marginBottom: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoSquare: {
    backgroundColor: colors.brand,
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#262626',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E8E',
  },
  formContainer: {
    gap: 12,
  },
  registerButton: {
    backgroundColor: colors.brand,
    paddingVertical: 15,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  registerButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#EFEFEF',
  },
  dividerText: {
    color: '#8E8E8E',
    fontSize: 13,
    fontWeight: '600',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DBDBDB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  googleButtonText: {
    color: '#262626',
    fontSize: 15,
    fontWeight: '600',
  },
  loginButton: {
    marginTop: 24,
    paddingVertical: 13,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#0095F6',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#0095F6',
    fontSize: 15,
    fontWeight: '600',
  },
  footerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
    marginBottom: 16,
  },
  footerBrandText: {
    color: '#8E8E8E',
    fontSize: 13,
    fontWeight: '600',
  },
});
