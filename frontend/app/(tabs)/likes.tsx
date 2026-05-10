import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { likeAPI } from '../../utils/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function LikesScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
  const [receivedLikes, setReceivedLikes] = useState<any[]>([]);
  const [sentLikes, setSentLikes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLikes();
  }, [activeTab]);

  const loadLikes = async () => {
    setLoading(true);
    try {
      const mapLikeData = (item: any) => {
        let status = item.status?.toLowerCase() || "";
        if (status === "rejected") status = "declined";

        const backendProfile = item.likedProfile || item.profile || {};
        const profile = {
          ...backendProfile,
          city: backendProfile.city || backendProfile.presentAddress || "",
          state: backendProfile.state || "",
        };

        return {
          ...item,
          profile,
          liked_at: item.likedAt || item.liked_at,
          status: status,
        };
      };

      if (activeTab === "received") {
        const response = await likeAPI.getReceivedLikes();
        const mapped = response.data.map(mapLikeData);
        const valid = mapped.filter((item: any) => item.profile && item.profile.id);
        setReceivedLikes(valid);
      } else {
        const response = await likeAPI.getSentLikes();
        const mapped = response.data.map(mapLikeData);
        const valid = mapped.filter((item: any) => item.profile && item.profile.id);
        setSentLikes(valid);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load likes");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (likerId: number | string) => {
    try {
      await likeAPI.acceptLike(likerId);
      Alert.alert("Success", "Interest accepted ✅");
      loadLikes();
    } catch (error) {
      Alert.alert("Error", "Failed to accept");
    }
  };

  const handleDecline = async (likerId: number | string) => {
    try {
      await likeAPI.declineLike(likerId);
      Alert.alert("Success", "Interest declined");
      loadLikes();
    } catch (error) {
      Alert.alert("Error", "Failed to decline");
    }
  };

  const handleCancel = async (profileId: number | string) => {
    Alert.alert(
      'Cancel Interest',
      'Are you sure you want to cancel this interest?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Cancel Interest',
          style: 'destructive',
          onPress: async () => {
            try {
              await likeAPI.unlikeProfile(profileId);
              Alert.alert("Success", "Interest cancelled");
              loadLikes();
            } catch (error) {
              Alert.alert("Error", "Failed to cancel");
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

  const getTimeSince = (date: string) => {
    if (!date) return "";
    const now = new Date();
    const then = new Date(date);
    const diffInMs = now.getTime() - then.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "1d ago";
    if (diffInDays < 30) return `${diffInDays}d ago`;
    if (diffInDays < 60) return "1mo ago";
    return `${Math.floor(diffInDays / 30)}mo ago`;
  };

  const renderReceivedLike = ({ item }: any) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => {
        if (item.profile && item.profile.id) {
          router.push(`/profile-detail/${item.profile.id}`);
        } else {
          Alert.alert("Error", "Profile ID is missing or invalid.");
        }
      }}
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
              source={getProfileImage(item.profile)}
              style={styles.avatar}
              cachePolicy="memory-disk"
            />
          </View>
        </LinearGradient>
        
        <View style={styles.infoContainer}>
          <Text style={styles.nameText} numberOfLines={1}>
            {item.profile.name || `GS${item.profile.id}`}
          </Text>
          <Text style={styles.detailText} numberOfLines={1}>
            {item.profile.profession || "Not specified"} • {getTimeSince(item.liked_at)}
          </Text>
        </View>

        <View style={styles.actionRow}>
          {item.status === 'pending' && (
            <>
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={() => handleAccept(item.profile.id)}
              >
                <Text style={styles.primaryButtonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => handleDecline(item.profile.id)}
              >
                <Ionicons name="close-outline" size={24} color="#EF4444" />
              </TouchableOpacity>
            </>
          )}
          {item.status === 'accepted' && (
            <Text style={styles.statusTextAccepted}>Accepted</Text>
          )}
          {item.status === 'declined' && (
            <Text style={styles.statusTextDeclined}>Declined</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSentLike = ({ item }: any) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => {
        if (item.profile && item.profile.id) {
          router.push(`/profile-detail/${item.profile.id}`);
        } else {
          Alert.alert("Error", "Profile ID is missing or invalid.");
        }
      }}
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
              source={getProfileImage(item.profile)}
              style={styles.avatar}
              cachePolicy="memory-disk"
            />
          </View>
        </LinearGradient>
        
        <View style={styles.infoContainer}>
          <Text style={styles.nameText} numberOfLines={1}>
            {item.profile.name || `GS${item.profile.id}`}
          </Text>
          <Text style={styles.detailText} numberOfLines={1}>
            {item.profile.profession || "Not specified"} • {getTimeSince(item.liked_at)}
          </Text>
        </View>

        <View style={styles.actionRow}>
          {item.status === 'pending' && (
            <>
              <Text style={styles.statusTextPending}>Pending</Text>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => handleCancel(item.profile.id)}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </>
          )}
          {item.status === 'accepted' && (
            <Text style={styles.statusTextAccepted}>Accepted</Text>
          )}
          {item.status === 'declined' && (
            <Text style={styles.statusTextDeclined}>Declined</Text>
          )}
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
        <Text style={styles.headerTitle}>Likes & Interests</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'received' && styles.activeTab]} onPress={() => setActiveTab('received')}>
          <Text style={[styles.tabText, activeTab === 'received' && styles.activeTabText]}>Received ({receivedLikes.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'sent' && styles.activeTab]} onPress={() => setActiveTab('sent')}>
          <Text style={[styles.tabText, activeTab === 'sent' && styles.activeTabText]}>Sent ({sentLikes.length})</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === "received" ? receivedLikes : sentLikes}
        renderItem={activeTab === "received" ? renderReceivedLike : renderSentLike}
        keyExtractor={(item, index) => `${item.profile?.id}-${index}` || index.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {activeTab === "received"
                ? "No received likes yet"
                : "You haven't liked anyone yet"}
            </Text>
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
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#DBDBDB',
    backgroundColor: '#fff',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#000',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#737373',
  },
  activeTabText: {
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
    gap: 4,
  },
  primaryButton: {
    backgroundColor: '#EFEFEF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  iconButton: {
    padding: 8,
  },
  statusTextAccepted: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 8,
  },
  statusTextDeclined: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 8,
  },
  statusTextPending: {
    color: '#737373',
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 8,
  },
  emptyContainer: {
    padding: 48,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
    color: '#737373',
  },
});
