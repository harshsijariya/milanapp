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
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { shortlistAPI } from '../../utils/api';
import { useGuardedRouter } from '../../utils/useGuardedRouter';
import { useConnections, connectionAction } from '../../utils/useConnections';
import { confirmAction } from '../../utils/confirm';
import ProfileRow from '../../components/ProfileRow';
import {
  colors,
  font,
  radius,
  spacing,
  profileId,
  profileName,
  unwrapProfile,
  type Profile,
} from '../../components/theme';

/**
 * Saved profiles, laid out like Instagram's followers list. Each row keeps the
 * primary action ("Connect") so the shortlist is actionable rather than just an
 * archive, with the X removing the entry.
 */
export default function ShortlistScreen() {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();

  const [items, setItems] = useState<Profile[]>([]);
  const { stateOf, connect, withdraw, accept } = useConnections();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await shortlistAPI.getAll();
      const list = res.data?.content ?? res.data ?? [];
      setItems((Array.isArray(list) ? list : []).map(unwrapProfile));
    } catch {
      Alert.alert('Error', 'Failed to load shortlist');
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

  const handleRemove = (id: string | number) => {
    confirmAction('Remove from shortlist', 'Remove this profile?', 'Remove', async () => {
      // Drop it locally first so the list does not sit there during the request.
      const before = items;
      setItems((prev) => prev.filter((p) => String(profileId(p)) !== String(id)));
      try {
        await shortlistAPI.remove(id);
      } catch {
        setItems(before);
        Alert.alert('Error', 'Failed to remove');
      }
    });
  };

  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((p) => profileName(p).toLowerCase().includes(q));
  }, [items, query]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shortlist</Text>
        <Text style={styles.headerCount}>
          {items.length} {items.length === 1 ? 'profile' : 'profiles'}
        </Text>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={17} color={colors.textMuted} />
        <TextInput
          style={styles.search}
          placeholder="Search"
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

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, i) => `${profileId(item) ?? 's'}-${i}`}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
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
                onDismiss={id != null ? () => handleRemove(id) : undefined}
                onPress={() => id != null && router.push(`/profile-detail/${id}`)}
              />
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name={query ? 'search-outline' : 'bookmark-outline'}
                size={48}
                color={colors.textFaint}
              />
              <Text style={styles.emptyTitle}>
                {query ? 'No matches' : 'Nothing shortlisted yet'}
              </Text>
              <Text style={styles.emptyText}>
                {query
                  ? `No saved profile matches “${query}”`
                  : 'Tap the bookmark on a profile to save it here'}
              </Text>
              {!query && (
                <TouchableOpacity
                  style={styles.browseBtn}
                  onPress={() => router.push('/all-profiles')}
                >
                  <Text style={styles.browseText}>Browse profiles</Text>
                </TouchableOpacity>
              )}
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
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: font.heading,
    fontWeight: '600',
    color: colors.text,
  },
  headerCount: {
    fontSize: font.body,
    color: colors.textMuted,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
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
  browseBtn: {
    marginTop: spacing.lg,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.link,
  },
  browseText: {
    color: colors.link,
    fontSize: font.label,
    fontWeight: '600',
  },
});
