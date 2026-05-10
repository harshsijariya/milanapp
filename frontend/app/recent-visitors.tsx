import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { viewsAPI, likeAPI } from '../utils/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function RecentVisitorsScreen() {
  const router = useRouter();
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [likedProfileIds, setLikedProfileIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadVisitors();
  }, []);

  const loadVisitors = async (pageNum = 0) => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await viewsAPI.getProfileViews(pageNum, 10);
      const visitorsData = response.data.content || response.data || [];
      const validVisitors = visitorsData
        .map((v: any) => v.viewerProfile || v.viewedBy) // Check both in case of dto changes
        .filter((p: any) => p && p.id);
      
      if (pageNum === 0) {
        setVisitors(validVisitors);
      } else {
        setVisitors(prev => [...prev, ...validVisitors]);
      }

      if (response.data.last !== undefined) {
        setHasMore(!response.data.last);
      } else {
        setHasMore(validVisitors.length === 10);
      }
      setPage(pageNum);
    } catch (error) {
      Alert.alert('Error', 'Failed to load recent visitors');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadVisitors(page + 1);
    }
  };

  const handleLike = async (profileId: number | string) => {
    try {
      await likeAPI.likeProfile(profileId);
      Alert.alert("Success", "Interest sent successfully! ❤️");
      setLikedProfileIds((prev) => new Set(prev).add(Number(profileId)));
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || typeof error.response?.data === 'string' ? error.response.data : "";
      if (errorMsg && errorMsg.toLowerCase().includes('already')) {
        setLikedProfileIds((prev) => new Set(prev).add(Number(profileId)));
        Alert.alert("Connected", "You are already connected with this profile.");
      } else {
        Alert.alert(
          "Error",
          error.response?.data?.detail || "Failed to send interest",
        );
      }
    }
  };

  const getProfileImage = (profile: any) => {
    if (profile?.profileImage) return { uri: profile.profileImage };
    if (profile?.profile_image) return { uri: profile.profile_image };
    if (profile?.profileImages && profile.profileImages.length > 0) return { uri: profile.profileImages[0] };
    return require('../assets/images/icon.png');
  };

  const renderProfile = ({ item }: any) => {
    const isLiked = likedProfileIds.has(Number(item.id));

    return (
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
              style={[styles.primaryButton, isLiked && { backgroundColor: '#D1FAE5' }]}
              onPress={() => {
                if (!isLiked) handleLike(item.id);
              }}
              activeOpacity={isLiked ? 1 : 0.8}
            >
              {isLiked ? (
                <>
                  <Ionicons name="checkmark" size={14} color="#059669" />
                  <Text style={[styles.primaryButtonText, { color: '#059669' }]}>Connected</Text>
                </>
              ) : (
                <>
                  <Ionicons name="person-add-outline" size={14} color="#000" />
                  <Text style={styles.primaryButtonText}>Connect Now</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recent Visitors</Text>
        <View style={{ width: 40 }}>
            <Text style={{fontSize: 14, color: '#737373', textAlign: 'right'}}>{visitors.length}</Text>
        </View>
      </View>

      <FlatList
        data={visitors}
        renderItem={renderProfile}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{loading ? 'Loading...' : 'No recent visitors'}</Text>
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
    flexDirection: 'row',
    backgroundColor: '#EFEFEF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 110,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '600',
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
