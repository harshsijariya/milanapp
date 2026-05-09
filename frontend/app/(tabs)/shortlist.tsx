import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { shortlistAPI } from '../../utils/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ShortlistScreen() {
  const router = useRouter();
  const [shortlist, setShortlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadShortlist();
  }, []);

  const loadShortlist = async () => {
    setLoading(true);
    try {
      const response = await shortlistAPI.getAll();
      const profilesData = response.data.content || response.data || [];
      setShortlist(Array.isArray(profilesData) ? profilesData : []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load shortlist');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (profileId: number | string) => {
    Alert.alert(
      'Remove from Shortlist',
      'Are you sure you want to remove this profile?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await shortlistAPI.remove(profileId);
              Alert.alert('Success', 'Removed from shortlist');
              loadShortlist();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove');
            }
          },
        },
      ]
    );
  };

  const getProfileImage = (profile: any) => {
    if (profile?.profileImage) return { uri: profile.profileImage };
    if (profile?.profile_image) return { uri: profile.profile_image };
    if (profile?.profileImages && profile.profileImages.length > 0) return { uri: profile.profileImages[0] };
    return require('../../assets/images/icon.png');
  };

  const renderProfile = ({ item }: any) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => router.push(`/profile-detail/${item.id}`)}
      activeOpacity={0.9}
    >
      <View style={styles.listContent}>
        <LinearGradient
          colors={['#D92E7F', '#E74C3C', '#F1C40F']}
          style={styles.avatarRing}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.avatarContainer}>
            <Image
              source={getProfileImage(item)}
              style={styles.avatar}
              cachePolicy="memory-disk"
            />
          </View>
        </LinearGradient>
        
        <View style={styles.infoContainer}>
          <Text style={styles.nameText} numberOfLines={1}>
            {item.name || `GS${item.id}`}
          </Text>
          <Text style={styles.detailText} numberOfLines={1}>
            {item.profession || 'Not specified'} • {item.city || 'N/A'}
          </Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push(`/profile-detail/${item.id}`)}
          >
            <Text style={styles.primaryButtonText}>View</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => handleRemove(item.id)}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Shortlist</Text>
        <View style={{ width: 40 }}>
            <Text style={{fontSize: 14, color: '#737373', textAlign: 'right'}}>{shortlist.length}</Text>
        </View>
      </View>

      <FlatList
        data={shortlist}
        renderItem={renderProfile}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No profiles shortlisted</Text>
            <TouchableOpacity
              style={[styles.primaryButton, {marginTop: 20}]}
              onPress={() => router.push('/(tabs)/home')}
            >
              <Text style={styles.primaryButtonText}>Browse Profiles</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#DBDBDB',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  listContainer: {
    paddingVertical: 8,
  },
  listItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  listContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  nameText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#262626',
    marginBottom: 2,
  },
  detailText: {
    fontSize: 13,
    color: '#737373',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  primaryButton: {
    backgroundColor: '#EFEFEF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#737373',
  },
});