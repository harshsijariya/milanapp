import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { profileAPI } from '../../utils/api';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    profileAPI
      .getMe()
      .then((res) => {
        const uri = res.data?.profileImage || res.data?.profileImages?.[0];
        if (uri) setAvatarUrl(uri);
      })
      .catch(() => {});
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#262626',
        tabBarInactiveTintColor: '#8E8E8E',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#EFEFEF',
          height: 54 + insets.bottom,
          paddingBottom: insets.bottom + 6,
          paddingTop: 10,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size + 4} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="likes"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'heart' : 'heart-outline'} size={size + 4} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shortlist"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'star' : 'star-outline'} size={size + 4} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, size, focused }) =>
            avatarUrl ? (
              <View style={[styles.avatarRing, focused && styles.avatarRingActive]}>
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} contentFit="cover" />
              </View>
            ) : (
              <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={size + 6} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  avatarRing: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#DBDBDB',
    overflow: 'hidden',
  },
  avatarRingActive: {
    borderWidth: 2,
    borderColor: '#262626',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
});
