import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert, Animated } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { profileAPI, likeAPI, shortlistAPI, viewsAPI } from '../../utils/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [isLiked, setIsLiked] = useState(false);
  const [isShortlisted, setIsShortlisted] = useState(false);

  const scaleLike = useRef(new Animated.Value(1)).current;
  const scaleShortlist = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      let response;
      if (id === 'me') {
        response = await profileAPI.getMe();
      } else {
        response = await profileAPI.getProfile(id as string);
      }
      setProfile(response.data);
      
      // Log the view if it's not our own profile
      if (id !== 'me') {
        try {
          await viewsAPI.addView({ profileId: id as string });
        } catch (viewError) {
          console.log('Failed to log view', viewError);
        }
      }
      // If backend returns like/shortlist status in the future, set it here.
      // e.g. setIsLiked(response.data.isLiked);
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    const newState = !isLiked;
    setIsLiked(newState);
    
    Animated.sequence([
      Animated.timing(scaleLike, { toValue: 1.3, duration: 150, useNativeDriver: true }),
      Animated.spring(scaleLike, { toValue: 1, friction: 4, useNativeDriver: true })
    ]).start();

    try {
      if (newState) {
        await likeAPI.likeProfile(id as string);
      } else {
        await likeAPI.unlikeProfile(id as string);
      }
    } catch (error: any) {
      const errorData = error.response?.data;
      if (typeof errorData === 'string' && errorData.toLowerCase().includes('already')) {
        // Already liked on backend, UI state is now correct
      } else {
        setIsLiked(!newState);
        Alert.alert('Error', error.response?.data?.detail || (typeof errorData === 'string' ? errorData : 'Failed to update interest'));
      }
    }
  };

  const handleShortlist = async () => {
    const newState = !isShortlisted;
    setIsShortlisted(newState);
    
    Animated.sequence([
      Animated.timing(scaleShortlist, { toValue: 1.3, duration: 150, useNativeDriver: true }),
      Animated.spring(scaleShortlist, { toValue: 1, friction: 4, useNativeDriver: true })
    ]).start();

    try {
      if (newState) {
        await shortlistAPI.add(id as string);
      } else {
        await shortlistAPI.remove(id as string);
      }
    } catch (error: any) {
      setIsShortlisted(!newState);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update shortlist');
    }
  };

  const getProfileImage = () => {
    if (profile?.profileImage) {
      return { uri: profile.profileImage };
    }
    if (profile?.profile_image) {
      return { uri: profile.profile_image };
    }
    if (profile?.profileImages && profile.profileImages.length > 0) {
      return { uri: profile.profileImages[0] };
    }
    return require('../../assets/images/icon.png');
  };

  if (loading || !profile) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.loadingCircle}>
          <Ionicons name="hourglass" size={32} color="#FFFFFF" />
        </LinearGradient>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  const InfoSection = ({ title, icon, color, children }: any) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <LinearGradient colors={color} style={styles.sectionIcon}>
          <Ionicons name={icon} size={20} color="#FFFFFF" />
        </LinearGradient>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  const InfoRow = ({ label, value, icon }: any) => (
    value ? (
      <View style={styles.infoRow}>
        {icon && <Ionicons name={icon} size={16} color="#8B5CF6" style={styles.infoIcon} />}
        <Text style={styles.infoLabel}>{label}:</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    ) : null
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} bounces={false}>
        {/* Profile Full Image Header */}
        <View style={styles.imageHeaderContainer}>
          <Image source={getProfileImage()} style={styles.fullProfileImage} contentFit="cover" />
          
          {/* Top Actions (Back Button, Menu) */}
          <View style={styles.topActionsRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconButtonSmall} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={24} color="#111111" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButtonSmall} activeOpacity={0.8}>
              <Ionicons name="ellipsis-vertical" size={20} color="#111111" />
            </TouchableOpacity>
          </View>

          {/* Lock Overlay Placeholder (Optional, for visual effect matching screenshot) */}
          <View style={styles.lockOverlayContainer} pointerEvents="none">
            <Ionicons name="lock-closed" size={32} color="#FFFFFF" />
            <Text style={styles.lockText}>Visible on Accept</Text>
          </View>

          {/* Bottom Gradient Overlay for Text */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.6)", "rgba(0,0,0,0.95)"]}
            style={styles.imageOverlay}
          >
            <View style={styles.nameRow}>
              <Text style={styles.overlayName}>{profile.name || 'Anonymous'}</Text>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            </View>
            
            <Text style={styles.overlaySubText} numberOfLines={1}>
              {profile.dateOfBirth ? `${new Date().getFullYear() - new Date(profile.dateOfBirth).getFullYear()} yrs, ` : ''}{profile.height || 'N/A'} • {profile.profession || 'Not specified'}
            </Text>
            <Text style={styles.overlaySubText} numberOfLines={1}>
              {profile.religion || 'Hindu'}, {profile.caste || 'Not specified'} • {profile.city || 'N/A'}, {profile.state || 'N/A'}
            </Text>

            <View style={styles.badgeRow}>
              <View style={styles.timeBadge}>
                <View style={styles.onlineDotMini} />
                <Text style={styles.timeBadgeText}>Online</Text>
              </View>
              <View style={styles.youAndHerBadge}>
                <Ionicons name="people" size={14} color="#EF4444" />
                <Text style={styles.youAndHerText}>You & Her</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.sectionHeaderTitle}>About {profile.name?.split(' ')[0] || 'User'} <Ionicons name="lock-closed" size={16} color="#EF4444" /></Text>
          
          <View style={styles.pillRow}>
            <View style={styles.pillBadge}>
              <Text style={styles.pillText}>ID: GS{profile.id}</Text>
              <Ionicons name="copy-outline" size={14} color="#6B7280" style={{marginLeft: 4}} />
            </View>
            <View style={styles.pillBadge}>
              <Text style={styles.pillText}>Profile Managed by Self</Text>
            </View>
          </View>

          {profile.aboutMyself && (
            <View style={styles.aboutCard}>
              <Text style={styles.aboutText}>{profile.aboutMyself}</Text>
            </View>
          )}

          {/* Action Buttons for Shortlist (Connect is sticky) */}
          {id !== 'me' && (
            <View style={styles.secondaryActionRow}>
              <TouchableOpacity onPress={handleShortlist} activeOpacity={0.8} style={styles.secondaryActionButton}>
                <Ionicons name={isShortlisted ? "star" : "star-outline"} size={24} color={isShortlisted ? "#F59E0B" : "#6B7280"} />
                <Text style={styles.secondaryActionText}>{isShortlisted ? 'Shortlisted' : 'Shortlist'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Basic Information */}
        <InfoSection title="Basic Information" icon="person" color={['#6366F1', '#8B5CF6']}>
          <InfoRow label="Gender" value={profile.gender} icon="male-female" />
          <InfoRow label="Marital Status" value={profile.maritalStatus} icon="heart" />
          <InfoRow label="Height" value={profile.height} icon="resize" />
          <InfoRow label="Weight" value={profile.weight ? `${profile.weight} kg` : null} icon="fitness" />
          <InfoRow label="Complexion" value={profile.complexion} icon="color-palette" />
          <InfoRow label="Blood Group" value={profile.bloodGroup} icon="water" />
          <InfoRow label="Diet" value={profile.diet} icon="restaurant" />
        </InfoSection>

        {/* Religious / Social / Astro */}
        <InfoSection title="Religious / Social / Astro" icon="moon" color={['#8B5CF6', '#A855F7']}>
          <InfoRow label="Gotra" value={profile.gotra} icon="book" />
          <InfoRow label="Aakna" value={profile.aakna} icon="library" />
          <InfoRow label="Mother Tongue" value={profile.motherTongue} icon="language" />
          <InfoRow label="Date of Birth" value={profile.dateOfBirth} icon="calendar" />
          <InfoRow label="Time of Birth" value={profile.timeOfBirth} icon="time" />
          <InfoRow label="Place of Birth" value={profile.placeOfBirth} icon="location" />
          <InfoRow label="Zodiac" value={profile.zodiac} icon="star" />
          <InfoRow label="Manglik" value={profile.manglik} icon="planet" />
          <InfoRow label="Nakshatra" value={profile.nakshatra} icon="sparkles" />
        </InfoSection>

        {/* Education & Career */}
        <InfoSection title="Education & Career" icon="school" color={['#10B981', '#059669']}>
          <InfoRow label="Education" value={profile.education} icon="school" />
          <InfoRow label="Details" value={profile.educationDetails} icon="document-text" />
          <InfoRow label="Profession" value={profile.profession} icon="briefcase" />
          <InfoRow label="Occupation" value={profile.occupationDetails} icon="business" />
          <InfoRow label="Employed In" value={profile.employedIn} icon="business" />
          <InfoRow label="Organization" value={profile.organization} icon="business" />
          <InfoRow label="Work City" value={profile.workCity} icon="location" />
          <InfoRow label="Annual Income" value={profile.annualIncome} icon="cash" />
        </InfoSection>



        {/* Family Details */}
        <InfoSection title="Family Details" icon="people" color={['#EC4899', '#F43F5E']}>
          <InfoRow label="Father's Name" value={profile.fathersName} icon="person" />
          <InfoRow label="Father's Occupation" value={profile.fathersOccupation} icon="briefcase" />
          <InfoRow label="Mother's Name" value={profile.mothersName} icon="person" />
          <InfoRow label="Mother's Occupation" value={profile.mothersOccupation} icon="briefcase" />
          <InfoRow label="Married Brothers" value={profile.marriedBrothers} icon="people" />
          <InfoRow label="Unmarried Brothers" value={profile.unmarriedBrothers} icon="people" />
          <InfoRow label="Married Sisters" value={profile.marriedSisters} icon="people" />
          <InfoRow label="Unmarried Sisters" value={profile.unmarriedSisters} icon="people" />
          <InfoRow label="House Status" value={profile.houseStatus} icon="home" />
          <InfoRow label="Car" value={profile.carStatus} icon="car" />
        </InfoSection>

        {/* Partner Preferences */}
        {profile.partnerPreferences && (
          <InfoSection title="Partner Preferences" icon="heart-circle" color={['#F59E0B', '#D97706']}>
            <Text style={styles.aboutText}>{profile.partnerPreferences}</Text>
          </InfoSection>
        )}

        {/* Contact Information */}
        <InfoSection title="Contact Information" icon="call" color={['#8B5CF6', '#6366F1']}>
          <InfoRow label="Mobile" value={profile.mobileNo} icon="call" />
          <InfoRow label="WhatsApp" value={profile.whatsappNo} icon="logo-whatsapp" />
          <InfoRow label="Email" value={profile.email} icon="mail" />
        </InfoSection>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Connect Now Button */}
      {id !== 'me' && (
        <View style={styles.stickyFooter}>
          <TouchableOpacity onPress={handleLike} activeOpacity={0.9} style={styles.stickyConnectButton}>
            <LinearGradient
              colors={isLiked ? ['#9CA3AF', '#6B7280'] : ['#2DD4BF', '#059669']}
              style={styles.stickyConnectGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="checkmark" size={24} color="#FFFFFF" />
              <Text style={styles.stickyConnectText}>{isLiked ? 'Connected' : 'Connect Now'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    flex: 1,
  },
  imageHeaderContainer: {
    width: '100%',
    height: 500,
    position: 'relative',
    backgroundColor: '#111111',
  },
  fullProfileImage: {
    width: '100%',
    height: '100%',
  },
  topActionsRow: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  iconButtonSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockOverlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 5,
  },
  lockText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  overlayName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  overlaySubText: {
    fontSize: 15,
    color: '#E5E7EB',
    marginBottom: 6,
    lineHeight: 22,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  onlineDotMini: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  timeBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  youAndHerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  youAndHerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  detailsContainer: {
    padding: 20,
    backgroundColor: '#F3F4F6',
  },
  sectionHeaderTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  pillText: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '500',
  },
  aboutCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 24,
  },
  secondaryActionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryActionText: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '600',
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 40,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    backgroundColor: 'rgba(243, 244, 246, 0.9)', // slightly transparent matching background
  },
  stickyConnectButton: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  stickyConnectGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    borderRadius: 30,
  },
  stickyConnectText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  section: {
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  sectionContent: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoIcon: {
    marginRight: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    width: 140,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  aboutText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
  },
  loadingCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
});