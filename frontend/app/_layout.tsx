import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import WebShell from '../components/WebShell';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* Caps the app to a readable column in a desktop browser. A no-op on
            native, so the phone builds are untouched. */}
        <WebShell>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="profile-setup" />
          <Stack.Screen name="edit-profile" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="search" />
          <Stack.Screen name="search-results" />
          <Stack.Screen name="profile-detail/[id]" />
          <Stack.Screen name="account-settings" />
          <Stack.Screen name="help-support" />
          <Stack.Screen name="hide-delete-profile" />
        </Stack>
        </WebShell>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
