import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { likeAPI, isAlreadyLiked } from './api';

/**
 * Where this profile and I stand.
 *
 *  NONE       nothing between us - offer Connect
 *  SENT       I asked, waiting - offer Withdraw, never a second Connect
 *  RECEIVED   they asked, waiting - offer Accept
 *  CONNECTED  accepted in either direction - no request button at all
 *  DECLINED   refused; treated as NONE so a request can be sent again later
 */
export type ConnectionState = 'NONE' | 'SENT' | 'RECEIVED' | 'CONNECTED' | 'DECLINED';

/**
 * Single source of truth for connection state across every screen.
 *
 * Built from both /likes/me (sent) and /likes (received), because direction
 * alone is not enough: once B accepts A's request, B must not be offered a
 * Connect button for A - from B's side the row only exists as *received*, so a
 * hook that tracked sent requests only would happily show "Connect" and then
 * fail with "You have already liked this profile".
 */
export function useConnections() {
  const [states, setStates] = useState<Record<string, ConnectionState>>({});
  const [ready, setReady] = useState(false);
  // Guards against a second request while the first is still open.
  const inFlight = useRef<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    try {
      const [sentRes, receivedRes] = await Promise.all([
        likeAPI.getSentLikes(),
        likeAPI.getReceivedLikes(),
      ]);

      const rows = (res: any) =>
        Array.isArray(res?.data) ? res.data : (res?.data?.content ?? []);

      const next: Record<string, ConnectionState> = {};

      const otherId = (item: any) => {
        // Both endpoints put the *other* person in likedProfile - sent lists the
        // person I liked, received lists the person who liked me.
        const p = item?.likedProfile ?? item?.profile ?? item ?? {};
        const id = p.id ?? p.profileId ?? item?.likedProfileId;
        return id == null ? null : String(id);
      };

      const statusOf = (item: any) => String(item?.status ?? '').toLowerCase();

      for (const item of rows(sentRes)) {
        const id = otherId(item);
        if (!id) continue;
        const status = statusOf(item);
        next[id] =
          status === 'accepted' ? 'CONNECTED' : status === 'rejected' || status === 'declined' ? 'DECLINED' : 'SENT';
      }

      for (const item of rows(receivedRes)) {
        const id = otherId(item);
        if (!id) continue;
        const status = statusOf(item);
        const incoming =
          status === 'accepted' ? 'CONNECTED' : status === 'rejected' || status === 'declined' ? 'DECLINED' : 'RECEIVED';

        // CONNECTED always wins. A pair can legitimately appear in both lists,
        // and being connected outranks a stale pending row on either side.
        next[id] = next[id] === 'CONNECTED' || incoming === 'CONNECTED' ? 'CONNECTED' : incoming;
      }

      setStates(next);
    } catch (error: any) {
      // Only costs button accuracy - isAlreadyLiked still catches duplicates.
      console.log('Could not load connections:', error?.message);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const stateOf = useCallback(
    (id: string | number | undefined | null): ConnectionState =>
      id == null ? 'NONE' : (states[String(id)] ?? 'NONE'),
    [states]
  );

  /** True only when a request has been sent or accepted - not for DECLINED. */
  const isConnected = useCallback(
    (id: string | number | undefined | null) => {
      const s = stateOf(id);
      return s === 'SENT' || s === 'CONNECTED';
    },
    [stateOf]
  );

  const setLocal = (id: string | number, value: ConnectionState) =>
    setStates((prev) => ({ ...prev, [String(id)]: value }));

  const connect = useCallback(
    async (id: string | number) => {
      const key = String(id);
      const current = stateOf(id);
      if (current === 'SENT' || current === 'CONNECTED' || inFlight.current.has(key)) return;

      inFlight.current.add(key);
      setLocal(id, 'SENT');

      try {
        await likeAPI.likeProfile(id);
      } catch (error: any) {
        if (isAlreadyLiked(error)) return; // already true - keep the optimistic state

        setLocal(id, current);
        Alert.alert(
          'Error',
          error?.response?.data?.message || error?.response?.data?.detail || 'Failed to send request'
        );
      } finally {
        inFlight.current.delete(key);
      }
    },
    [stateOf]
  );

  /**
   * Take back a pending request.
   *
   * The backend deletes the row in whichever direction it exists, so the pair
   * returns to NONE and a fresh request can be sent later - which is the point:
   * withdrawing must not permanently block reconnecting.
   */
  const withdraw = useCallback(
    async (id: string | number) => {
      const key = String(id);
      const current = stateOf(id);
      if (inFlight.current.has(key)) return;

      inFlight.current.add(key);
      setLocal(id, 'NONE');

      try {
        await likeAPI.unlikeProfile(id);
      } catch (error: any) {
        setLocal(id, current);
        Alert.alert('Error', error?.response?.data?.detail || 'Could not withdraw');
      } finally {
        inFlight.current.delete(key);
      }
    },
    [stateOf]
  );

  const accept = useCallback(
    async (id: string | number) => {
      const key = String(id);
      const current = stateOf(id);
      if (inFlight.current.has(key)) return;

      inFlight.current.add(key);
      setLocal(id, 'CONNECTED');

      try {
        await likeAPI.acceptLike(id);
      } catch (error: any) {
        setLocal(id, current);
        Alert.alert('Error', error?.response?.data?.detail || 'Could not accept');
      } finally {
        inFlight.current.delete(key);
      }
    },
    [stateOf]
  );

  const decline = useCallback(
    async (id: string | number) => {
      const key = String(id);
      const current = stateOf(id);
      if (inFlight.current.has(key)) return;

      inFlight.current.add(key);
      setLocal(id, 'DECLINED');

      try {
        await likeAPI.declineLike(id);
      } catch (error: any) {
        setLocal(id, current);
        Alert.alert('Error', error?.response?.data?.detail || 'Could not decline');
      } finally {
        inFlight.current.delete(key);
      }
    },
    [stateOf]
  );

  return { states, stateOf, isConnected, connect, withdraw, accept, decline, refresh, ready };
}

/** Button label and treatment for a connection state. */
export function connectionAction(state: ConnectionState): {
  label: string;
  variant: 'filled' | 'muted';
  disabled: boolean;
} {
  switch (state) {
    case 'CONNECTED':
      return { label: 'Connected', variant: 'muted', disabled: true };
    case 'SENT':
      return { label: 'Withdraw', variant: 'muted', disabled: false };
    case 'RECEIVED':
      return { label: 'Accept', variant: 'filled', disabled: false };
    default:
      return { label: 'Connect', variant: 'filled', disabled: false };
  }
}
