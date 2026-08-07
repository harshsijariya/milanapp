import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { likeAPI } from '../../utils/api';
import { useGuardedRouter } from '../../utils/useGuardedRouter';
import { confirmAction } from '../../utils/confirm';
import ProfileRow, { type RowAction } from '../../components/ProfileRow';
import { colors, font, radius, spacing, profileId, timeAgo, type Profile } from '../../components/theme';

type Tab = 'received' | 'sent';
type SortKey = 'recent' | 'name';

type LikeItem = {
  raw: any;
  profile: Profile;
  status: string;
  at?: string;
};

/**
 * Interest inbox, laid out like Instagram's followers list: a segmented count
 * header, a sort row, then ringed-avatar rows with a trailing action.
 */
export default function LikesScreen() {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState<Tab>('received');
  const [received, setReceived] = useState<LikeItem[]>([]);
  const [sent, setSent] = useState<LikeItem[]>([]);
  const [sort, setSort] = useState<SortKey>('recent');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // The two endpoints spell the nested profile and timestamp differently, so
  // both are flattened to one shape here rather than at every render site.
  const normalise = (item: any): LikeItem => {
    const p = item.likedProfile || item.profile || item.user || {};
    let status = String(item.status ?? '').toLowerCase();
    if (status === 'rejected') status = 'declined';

    return {
      raw: item,
      profile: {
        ...p,
        city: p.city || p.presentAddress || '',
        state: p.state || '',
      },
      status,
      at: item.likedAt || item.liked_at || item.createdAt,
    };
  };

  const load = useCallback(async () => {
    try {
      const [recRes, sentRes] = await Promise.all([
        likeAPI.getReceivedLikes(),
        likeAPI.getSentLikes(),
      ]);

      const clean = (res: any) =>
        (Array.isArray(res?.data) ? res.data : (res?.data?.content ?? []))
          .map(normalise)
          .filter((x: LikeItem) => profileId(x.profile) != null);

      setReceived(clean(recRes));
      setSent(clean(sentRes));
    } catch {
      Alert.alert('Error', 'Failed to load interests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const act = async (fn: () => Promise<any>, failure: string) => {
    try {
      await fn();
      await load();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.detail || failure);
    }
  };

  const data = useMemo(() => {
    const list = tab === 'received' ? received : sent;
    const q = query.trim().toLowerCase();
    // Filters the rows already loaded - both tabs come down in one pass, so
    // there is nothing to fetch.
    const copy = q
      ? list.filter((x) => String(x.profile?.name ?? '').toLowerCase().includes(q))
      : [...list];
    if (sort === 'name') {
      copy.sort((a, b) =>
        String(a.profile.name ?? '').localeCompare(String(b.profile.name ?? ''))
      );
    } else {
      copy.sort((a, b) => new Date(b.at ?? 0).getTime() - new Date(a.at ?? 0).getTime());
    }
    return copy;
  }, [tab, received, sent, sort, query]);

  const actionFor = (item: LikeItem): RowAction => {
    const id = profileId(item.profile);
    if (id == null) return { label: '—', variant: 'muted', disabled: true };

    if (tab === 'received') {
      if (item.status === 'accepted') return { label: 'Connected', variant: 'muted', disabled: true };
      if (item.status === 'declined') return { label: 'Declined', variant: 'muted', disabled: true };
      return {
        label: 'Connect',
        variant: 'filled',
        onPress: () => act(() => likeAPI.acceptLike(id), 'Failed to accept'),
      };
    }

    if (item.status === 'accepted') return { label: 'Connected', variant: 'muted', disabled: true };

    // Pending request I sent. Withdrawing deletes the row, so the pair returns
    // to neutral and a fresh request can be sent later - the button is the
    // obvious place for that, not a hidden X.
    return {
      label: 'Withdraw',
      variant: 'muted',
      onPress: () =>
        confirmAction('Withdraw request', 'Cancel your connection request?', 'Withdraw', () =>
          act(() => likeAPI.unlikeProfile(id), 'Failed to withdraw')
        ),
    };
  };

  const dismissFor = (item: LikeItem) => {
    const id = profileId(item.profile);
    if (id == null) return undefined;

    if (tab === 'received') {
      if (item.status === 'accepted' || item.status === 'declined') return undefined;
      return () =>
        confirmAction('Decline interest', 'Decline this request?', 'Decline', () =>
          act(() => likeAPI.declineLike(id), 'Failed to decline')
        );
    }

    return () =>
      confirmAction('Withdraw request', 'Cancel your connection request?', 'Withdraw', () =>
        act(() => likeAPI.unlikeProfile(id), 'Failed to cancel')
      );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Interests</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'received' && styles.tabActive]}
          onPress={() => setTab('received')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, tab === 'received' && styles.tabTextActive]}>
            {received.length} received
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'sent' && styles.tabActive]}
          onPress={() => setTab('sent')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, tab === 'sent' && styles.tabTextActive]}>
            {sent.length} sent
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={17} color={colors.textMuted} />
        <TextInput
          style={styles.search}
          placeholder="Search by name"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
        {!!query && (
          <TouchableOpacity hitSlop={8} onPress={() => setQuery('')} accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={17} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>
          Sort by <Text style={styles.sortValue}>{sort === 'recent' ? 'Recent' : 'Name'}</Text>
        </Text>
        <TouchableOpacity
          hitSlop={8}
          onPress={() => setSort((s) => (s === 'recent' ? 'name' : 'recent'))}
          accessibilityLabel="Change sort order"
        >
          <Ionicons name="swap-vertical" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, i) => `${profileId(item.profile) ?? 'l'}-${i}`}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
          renderItem={({ item }) => (
            <ProfileRow
              profile={item.profile}
              meta={item.at ? timeAgo(item.at) : undefined}
              action={actionFor(item)}
              onDismiss={dismissFor(item)}
              dismissLabel={tab === 'received' ? 'Decline' : 'Withdraw'}
              onPress={() => {
                const id = profileId(item.profile);
                if (id != null) router.push(`/profile-detail/${id}`);
              }}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="heart-outline" size={48} color={colors.textFaint} />
              <Text style={styles.emptyTitle}>
                {query
                  ? 'No matches'
                  : tab === 'received'
                    ? 'No interests yet'
                    : 'No requests sent'}
              </Text>
              <Text style={styles.emptyText}>
                {tab === 'received'
                  ? 'When someone connects with you, they’ll appear here'
                  : 'Profiles you connect with will appear here'}
              </Text>
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: font.heading,
    fontWeight: '600',
    color: colors.text,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.text,
  },
  tabText: {
    fontSize: font.label,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  search: { flex: 1, fontSize: font.label, color: colors.text, padding: 0 },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  sortLabel: {
    fontSize: font.label,
    color: colors.text,
  },
  sortValue: {
    fontWeight: '600',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 72,
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
});
