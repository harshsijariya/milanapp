import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { profileAPI, likeAPI, shortlistAPI, viewsAPI } from "../../utils/api";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 48;

export default function HomeScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [featuredProfiles, setFeaturedProfiles] = useState<any[]>([]);
  const [receivedLikes, setReceivedLikes] = useState<any[]>([]);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [recentVisitors, setRecentVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [likedProfileIds, setLikedProfileIds] = useState<Set<number>>(new Set());

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const userData = await AsyncStorage.getItem("user_data");
      if (userData) {
        const user = JSON.parse(userData);
        setUserName(user.name);
      }

      const [profilesRes, likesRes, visitorsRes] = await Promise.all([
        profileAPI.getProfiles(0, 20),
        likeAPI.getReceivedLikes(),
        viewsAPI.getProfileViews(),
      ]);

      const profilesData = profilesRes.data.content || profilesRes.data || [];

      // Featured profiles (first 3)
      setFeaturedProfiles(profilesData.slice(0, 3));

      // All profiles
      setAllProfiles(profilesData);

      // Received likes (first 5)
      setReceivedLikes(likesRes.data.slice(0, 5));

      // Recent visitors (Viewed By)
      setRecentVisitors(visitorsRes.data.slice(0, 5) || []);
    } catch (error: any) {
      console.log("Failed to load home data:", error?.message);
    } finally {
      setLoading(false);
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

  const handleShortlist = async (profileId: number | string) => {
    try {
      await shortlistAPI.add(profileId);
      Alert.alert("Success", "Added to shortlist! ⭐");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.detail || "Failed to add to shortlist",
      );
    }
  };

  const getProfileImage = (profile: any) => {
    if (profile?.profileImage) {
      return { uri: profile.profileImage };
    }
    if (profile?.profile_image) {
      return { uri: profile.profile_image };
    }
    if (profile?.profileImages && profile.profileImages.length > 0) {
      return { uri: profile.profileImages[0] };
    }
    return require("../../assets/images/icon.png");
  };

  const renderFeaturedProfile = ({ item }: any) => {
    // Calculate age if DOB exists
    let age = '';
    if (item.dateOfBirth) {
      const birthDate = new Date(item.dateOfBirth);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      age = `${calculatedAge} yrs, `;
    }

    const isLiked = likedProfileIds.has(Number(item.id));

    return (
      <TouchableOpacity
        style={styles.featuredCard}
        onPress={() => router.push(`/profile-detail/${item.id}`)}
        activeOpacity={0.9}
      >
        <View style={styles.featuredImageContainer}>
          <Image source={getProfileImage(item)} style={styles.featuredImage} contentFit="cover" />
          
          {/* Top Right Floating Icons */}
          <View style={styles.floatingIconsTopRight}>
            <View style={styles.floatingIconBadge}>
              <Ionicons name="planet" size={14} color="#F59E0B" />
              <Text style={styles.floatingIconText}>Astro</Text>
            </View>
            <View style={styles.floatingIconBadge}>
              <Ionicons name="camera" size={14} color="#FFFFFF" />
              <Text style={styles.floatingIconText}>1</Text>
            </View>
          </View>

          {/* Bottom Gradient Overlay for Text */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.6)", "rgba(0,0,0,0.9)"]}
            style={styles.featuredOverlay}
          >
            <Text style={styles.featuredName}>
              {item.name || "Anonymous"}
            </Text>
            
            <Text style={styles.featuredSubText} numberOfLines={1}>
              {age}{item.height || "N/A"} • {item.profession || "Not specified"}
            </Text>
            
            <Text style={styles.featuredSubText} numberOfLines={1}>
              {item.religion || "Hindu"}, {item.caste || "Not specified"} • {item.city || "N/A"}, {item.state || "N/A"}
            </Text>

            <View style={styles.badgeRow}>
              <View style={styles.timeBadge}>
                <View style={styles.onlineDotMini} />
                <Text style={styles.timeBadgeText}>2h ago</Text>
              </View>
              <View style={styles.youAndHerBadge}>
                <Ionicons name="people" size={12} color="#EF4444" />
                <Text style={styles.youAndHerText}>You & Her</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Footer Black Bar */}
        <View style={styles.featuredFooter}>
          <Text style={styles.footerQuestionText}>Like this profile?</Text>
          <TouchableOpacity 
            style={styles.connectButtonWrapper}
            onPress={() => !isLiked && handleLike(item.id)}
            activeOpacity={isLiked ? 1 : 0.8}
          >
            <Text style={[styles.connectButtonText, isLiked && { color: '#10B981' }]}>
              {isLiked ? 'Connected' : 'Connect Now'}
            </Text>
            <View style={[
              styles.connectCheckmark, 
              isLiked && { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#10B981' }
            ]}>
              <Ionicons name="checkmark" size={16} color={isLiked ? "#10B981" : "#FFFFFF"} />
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderRecentVisitorCard = (profile: any) => {
    const profData = profile.profile || profile;
    const isLiked = likedProfileIds.has(Number(profData.id));

    let ageStr = "";
    if (profData.dateOfBirth || profData.date_of_birth) {
      const dobStr = profData.dateOfBirth || profData.date_of_birth;
      const dob = new Date(dobStr);
      const diffMs = Date.now() - dob.getTime();
      const ageDate = new Date(diffMs);
      const calculatedAge = Math.abs(ageDate.getUTCFullYear() - 1970);
      if (!isNaN(calculatedAge)) ageStr = `${calculatedAge} yrs`;
    }

    const name = profData.name ? `${profData.name.split(' ')[0]} ${profData.name.split(' ')[1] ? profData.name.split(' ')[1][0] : ''}` : "Anonymous";
    const heightStr = profData.height ? `, ${profData.height}` : "";
    const religionStr = profData.religion ? `, ${profData.religion}` : "";
    const casteStr = profData.caste ? `,\n${profData.caste}` : "";
    const locationStr = profData.state ? `,\n${profData.state}` : (profData.city ? `,\n${profData.city}` : "");

    return (
      <TouchableOpacity
        key={profData.id}
        style={styles.visitorCard}
        onPress={() => {
          if (profData.id) router.push(`/profile-detail/${profData.id}`);
        }}
        activeOpacity={0.9}
      >
        <View style={styles.visitorImageContainer}>
          <Image source={getProfileImage(profData)} style={styles.visitorImage} />
          <View style={styles.visitorPremiumBadge}>
            <Ionicons name="star" size={10} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.visitorInfo}>
          <Text style={styles.visitorName} numberOfLines={1}>{name}</Text>
          <Text style={styles.visitorDetails} numberOfLines={4}>
            {ageStr}{heightStr}{religionStr}{casteStr}{locationStr}
          </Text>

          <TouchableOpacity 
            style={[styles.visitorConnectBtn, isLiked && { borderColor: '#10B981' }]}
            onPress={() => !isLiked && handleLike(profData.id)}
            activeOpacity={isLiked ? 1 : 0.8}
          >
            <Ionicons name="checkmark" size={14} color={isLiked ? "#10B981" : "#0F766E"} />
            <Text style={[styles.visitorConnectText, isLiked && { color: '#10B981' }]}>
              {isLiked ? 'Connected' : 'Connect Now'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSmallProfile = (profile: any) => (
    <TouchableOpacity
      key={profile.id || profile.profile?.id}
      style={styles.smallCard}
      onPress={() => {
        // Accept both numeric and JM code string IDs
        const id = profile.id || profile.profile?.id;
        if (id && (typeof id === "string" || typeof id === "number")) {
          router.push(`/profile-detail/${id}`);
        } else {
          Alert.alert("Error", "Profile ID is missing or invalid.");
        }
      }}
      activeOpacity={0.9}
    >
      <Image
        source={getProfileImage(profile.profile || profile)}
        style={styles.smallImage}
      />
      <Text style={styles.smallName} numberOfLines={1}>
        {profile.profile?.name || profile.name || "Anonymous"}
      </Text>
      <Text style={styles.smallId}>GS{profile.id || profile.profile?.id}</Text>
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
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{userName || "User"}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationCount}>3</Text>
            </View>
            <Ionicons name="notifications" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Find Your Match Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Find Your Match</Text>
              <Text style={styles.sectionSubtitle}>
                Featured profiles for you
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/search")}>
              <LinearGradient
                colors={["#EC4899", "#F43F5E"]}
                style={styles.seeAllButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.seeAllText}>See All</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <FlatList
            data={featuredProfiles}
            renderItem={renderFeaturedProfile}
            keyExtractor={(item) => item.id?.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredList}
            snapToInterval={CARD_WIDTH + 16}
            decelerationRate="fast"
          />
        </View>



        {/* Viewed By Section (Recent Visitors) - ALWAYS SHOW */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { paddingHorizontal: 24, marginBottom: 12 }]}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937' }}>
              Recent Visitors ({recentVisitors.length})
            </Text>
            <TouchableOpacity onPress={() => router.push("/recent-visitors")}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#0F766E' }}>See All {">"}</Text>
            </TouchableOpacity>
          </View>

          {recentVisitors.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.smallList}
            >
              {recentVisitors.map(renderRecentVisitorCard)}
            </ScrollView>
          ) : (
            <View style={styles.emptySmallSection}>
              <LinearGradient
                colors={["#F3F4F6", "#E5E7EB"]}
                style={styles.emptySmallIcon}
              >
                <Ionicons name="eye-outline" size={32} color="#9CA3AF" />
              </LinearGradient>
              <Text style={styles.emptySmallText}>No profile views yet</Text>
            </View>
          )}
        </View>

        {/* All Profiles Section */}
        {allProfiles.length > 0 && (
          <View style={styles.section}>
            <View style={[styles.sectionHeader, { paddingHorizontal: 24, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937' }}>
                All Profiles ({allProfiles.length})
              </Text>
              <TouchableOpacity onPress={() => router.push("/all-profiles")}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#0F766E' }}>See All {">"}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.smallList}
            >
              {allProfiles.map(renderRecentVisitorCard)}
            </ScrollView>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
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
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  notificationButton: {
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#EF4444",
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  notificationCount: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  seeAllText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  viewAllText: {
    color: "#6366F1",
    fontSize: 14,
    fontWeight: "600",
  },
  featuredList: {
    paddingHorizontal: 24,
    gap: 16,
  },
  featuredCard: {
    width: CARD_WIDTH,
    backgroundColor: '#111111',
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  featuredImageContainer: {
    width: '100%',
    height: 400,
    position: 'relative',
  },
  featuredImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  floatingIconsTopRight: {
    position: 'absolute',
    top: 16,
    right: 16,
    gap: 8,
    alignItems: 'flex-end',
  },
  floatingIconBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  floatingIconText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  featuredName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  featuredSubText: {
    fontSize: 14,
    color: "#E5E7EB",
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  onlineDotMini: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  timeBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  youAndHerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  youAndHerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  featuredFooter: {
    backgroundColor: '#111111',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  footerQuestionText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontStyle: 'italic',
  },
  connectButtonWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectButtonText: {
    color: '#38BDF8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  connectCheckmark: {
    backgroundColor: '#10B981',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallList: {
    paddingHorizontal: 24,
    gap: 16,
  },
  smallCard: {
    width: 156,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  smallImage: {
    width: 104,
    height: 104,
    borderRadius: 52,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: "#8B5CF6",
  },
  smallName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 4,
  },
  smallId: {
    fontSize: 12,
    color: "#6B7280",
  },
  emptySmallSection: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: "center",
  },
  emptySmallIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  emptySmallText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  visitorCard: {
    width: 170,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: "hidden",
  },
  visitorImageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
    backgroundColor: '#E5E7EB',
  },
  visitorImage: {
    width: '100%',
    height: '100%',
  },
  visitorPremiumBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EF4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  visitorInfo: {
    padding: 12,
  },
  visitorName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  visitorDetails: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
    marginBottom: 12,
    height: 64,
  },
  visitorConnectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#0F766E',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  visitorConnectText: {
    color: '#0F766E',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
