import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { profileAPI, shortlistAPI, notificationAPI } from '../../utils/api';
import { useGuardedRouter } from '../../utils/useGuardedRouter';
import { useConnections } from '../../utils/useConnections';
import { registerForPush, onNotificationReceived } from '../../utils/notifications';
import StoryRail from '../../components/StoryRail';
import ProfileFeedCard from '../../components/ProfileFeedCard';
import { colors, font, spacing, profileId, profileImage, type Profile } from '../../components/theme';

const PAGE_SIZE = 10;

export default function HomeScreen() {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [stories, setStories] = useState<Profile[]>([]);
  const [myImage, setMyImage] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [unread, setUnread] = useState(0);

  // Seeded from the server so profiles already requested in an earlier session
  // render as "Request sent" instead of offering Connect again.
  const { stateOf, connect, withdraw, accept } = useConnections();

  // One tap cycles the request through its states, so the feed button always
  // does the obvious thing: ask, take back, or respond.
  const handleConnect = useCallback(
    (id: string | number) => {
      const state = stateOf(id);
      if (state === 'SENT') return withdraw(id);
      if (state === 'RECEIVED') return accept(id);
      if (state === 'CONNECTED') return;
      return connect(id);
    },
    [stateOf, connect, withdraw, accept]
  );

  // Optimistic set - the feed reflects the tap immediately rather than waiting
  // for the round trip, and reverts if the request fails.
  const [shortlisted, setShortlisted] = useState<Set<string>>(new Set());

  const readPage = (res: any) => {
    const body = res?.data;
    const list = body?.content ?? body ?? [];
    return Array.isArray(list) ? list : [];
  };

  const loadPage = useCallback(async (next: number, replace = false) => {
    // The browse feed is gender-filtered; "See all" on the next screen is not.
    const res = await profileAPI.getProfiles(next, PAGE_SIZE, true);
    const list = readPage(res);

    setProfiles((prev) => (replace ? list : [...prev, ...list]));
    setHasMore(list.length === PAGE_SIZE);
    setPage(next);
    return list;
  }, []);

  const bootstrap = useCallback(async () => {
    try {
      const list = await loadPage(0, true);
      // The story rail shows the newest joiners; the feed shows everyone.
      setStories(list.slice(0, 12));
    } catch (error: any) {
      console.log('Failed to load feed:', error?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadPage]);

  const refreshUnread = useCallback(() => {
    notificationAPI
      .unreadCount()
      .then((res) => setUnread(Number(res.data?.count ?? 0)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    bootstrap();
    profileAPI
      .getMe()
      .then((res) => setMyImage(profileImage(res.data)))
      .catch(() => {});
    AsyncStorage.getItem('user_data').catch(() => {});

    // Home is the first authenticated screen, so this is where the device
    // registers for push. Safe to repeat - the backend upserts by token.
    registerForPush();
    refreshUnread();

    // Bump the badge the moment a push lands while the app is open.
    return onNotificationReceived(refreshUnread);
  }, [bootstrap, refreshUnread]);

  // Coming back from the notifications screen should clear the badge.
  useFocusEffect(useCallback(() => refreshUnread(), [refreshUnread]));

  const onRefresh = () => {
    setRefreshing(true);
    bootstrap();
  };

  const onEndReached = async () => {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    try {
      await loadPage(page + 1);
    } catch (error: any) {
      console.log('Failed to load more:', error?.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const openProfile = useCallback(
    (id: string | number) => router.push(`/profile-detail/${id}`),
    [router]
  );

  // Read through a ref rather than closing over `shortlisted` directly. Naming
  // the state in the dependency array would give every card a new callback each
  // time any profile is shortlisted, which is exactly the re-render that
  // memoising ProfileFeedCard is meant to stop.
  const shortlistedRef = useRef(shortlisted);
  shortlistedRef.current = shortlisted;

  const handleShortlist = useCallback(async (id: string | number) => {
    const key = String(id);
    const isOn = shortlistedRef.current.has(key);

    setShortlisted((prev) => {
      const next = new Set(prev);
      if (isOn) next.delete(key);
      else next.add(key);
      return next;
    });

    try {
      if (isOn) await shortlistAPI.remove(id);
      else await shortlistAPI.add(id);
    } catch (error: any) {
      setShortlisted((prev) => {
        const next = new Set(prev);
        if (isOn) next.add(key);
        else next.delete(key);
        return next;
      });
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update shortlist');
    }
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity hitSlop={8} onPress={() => router.push('/profile-setup')}>
          <Ionicons name="add-circle-outline" size={28} color={colors.text} />
        </TouchableOpacity>

        <Text style={styles.wordmark}>Gahoi Milan</Text>

        <TouchableOpacity
          hitSlop={8}
          onPress={() => router.push('/notifications')}
          accessibilityLabel={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        >
          <Ionicons
            name={unread > 0 ? 'notifications' : 'notifications-outline'}
            size={28}
            color={colors.text}
          />
          {unread > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={profiles}
          keyExtractor={(item, index) => `${profileId(item) ?? 'p'}-${index}`}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
            />
          }
          ListHeaderComponent={
            <>
              <StoryRail
                profiles={stories}
                myImage={myImage}
                onPressProfile={openProfile}
                onPressMine={() => router.push('/(tabs)/profile')}
              />
              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>Suggested for you</Text>
                <TouchableOpacity onPress={() => router.push('/all-profiles')}>
                  <Text style={styles.seeAll}>See all</Text>
                </TouchableOpacity>
              </View>
            </>
          }
          renderItem={({ item }) => (
            <ProfileFeedCard
              profile={item}
              state={stateOf(profileId(item))}
              shortlisted={shortlisted.has(String(profileId(item)))}
              onPress={openProfile}
              onConnect={handleConnect}
              onShortlist={handleShortlist}
            />
          )}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.6}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footer}>
                <ActivityIndicator color={colors.accent} />
              </View>
            ) : !hasMore && profiles.length > 0 ? (
              <Text style={styles.endText}>You&apos;re all caught up</Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color={colors.textFaint} />
              <Text style={styles.emptyText}>No profiles yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  wordmark: {
    fontSize: 22,
    color: colors.text,
    fontWeight: '600',
    letterSpacing: 0.2,
    ...Platform.select({ ios: { fontFamily: 'Snell Roundhand' } }),
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.bg,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: font.label,
    fontWeight: '600',
    color: colors.text,
  },
  seeAll: {
    fontSize: font.body,
    fontWeight: '600',
    color: colors.link,
  },
  footer: {
    paddingVertical: spacing.xl,
  },
  endText: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: font.body,
    paddingVertical: spacing.xl,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 64,
    gap: spacing.md,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: font.label,
  },
});
