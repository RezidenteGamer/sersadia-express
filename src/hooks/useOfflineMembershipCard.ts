import { useEffect, useState, useMemo } from 'react';
import { saveCardCache, getCardCache, getCacheAge, cacheAvatarAsBase64, type CardCacheData } from '@/lib/offlineCache';
import type { Member } from '@/hooks/useMembers';
import type { Dependent } from '@/hooks/useDependents';

interface Profile {
  full_name: string;
  email: string;
  avatar_url: string | null;
  mbrf_id: string | null;
}

interface UseOfflineParams {
  membership: Member | null | undefined;
  profile: Profile | null | undefined;
  dependents: Dependent[] | undefined;
  membershipLoading: boolean;
  membershipError: boolean;
  dependentsError: boolean;
}

interface UseOfflineResult {
  cardData: {
    membership: CardCacheData['membership'];
    profile: CardCacheData['profile'];
    dependents: CardCacheData['dependents'];
    avatarUrl: string | null;
  } | null;
  isOffline: boolean;
  cacheAge: string | null;
}

export function useOfflineMembershipCard({
  membership,
  profile,
  dependents,
  membershipLoading,
  membershipError,
  dependentsError,
}: UseOfflineParams): UseOfflineResult {
  const [cachedAvatar, setCachedAvatar] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [cache, setCache] = useState<CardCacheData | null>(null);

  // Detect offline: no network or query failures after loading
  useEffect(() => {
    const online = navigator.onLine;
    const queryFailed = !membershipLoading && (membershipError || dependentsError);
    setIsOffline(!online || queryFailed);
  }, [membershipLoading, membershipError, dependentsError]);

  // Listen for online/offline events
  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  // When online data is available, save to cache
  useEffect(() => {
    if (!membership || !profile || !dependents) return;

    const saveAsync = async () => {
      let avatarBase64: string | null = null;
      if (profile.avatar_url) {
        avatarBase64 = await cacheAvatarAsBase64(profile.avatar_url);
      }

      saveCardCache({
        membership: {
          id: membership.id,
          name: membership.name,
          mbrf_id: membership.mbrf_id,
        },
        profile: {
          full_name: profile.full_name,
          email: profile.email,
          avatar_url: profile.avatar_url,
          mbrf_id: profile.mbrf_id,
        },
        dependents: dependents.map((d) => ({
          id: d.id,
          name: d.name,
          relationship: d.relationship,
          birth_date: d.birth_date,
          member_id: d.member_id,
          created_at: d.created_at,
          updated_at: d.updated_at,
        })),
        avatarBase64,
      });
    };

    saveAsync();
  }, [membership, profile, dependents]);

  // When offline, load from cache
  useEffect(() => {
    if (isOffline && !membership) {
      const cached = getCardCache();
      setCache(cached);
      if (cached?.avatarBase64) {
        setCachedAvatar(cached.avatarBase64);
      }
    }
  }, [isOffline, membership]);

  const cardData = useMemo<UseOfflineResult['cardData']>(() => {
    // Online with data
    if (membership && profile) {
      return {
        membership: {
          id: membership.id,
          name: membership.name,
          mbrf_id: membership.mbrf_id,
        },
        profile: {
          full_name: profile.full_name,
          email: profile.email,
          avatar_url: profile.avatar_url,
          mbrf_id: profile.mbrf_id,
        },
        dependents: dependents?.map((d) => ({
          id: d.id,
          name: d.name,
          relationship: d.relationship,
          birth_date: d.birth_date,
          member_id: d.member_id,
          created_at: d.created_at,
          updated_at: d.updated_at,
        })) || [],
        avatarUrl: profile.avatar_url,
      };
    }

    // Offline with cache
    if (cache) {
      return {
        membership: cache.membership,
        profile: cache.profile,
        dependents: cache.dependents,
        avatarUrl: cachedAvatar || cache.avatarBase64,
      };
    }

    return null;
  }, [membership, profile, dependents, cache, cachedAvatar]);

  const cacheAge = cache?.cachedAt ? getCacheAge(cache.cachedAt) : null;

  return { cardData, isOffline: isOffline && !membership, cacheAge };
}
