import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { notificationAPI } from '../utils/api';
import { useGuardedRouter } from '../utils/useGuardedRouter';
import { onNotificationReceived } from '../utils/notifications';
import { colors, font, spacing, timeAgo } from '../components/theme';

const PAGE_SIZE = 20;

type Item = {
  id: number;
  type: string;
  title: string;
  body?: string;
  actorId?: string | null;
  read: boolean;
  createdAt: string;
};

/** Icon and tint per notification type. */
const ICONS: Record<string, { name: any; color: string }> = {
  LIKE_RECEIVED: { name: 'heart', color: colors.danger },
  LIKE_ACCEPTED: { name: 'checkmark-circle', color: colors.online },
  PROFILE_VIEW: { name: 'eye', color: colors.link },
  MESSAGE: { name: 'chatbubble', color: colors.accent },
  BROADCAST: { name: 'megaphone', color: colors.star },
};

export default function NotificationsScreen() {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();

  const [items, setItems] = useState<Item[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadPage = useCallback(async (next: number, replace = false) => {
    const res = await notificationAPI.list(next, PAGE_SIZE);
    // Spring Data Page: { content, last, totalElements, ... }
    const body = res?.data;
    const list: Item[] = body?.content ?? (Array.isArray(body) ? body : []);

    setItems((prev) => (replace ? list : [...prev, ...list]));
    setHasMore(body?.last === undefined ? list.length === PAGE_SIZE : !body.last);
    setPage(next);
  }, []);

  const load = useCallback(async () => {
    try {
      await loadPage(0, true);
      // Opening the screen is the read event, so clear the badge here rather
      // than making the user tap each row.
      await notificationAPI.markAllRead();
    } catch (error: any) {
      console.log('Failed to load notifications:', error?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadPage]);

  useEffect(() => {
    load();
    // A push arriving while this screen is open should appear without a manual pull.
    return onNotificationReceived(() => load());
  }, [load]);

  const fetchMore = async () => {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    try {
      await loadPage(page + 1);
    } catch {
      // Silent: the list simply stops growing.
    } finally {
      setLoadingMore(false);
    }
  };

  const open = (item: Item) => {
    if (item.actorId) router.push(`/profile-detail/${item.actorId}`);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity hitSlop={8} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, i) => `${item.id ?? 'n'}-${i}`}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={colors.accent}
            />
          }
          renderItem={({ item }) => {
            const icon = ICONS[item.type] ?? { name: 'notifications', color: colors.textMuted };
            return (
              <TouchableOpacity
                style={[styles.row, !item.read && styles.rowUnread]}
                activeOpacity={item.actorId ? 0.8 : 1}
                onPress={() => open(item)}
              >
                <View style={[styles.iconWrap, { backgroundColor: `${icon.color}1A` }]}>
                  <Ionicons name={icon.name} size={20} color={icon.color} />
                </View>

                <View style={styles.text}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {!!item.body && (
                    <Text style={styles.rowBody} numberOfLines={2}>
                      {item.body}
                    </Text>
                  )}
                  <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
                </View>

                {!item.read && <View style={styles.dot} />}
              </TouchableOpacity>
            );
          }}
          onEndReached={fetchMore}
          onEndReachedThreshold={0.6}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footer}>
                <ActivityIndicator color={colors.accent} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="notifications-outline" size={48} color={colors.textFaint} />
              <Text style={styles.emptyTitle}>Nothing yet</Text>
              <Text style={styles.emptyText}>
                Connection requests and updates will appear here
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  rowUnread: {
    backgroundColor: colors.accentSoft,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: font.label,
    fontWeight: '600',
    color: colors.text,
  },
  rowBody: {
    fontSize: font.body,
    color: colors.textMuted,
    lineHeight: 18,
  },
  time: {
    fontSize: font.small,
    color: colors.textFaint,
    marginTop: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  footer: {
    paddingVertical: spacing.xl,
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
