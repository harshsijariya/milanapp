import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { profileAPI, shortlistAPI } from '../utils/api';
import { useGuardedRouter } from '../utils/useGuardedRouter';
import { useConnections, connectionAction } from '../utils/useConnections';
import ProfileRow from '../components/ProfileRow';
import SwipeDeck from '../components/SwipeDeck';
import {
  colors,
  font,
  radius,
  spacing,
  profileId,
  profileName,
  type Profile,
} from '../components/theme';

const PAGE_SIZE = 20;
type Mode = 'list' | 'swipe';

/**
 * All profiles.
 *
 * Defaults to the list, which is what "See all" on the home feed implies, with
 * a toggle into the swipe deck for browsing one at a time. Both modes share the
 * same paginated data, so switching never refetches.
 */
export default function AllProfilesScreen() {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<Mode>('list');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [index, setIndex] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { stateOf, connect, withdraw, accept } = useConnections();

  const loadPage = useCallback(async (next: number, replace = false) => {
    const res = await profileAPI.getProfiles(next, PAGE_SIZE);
    const body = res?.data;
    const raw = body?.content ?? body ?? [];
    const list: Profile[] = Array.isArray(raw) ? raw : [];

    setProfiles((prev) => (replace ? list : [...prev, ...list]));
    setHasMore(list.length === PAGE_SIZE);
    setPage(next);
    return list;
  }, []);

  useEffect(() => {
    loadPage(0, true)
      .catch((e: any) => console.log('Failed to load profiles:', e?.message))
      .finally(() => setLoading(false));
  }, [loadPage]);

  const fetchMore = useCallback(async () => {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    try {
      await loadPage(page + 1);
    } catch (e: any) {
      console.log('Failed to load more:', e?.message);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, loading, page, loadPage]);

  // In swipe mode there is no scroll position to trigger paging, so top the
  // deck up before it runs dry.
  useEffect(() => {
    if (mode !== 'swipe') return;
    if (profiles.length - index > 4) return;
    fetchMore();
  }, [mode, index, profiles.length, fetchMore]);

  const onRefresh = () => {
    setRefreshing(true);
    setIndex(0);
    setHasMore(true);
    loadPage(0, true)
      .catch(() => {})
      .finally(() => setRefreshing(false));
  };

  const handleShortlist = async (id: string | number) => {
    try {
      await shortlistAPI.add(id);
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.detail || 'Failed to shortlist');
    }
  };

  const openProfile = (id: string | number) => router.push(`/profile-detail/${id}`);

  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter((p) => profileName(p).toLowerCase().includes(q));
  }, [profiles, query]);

  const deckDone = mode === 'swipe' && !loading && !profiles[index] && !hasMore;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity hitSlop={8} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>All profiles</Text>
        <TouchableOpacity
          hitSlop={8}
          onPress={() => setMode((m) => (m === 'list' ? 'swipe' : 'list'))}
          accessibilityLabel={mode === 'list' ? 'Switch to card view' : 'Switch to list view'}
        >
          <Ionicons
            name={mode === 'list' ? 'albums-outline' : 'list-outline'}
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : mode === 'swipe' ? (
        deckDone ? (
          <View style={styles.center}>
            <View style={styles.empty}>
              <Ionicons name="checkmark-done-outline" size={56} color={colors.textFaint} />
              <Text style={styles.emptyTitle}>You&apos;ve seen everyone</Text>
              <Text style={styles.emptyText}>Switch to list view to browse again</Text>
              <TouchableOpacity style={styles.pillBtn} onPress={() => setIndex(0)}>
                <Text style={styles.pillText}>Start over</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <SwipeDeck
            profiles={profiles}
            index={index}
            onSwipe={(direction, profile) => {
              const id = profileId(profile);
              if (direction === 'right' && id != null) connect(id);
              setIndex((i) => i + 1);
            }}
            onShortlist={handleShortlist}
            onOpen={openProfile}
          />
        )
      ) : (
        <>
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={17} color={colors.textMuted} />
            <TextInput
              style={styles.search}
              placeholder="Search profiles"
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
            />
            {!!query && (
              <TouchableOpacity hitSlop={8} onPress={() => setQuery('')} accessibilityLabel="Clear">
                <Ionicons name="close-circle" size={17} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={data}
            keyExtractor={(item, i) => `${profileId(item) ?? 'p'}-${i}`}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.accent}
              />
            }
            renderItem={({ item }) => {
              const id = profileId(item);
              const state = stateOf(id);
              const action = connectionAction(state);
              return (
                <ProfileRow
                  profile={item}
                  action={{
                    ...action,
                    onPress: () => {
                      if (id == null) return;
                      if (state === 'SENT') withdraw(id);
                      else if (state === 'RECEIVED') accept(id);
                      else if (state !== 'CONNECTED') connect(id);
                    },
                  }}
                  onPress={() => id != null && openProfile(id)}
                />
              );
            }}
            // Searching filters the pages already loaded, so paging while a
            // query is active would append results the filter then hides.
            onEndReached={query ? undefined : fetchMore}
            onEndReachedThreshold={0.6}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.footer}>
                  <ActivityIndicator color={colors.accent} />
                </View>
              ) : !hasMore && profiles.length > 0 && !query ? (
                <Text style={styles.endText}>No more profiles</Text>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons
                  name={query ? 'search-outline' : 'people-outline'}
                  size={48}
                  color={colors.textFaint}
                />
                <Text style={styles.emptyTitle}>{query ? 'No matches' : 'No profiles yet'}</Text>
                {!!query && (
                  <Text style={styles.emptyText}>Nothing loaded matches “{query}”</Text>
                )}
              </View>
            }
          />
        </>
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
  title: {
    fontSize: font.heading,
    fontWeight: '600',
    color: colors.text,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    margin: spacing.md,
    paddingHorizontal: spacing.md,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  search: {
    flex: 1,
    fontSize: font.label,
    color: colors.text,
    padding: 0,
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
    paddingTop: 64,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: font.title,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.sm,
  },
  emptyText: {
    fontSize: font.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  pillBtn: {
    marginTop: spacing.lg,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.link,
  },
  pillText: {
    color: colors.link,
    fontSize: font.label,
    fontWeight: '600',
  },
});
