import { Redis } from '@upstash/redis';

if (!process.env.UPSTASH_REDIS_REST_URL) {
  console.warn('⚠️ UPSTASH_REDIS_REST_URL not configured. Redis caching disabled.');
}

if (!process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.warn('⚠️ UPSTASH_REDIS_REST_TOKEN not configured. Redis caching disabled.');
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Cache key builders
export const cacheKeys = {
  // Community posts
  communityPostsFeed: (communityId: string, page: number = 1) =>
    `community:${communityId}:posts:feed:page:${page}`,
  communityPost: (postId: string) => `community:post:${postId}`,
  communityPostComments: (postId: string) => `community:post:${postId}:comments`,

  // User data
  userSession: (userId: string) => `user:${userId}:session`,
  userProfile: (userId: string) => `user:${userId}:profile`,

  // Community data
  community: (communityId: string) => `community:${communityId}`,
  communityMembers: (communityId: string) => `community:${communityId}:members`,

  // AI tokens
  aiTokenBalance: (userId: string) => `user:${userId}:ai_tokens:balance`,
};

// Cache utilities
export const cacheUtils = {
  // TTL in seconds
  TTL: {
    SHORT: 5 * 60, // 5 minutes
    MEDIUM: 30 * 60, // 30 minutes
    LONG: 60 * 60, // 1 hour
    VERY_LONG: 24 * 60 * 60, // 24 hours
  },

  // Set cache with TTL
  async set<T>(key: string, value: T, ttl = cacheUtils.TTL.MEDIUM) {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error(`Redis cache set error for key ${key}:`, error);
      // Fail silently - cache is optional
    }
  },

  // Get cache
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data as string) : null;
    } catch (error) {
      console.error(`Redis cache get error for key ${key}:`, error);
      return null;
    }
  },

  // Delete cache
  async delete(key: string) {
    try {
      await redis.del(key);
    } catch (error) {
      console.error(`Redis cache delete error for key ${key}:`, error);
    }
  },

  // Delete multiple keys matching pattern
  async deletePattern(pattern: string) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error(`Redis cache pattern delete error for pattern ${pattern}:`, error);
    }
  },

  // Clear all cache for a user
  async clearUserCache(userId: string) {
    await cacheUtils.deletePattern(`user:${userId}:*`);
  },

  // Clear all cache for a community
  async clearCommunityCache(communityId: string) {
    await cacheUtils.deletePattern(`community:${communityId}:*`);
  },
};
