const CACHE_KEY = 'membership-card-cache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface CardCacheData {
  membership: {
    id: string;
    name: string;
    mbrf_id: string | null;
    [key: string]: unknown;
  };
  profile: {
    full_name: string;
    email: string;
    avatar_url: string | null;
    mbrf_id: string | null;
  };
  dependents: Array<{
    id: string;
    name: string;
    relationship: string;
    birth_date: string | null;
    member_id: string;
    created_at: string;
    updated_at: string;
  }>;
  cachedAt: string;
  avatarBase64: string | null;
}

export function saveCardCache(data: Omit<CardCacheData, 'cachedAt'>): void {
  try {
    const payload: CardCacheData = {
      ...data,
      cachedAt: new Date().toISOString(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // localStorage full or unavailable
  }
}

export function getCardCache(): CardCacheData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const data: CardCacheData = JSON.parse(raw);
    const age = Date.now() - new Date(data.cachedAt).getTime();
    if (age > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function isCacheValid(): boolean {
  return getCardCache() !== null;
}

export function getCacheAge(cachedAt: string): string {
  const diffMs = Date.now() - new Date(cachedAt).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  return `${diffH}h`;
}

export async function cacheAvatarAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}
