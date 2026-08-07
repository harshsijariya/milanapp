import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  InteractionManager,
} from "react-native";
import FormScroll from "../components/FormScroll";
import { colors } from "../components/theme";

import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authAPI } from "../utils/api";
import { Ionicons } from "@expo/vector-icons";
import { useGuardedRouter } from "../utils/useGuardedRouter";
import { isGoogleConfigured, signInWithGoogle } from "../utils/googleSignIn";

export default function LoginScreen() {
  const router = useGuardedRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const persistSession = async (data: any) => {
    if (data?.token) {
      await AsyncStorage.setItem("auth_token", data.token);
    }
    if (data?.expiresIn) {
      const expiryTime = new Date().getTime() + data.expiresIn;
      await AsyncStorage.setItem("token_expiry", expiryTime.toString());
    }
  };

  const onGooglePress = async () => {
    if (!isGoogleConfigured) {
      Alert.alert(
        "Google Sign-In not configured",
        "Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env, then rebuild the app.",
      );
      return;
    }

    setLoading(true);
    try {
      const idToken = await signInWithGoogle();
      if (!idToken) return; // user cancelled

      const res = await authAPI.googleAuth({ idToken });
      await persistSession(res.data);

      // Returning from Google's native account-picker Activity, Fabric is still
      // re-mounting this surface - navigating in that frame corrupts the view
      // tree ("addViewAt: The specified child already has a parent").
      setLoading(false);
      InteractionManager.runAfterInteractions(() => {
        router.replace("/(tabs)/home");
      });
      return;
    } catch (error: any) {
      console.error("Google Auth Error:", error);
      Alert.alert(
        "Google Login Failed",
        error.response?.data?.message ||
          error.response?.data?.detail ||
          error.message ||
          "Please try again",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.login({ email, password });

      await persistSession(response.data);
      await AsyncStorage.setItem("user_email", email);

      router.replace("/(tabs)/home");
    } catch (error: any) {
      console.error("Login Error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        error.message ||
        "Invalid credentials";
      Alert.alert("Login Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
        {/* FormScroll rather than KeyboardAvoidingView - see FormScroll for why
            the old version did nothing on Android. */}
        <FormScroll contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            testID="login-back-btn"
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#262626" />
          </TouchableOpacity>

          <View style={styles.header}>
            {/* Solid brand fill, matching the button below and the landing
                screen's background - the gradient made the logo a third shade
                on a screen that only needs one. */}
            <View style={styles.logoSquare}>
              <Ionicons name="heart" size={36} color={colors.white} />
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Login to continue your journey</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#8E8E8E"
                style={styles.inputIcon}
              />
              <TextInput
                testID="login-email-input"
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#8E8E8E"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#8E8E8E"
                style={styles.inputIcon}
              />
              <TextInput
                testID="login-password-input"
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#8E8E8E"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#8E8E8E"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity testID="login-forgot-btn" activeOpacity={0.7}>
              <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Primary button - same pink used for the primary action on Create Account */}
            <TouchableOpacity
              testID="login-submit-btn"
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {/* Flat brand fill rather than a gradient: the landing screen
                  this button is reached from is a solid #F43F5E, and a
                  pink-to-rose sweep beside it read as a different product. */}
              <View style={[styles.loginButton, loading && styles.buttonDisabled]}>
                <Text style={styles.loginButtonText}>
                  {loading ? "Logging in..." : "Log in"}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity
              testID="login-google-btn"
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
            testID="login-register-link"
            style={styles.registerButton}
            onPress={() => router.push("/register")}
            activeOpacity={0.8}
          >
            <Text style={styles.registerButtonText}>
              Don&apos;t have an account? Sign up
            </Text>
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
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
  },
  backButton: {
    marginBottom: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 28,
  },
  logoSquare: {
    backgroundColor: colors.brand,
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#262626",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#8E8E8E",
  },
  formContainer: {
    gap: 12,
  },
  inputContainer: {
    backgroundColor: "#FAFAFA",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DBDBDB",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: "#262626",
  },
  eyeIcon: {
    padding: 8,
  },
  forgotPassword: {
    color: "#0095F6",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
  },
  loginButton: {
    backgroundColor: colors.brand,
    paddingVertical: 15,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  loginButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 4,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#EFEFEF",
  },
  dividerText: {
    color: "#8E8E8E",
    fontSize: 13,
    fontWeight: "600",
  },
  googleButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DBDBDB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  googleButtonText: {
    color: "#262626",
    fontSize: 15,
    fontWeight: "600",
  },
  registerButton: {
    marginTop: 24,
    paddingVertical: 13,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#0095F6",
    alignItems: "center",
  },
  registerButtonText: {
    color: "#0095F6",
    fontSize: 15,
    fontWeight: "600",
  },
  footerBrand: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 24,
    marginBottom: 16,
  },
  footerBrandText: {
    color: "#8E8E8E",
    fontSize: 13,
    fontWeight: "600",
  },
});
