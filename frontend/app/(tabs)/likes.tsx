import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { likeAPI } from "../../utils/api";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

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
        const valid = mapped.filter(
          (item: any) => item.profile && item.profile.id,
        );
        setReceivedLikes(valid);
      } else {
        const response = await likeAPI.getSentLikes();
        const mapped = response.data.map(mapLikeData);
        const valid = mapped.filter(
          (item: any) => item.profile && item.profile.id,
        );
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
    try {
      await likeAPI.unlikeProfile(profileId);
      Alert.alert("Success", "Interest cancelled");
      loadLikes();
    } catch (error) {
      Alert.alert("Error", "Failed to cancel");
    }
  };

  const getProfileImage = (profile: any) => {
    if (profile && profile.profile_image) {
      return { uri: profile.profile_image };
    }
    return require("../../assets/images/icon.png");
  };

  const getTimeSince = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffInMs = now.getTime() - then.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "1 day ago";
    if (diffInDays < 30) return `${diffInDays} days ago`;
    if (diffInDays < 60) return "1 month ago";
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const renderReceivedLike = ({ item }: any) => (
    <TouchableOpacity
      style={styles.likeCard}
      onPress={() => {
        if (item.profile && item.profile.id) {
          router.push(`/profile-detail/${item.profile.id}`);
        } else {
          Alert.alert("Error", "Profile ID is missing or invalid.");
        }
      }}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={["#FFFFFF", "#F9FAFB"]}
        style={styles.cardGradient}
      >
        <View style={styles.profileSection}>
          <Image
            source={getProfileImage(item.profile)}
            style={styles.profileImage}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileId}>GS{item.profile.id}</Text>
            <Text style={styles.profileName}>
              {item.profile.name || "Anonymous"}
            </Text>
            <Text style={styles.profileDetail}>
              {item.profile.profession || "Not specified"}
            </Text>
            <Text style={styles.profileDetail}>
              {item.profile.city || "N/A"}, {item.profile.state || "N/A"}
            </Text>
          </View>
          <LinearGradient
            colors={["#FEF3C7", "#FDE68A"]}
            style={styles.timeBadge}
          >
            <Ionicons name="time" size={12} color="#92400E" />
            <Text style={styles.timeText}>{getTimeSince(item.liked_at)}</Text>
          </LinearGradient>
        </View>

        {item.status === "pending" && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.declineButtonWrapper}
              onPress={() => handleDecline(item.profile.id)}
              activeOpacity={0.8}
            >
              <View style={styles.declineButton}>
                <Ionicons name="close-circle" size={20} color="#EF4444" />
                <Text style={styles.declineButtonText}>Decline</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptButtonWrapper}
              onPress={() => handleAccept(item.profile.id)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#10B981", "#059669"]}
                style={styles.acceptButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.acceptButtonText}>Accept</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {item.status === "accepted" && (
          <LinearGradient
            colors={["#D1FAE5", "#A7F3D0"]}
            style={styles.statusBadge}
          >
            <Ionicons name="checkmark-circle" size={16} color="#059669" />
            <Text style={styles.acceptedText}>Accepted</Text>
          </LinearGradient>
        )}

        {item.status === "declined" && (
          <View style={styles.declinedBadge}>
            <Ionicons name="close-circle" size={16} color="#DC2626" />
            <Text style={styles.declinedText}>Declined</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderSentLike = ({ item }: any) => (
    <TouchableOpacity
      style={styles.likeCard}
      onPress={() => {
        if (item.profile && item.profile.id) {
          router.push(`/profile-detail/${item.profile.id}`);
        } else {
          Alert.alert("Error", "Profile ID is missing or invalid.");
        }
      }}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={["#FFFFFF", "#F9FAFB"]}
        style={styles.cardGradient}
      >
        <View style={styles.profileSection}>
          <Image
            source={getProfileImage(item.profile)}
            style={styles.profileImage}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileId}>GS{item.profile.id}</Text>
            <Text style={styles.profileName}>
              {item.profile.name || "Anonymous"}
            </Text>
            <Text style={styles.profileDetail}>
              {item.profile.profession || "Not specified"}
            </Text>
            <Text style={styles.profileDetail}>
              {item.profile.city || "N/A"}, {item.profile.state || "N/A"}
            </Text>
          </View>
          <LinearGradient
            colors={["#FEF3C7", "#FDE68A"]}
            style={styles.timeBadge}
          >
            <Ionicons name="time" size={12} color="#92400E" />
            <Text style={styles.timeText}>{getTimeSince(item.liked_at)}</Text>
          </LinearGradient>
        </View>

        <View style={styles.actions}>
          {item.status === "pending" && (
            <>
              <View style={styles.pendingBadgeContainer}>
                <LinearGradient
                  colors={["#DBEAFE", "#BFDBFE"]}
                  style={styles.pendingBadge}
                >
                  <Ionicons name="hourglass" size={16} color="#1E40AF" />
                  <Text style={styles.pendingText}>Pending</Text>
                </LinearGradient>
              </View>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => handleCancel(item.profile.id)}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={18} color="#EF4444" />
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
          {item.status === "accepted" && (
            <LinearGradient
              colors={["#D1FAE5", "#A7F3D0"]}
              style={styles.statusBadge}
            >
              <Ionicons name="checkmark-circle" size={16} color="#059669" />
              <Text style={styles.acceptedText}>Accepted</Text>
            </LinearGradient>
          )}
          {item.status === "declined" && (
            <View style={styles.declinedBadge}>
              <Ionicons name="close-circle" size={16} color="#DC2626" />
              <Text style={styles.declinedText}>Declined</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#6366F1", "#8B5CF6"]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <LinearGradient
              colors={["#EC4899", "#F43F5E"]}
              style={styles.iconGradient}
            >
              <Ionicons name="heart" size={24} color="#FFFFFF" />
            </LinearGradient>
          </View>
          <Text style={styles.headerTitle}>Likes & Interests</Text>
        </View>
      </LinearGradient>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "received" && styles.activeTab]}
          onPress={() => setActiveTab("received")}
          activeOpacity={0.8}
        >
          {activeTab === "received" && (
            <LinearGradient
              colors={["#EC4899", "#F43F5E"]}
              style={styles.tabGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="arrow-down" size={18} color="#FFFFFF" />
              <Text style={styles.activeTabText}>Received</Text>
            </LinearGradient>
          )}
          {activeTab !== "received" && (
            <View style={styles.tabContent}>
              <Ionicons name="arrow-down" size={18} color="#9CA3AF" />
              <Text style={styles.tabText}>Received</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "sent" && styles.activeTab]}
          onPress={() => setActiveTab("sent")}
          activeOpacity={0.8}
        >
          {activeTab === "sent" && (
            <LinearGradient
              colors={["#8B5CF6", "#6366F1"]}
              style={styles.tabGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
              <Text style={styles.activeTabText}>Sent</Text>
            </LinearGradient>
          )}
          {activeTab !== "sent" && (
            <View style={styles.tabContent}>
              <Ionicons name="arrow-up" size={18} color="#9CA3AF" />
              <Text style={styles.tabText}>Sent</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === "received" ? receivedLikes : sentLikes}
        renderItem={
          activeTab === "received" ? renderReceivedLike : renderSentLike
        }
        keyExtractor={(item, index) =>
          `${item.profile?.id}-${index}` || index.toString()
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={["#F3F4F6", "#E5E7EB"]}
              style={styles.emptyIcon}
            >
              <Ionicons name="heart-outline" size={48} color="#9CA3AF" />
            </LinearGradient>
            <Text style={styles.emptyTitle}>No {activeTab} likes yet</Text>
            <Text style={styles.emptyText}>
              {activeTab === "received"
                ? "When someone likes your profile, they will appear here"
                : "Start liking profiles to see them here"}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerIcon: {
    shadowColor: "#EC4899",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  iconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 8,
    gap: 8,
    marginHorizontal: 24,
    marginTop: -16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tab: {
    flex: 1,
  },
  activeTab: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  tabContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  tabText: {
    fontSize: 15,
    color: "#9CA3AF",
    fontWeight: "600",
  },
  activeTabText: {
    fontSize: 15,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  listContent: {
    padding: 24,
    paddingTop: 24,
  },
  likeCard: {
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardGradient: {
    borderRadius: 16,
    padding: 16,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  profileImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: "#8B5CF6",
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileId: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#8B5CF6",
    marginBottom: 4,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  profileDetail: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timeText: {
    fontSize: 11,
    color: "#92400E",
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  acceptButtonWrapper: {
    flex: 1,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  acceptButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  acceptButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
  declineButtonWrapper: {
    flex: 1,
  },
  declineButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#FCA5A5",
  },
  declineButtonText: {
    color: "#EF4444",
    fontSize: 15,
    fontWeight: "bold",
  },
  cancelButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#FCA5A5",
  },
  cancelButtonText: {
    color: "#EF4444",
    fontSize: 15,
    fontWeight: "bold",
  },
  pendingBadgeContainer: {
    flex: 1,
  },
  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  pendingText: {
    color: "#1E40AF",
    fontSize: 15,
    fontWeight: "bold",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  acceptedText: {
    color: "#059669",
    fontSize: 15,
    fontWeight: "bold",
  },
  declinedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
    flex: 1,
  },
  declinedText: {
    color: "#DC2626",
    fontSize: 15,
    fontWeight: "bold",
  },
  emptyContainer: {
    padding: 48,
    alignItems: "center",
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
});
