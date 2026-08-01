import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
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
        </Stack>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
