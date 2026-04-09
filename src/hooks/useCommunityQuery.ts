'use client';

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { redis, cacheKeys, cacheUtils } from '@/lib/redis';

// Fetch paginated community posts feed
export function useCommunityPostsFeed(communityId: string, pageSize = 20) {
  return useInfiniteQuery({
    queryKey: ['community-posts', communityId],
    queryFn: async ({ pageParam = 1 }) => {
      // Try to get from cache first
      const cacheKey = cacheKeys.communityPostsFeed(communityId, pageParam);
      const cachedData = await cacheUtils.get(cacheKey);
      if (cachedData) return cachedData;

      const { data, error } = await supabase
        .from('community_posts')
        .select(
          `
          id, content, title, created_at, updated_at,
          author_id,
          files,
          author:users!author_id(id, full_name, avatar_url, role)
        `,
        )
        .eq('community_id', communityId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .range((pageParam - 1) * pageSize, pageParam * pageSize - 1);

      if (error) throw error;

      // Cache the results
      if (data) {
        await cacheUtils.set(cacheKey, data, cacheUtils.TTL.SHORT);
      }

      return data || [];
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage && lastPage.length === pageSize ? allPages.length + 1 : undefined,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Fetch single community post
export function useCommunityPost(postId: string) {
  return useQuery({
    queryKey: ['community-post', postId],
    queryFn: async () => {
      const cacheKey = cacheKeys.communityPost(postId);
      const cachedData = await cacheUtils.get(cacheKey);
      if (cachedData) return cachedData;

      const { data, error } = await supabase
        .from('community_posts')
        .select(
          `
          id, content, title, created_at, updated_at,
          created_by,
          community_id,
          community_posts_attachments(id, url, type),
          profiles:created_by(id, display_name, avatar_url)
        `,
        )
        .eq('id', postId)
        .single();

      if (error) throw error;

      if (data) {
        await cacheUtils.set(cacheKey, data, cacheUtils.TTL.MEDIUM);
      }

      return data;
    },
    enabled: !!postId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Fetch post comments
export function useCommunityPostComments(postId: string) {
  return useQuery({
    queryKey: ['community-comments', postId],
    queryFn: async () => {
      const cacheKey = cacheKeys.communityPostComments(postId);
      const cachedData = await cacheUtils.get(cacheKey);
      if (cachedData) return cachedData;

      const { data, error } = await supabase
        .from('community_comments')
        .select(
          `
          id, content, created_at, updated_at,
          author_id,
          author:users!author_id(id, full_name, avatar_url, role)
        `,
        )
        .eq('post_id', postId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        await cacheUtils.set(cacheKey, data, cacheUtils.TTL.SHORT);
      }

      return data || [];
    },
    enabled: !!postId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Create a new post
export function useCreatePost(communityId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postData: { title: string; content: string }) => {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.from('community_posts').insert({
        community_id: communityId,
        author_id: user.id,
        title: postData.title,
        content: postData.content,
      }).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate feed cache
      queryClient.invalidateQueries({ queryKey: ['community-posts', communityId] });
      // Clear Redis cache for this community
      cacheUtils.deletePattern(`community:${communityId}:posts:*`);
    },
  });
}

// Create a new comment
export function useCreateComment(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentData: { content: string }) => {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.from('community_comments').insert({
        post_id: postId,
        author_id: user.id,
        content: commentData.content,
      }).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate comments cache
      queryClient.invalidateQueries({ queryKey: ['community-comments', postId] });
      // Clear Redis cache
      cacheUtils.delete(cacheKeys.communityPostComments(postId));
    },
  });
}

// Delete post
export function useDeletePost(communityId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('community_posts')
        .update({ is_deleted: true })
        .eq('id', postId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate feed cache
      queryClient.invalidateQueries({ queryKey: ['community-posts', communityId] });
      // Clear Redis cache for this community
      cacheUtils.deletePattern(`community:${communityId}:posts:*`);
    },
  });
}
