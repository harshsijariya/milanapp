import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { profileAPI, authAPI } from '../../utils/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await profileAPI.getMe();
      setUser(response.data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleLogout = async () => {
    const performLogout = async () => {
      try {
        await authAPI.logout();
      } catch (error) {
        console.error('Logout API failed', error);
      }
      await AsyncStorage.clear();
      router.replace('/');
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout?')) {
        performLogout();
      }
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: performLogout,
          },
        ]
      );
    }
  };

  const menuItems = [
    { icon: 'person', title: 'My Profile', route: '/profile-detail/me', color: ['#14B8A6', '#0D9488'] },
    { icon: 'home', title: 'Home', route: '/(tabs)/home', color: ['#6366F1', '#8B5CF6'] },
    { icon: 'heart', title: 'Likes', route: '/(tabs)/likes', color: ['#EC4899', '#F43F5E'] },
    { icon: 'eye', title: 'Viewed by', route: '/views', color: ['#8B5CF6', '#6366F1'] },
    { icon: 'star', title: 'Shortlist', route: '/(tabs)/shortlist', color: ['#F59E0B', '#D97706'] },
    { icon: 'search', title: 'Advanced Search', route: '/search', color: ['#10B981', '#059669'] },
    { icon: 'share-social', title: 'Share Biodata', route: '/share', color: ['#3B82F6', '#2563EB'] },
    { icon: 'book', title: 'Digital Magazine', route: '/magazine', color: ['#8B5CF6', '#A855F7'] },
    { icon: 'diamond', title: 'Membership Plans', route: '/membership', color: ['#F59E0B', '#EAB308'] },
    { icon: 'trophy', title: 'Success Story', route: '/success', color: ['#EC4899', '#DB2777'] },
    { icon: 'people', title: '30+ Profiles', route: '/mature-profiles', color: ['#6366F1', '#4F46E5'] },
    { icon: 'heart-half', title: 'Divorce Profiles', route: '/divorce-profiles', color: ['#8B5CF6', '#7C3AED'] },
    { icon: 'accessibility', title: 'Disability Profiles', route: '/disability-profiles', color: ['#10B981', '#0EA472'] },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6366F1', '#8B5CF6']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#FFFFFF', '#F3F4F6']}
              style={styles.avatarCircle}
            >
              <Ionicons name="person" size={48} color="#8B5CF6" />
            </LinearGradient>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'User'}</Text>
            <Text style={styles.profileEmail}>{user?.email || ''}</Text>
            <Text style={styles.profileId}>ID: GS{user?.id || '---'}</Text>
          </View>
          <TouchableOpacity 
            style={styles.editButtonWrapper}
            onPress={() => router.push('/profile-setup')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#EC4899', '#F43F5E']}
              style={styles.editButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="create" size={18} color="#FFFFFF" />
              <Text style={styles.editButtonText}>Edit</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.menuGrid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => {
                if (item.route.startsWith('/(tabs)')) {
                  router.push(item.route as any);
                } else if (item.route === '/search' || item.route.startsWith('/profile-detail')) {
                  router.push(item.route as any);
                } else {
                  Alert.alert('Coming Soon', `${item.title} feature will be available soon`);
                }
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={item.color}
                style={styles.menuItemGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name={item.icon as any} size={28} color="#FFFFFF" />
                </View>
                <Text style={styles.menuItemText}>{item.title}</Text>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.8)" />
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <View style={styles.logoutContent}>
            <View style={styles.logoutIconContainer}>
              <Ionicons name="log-out" size={24} color="#EF4444" />
            </View>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </View>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  profileHeader: {
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  profileId: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  editButtonWrapper: {
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  menuGrid: {
    gap: 12,
  },
  menuItem: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  menuItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#FCA5A5',
  },
  logoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  logoutIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: 'bold',
  },
});