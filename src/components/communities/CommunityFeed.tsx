'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { EditPostModal } from './EditPostModal';
import { PollComponent } from './PollComponent';
import { 
  Heart, 
  MessageCircle, 
  Bookmark, 
  Flag, 
  MoreVertical,
  Pin,
  Lock,
  Trash2,
  CheckCircle,
  AlertCircle,
  Megaphone,
  HelpCircle,
  Image as ImageIcon,
  Send,
  Paperclip,
  Download,
  Edit,
  Search,
  BarChart3
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface Post {
  id: string;
  community_id: string;
  author_id: string;
  title: string | null;
  content: string;
  type: 'normal' | 'question' | 'announcement' | 'poll';
  images: string[] | null;
  files?: any[];
  is_answered: boolean;
  likes_count: number;
  comments_count: number;
  views_count: number;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    role: 'student' | 'mentor';
  };
  user_has_liked: boolean;
  user_has_saved: boolean;
}

interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  likes_count: number;
  is_best_answer: boolean;
  created_at: string;
  author: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    role: 'student' | 'mentor';
  };
  user_has_liked: boolean;
}

interface CommunityFeedProps {
  communityId: string;
  userId: string;
  userRole: 'student' | 'mentor';
  isMentor: boolean;
}

export function CommunityFeed({ communityId, userId, userRole, isMentor }: CommunityFeedProps) {
  const supabase = createClient();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'questions' | 'announcements'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  useEffect(() => {
    fetchPosts();
    subscribeToChanges();
  }, [filter]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('community_posts')
        .select(`
          *,
          author:users!community_posts_author_id_fkey(id, full_name, avatar_url, role)
        `)
        .eq('community_id', communityId)
        .eq('is_deleted', false)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (filter === 'questions') {
        query = query.eq('type', 'question');
      } else if (filter === 'announcements') {
        query = query.eq('type', 'announcement');
      }

      const { data, error } = await query;

      if (error) throw error;

      // Check if user has liked/saved each post
      const postsWithUserData = await Promise.all(
        (data || []).map(async (post) => {
          const [{ data: liked }, { data: saved }] = await Promise.all([
            supabase
              .from('community_post_likes')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', userId)
              .single(),
            supabase
              .from('community_saved_posts')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', userId)
              .single()
          ]);

          return {
            ...post,
            user_has_liked: !!liked,
            user_has_saved: !!saved
          };
        })
      );

      setPosts(postsWithUserData);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToChanges = () => {
    const channel = supabase
      .channel('community_posts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_posts',
          filter: `community_id=eq.${communityId}`
        },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleLike = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      if (post.user_has_liked) {
        // Unlike
        await supabase
          .from('community_post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);
      } else {
        // Like
        await supabase
          .from('community_post_likes')
          .insert({ post_id: postId, user_id: userId });
      }

      // Update local state
      setPosts(posts.map(p =>
        p.id === postId
          ? {
            ...p,
            user_has_liked: !p.user_has_liked,
            likes_count: p.user_has_liked ? p.likes_count - 1 : p.likes_count + 1
          }
          : p
      ));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleSave = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      if (post.user_has_saved) {
        // Unsave
        await supabase
          .from('community_saved_posts')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);
      } else {
        // Save
        await supabase
          .from('community_saved_posts')
          .insert({ post_id: postId, user_id: userId });
      }

      setPosts(posts.map(p =>
        p.id === postId ? { ...p, user_has_saved: !p.user_has_saved } : p
      ));
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  const handleReport = async (postId: string) => {
    const reason = prompt('Please select a reason:\n1. Spam\n2. Harassment\n3. Inappropriate\n4. Misinformation\n5. Other');
    if (!reason) return;

    const reasonMap: Record<string, string> = {
      '1': 'spam',
      '2': 'harassment',
      '3': 'inappropriate',
      '4': 'misinformation',
      '5': 'other'
    };

    const description = prompt('Please provide additional details (optional):');

    try {
      await supabase
        .from('community_post_reports')
        .insert({
          post_id: postId,
          reported_by: userId,
          reason: reasonMap[reason] || 'other',
          description: description || null
        });

      alert('Report submitted. Our moderators will review it shortly.');
    } catch (error) {
      console.error('Error reporting post:', error);
      alert('Failed to submit report. Please try again.');
    }
  };

  const handlePinPost = async (postId: string, isPinned: boolean) => {
    try {
      await supabase
        .from('community_posts')
        .update({
          is_pinned: !isPinned,
          pinned_by: !isPinned ? userId : null,
          pinned_at: !isPinned ? new Date().toISOString() : null
        })
        .eq('id', postId);

      fetchPosts();
    } catch (error) {
      console.error('Error pinning post:', error);
    }
  };

  const handleLockPost = async (postId: string, isLocked: boolean) => {
    try {
      await supabase
        .from('community_posts')
        .update({
          is_locked: !isLocked,
          locked_by: !isLocked ? userId : null,
          locked_at: !isLocked ? new Date().toISOString() : null
        })
        .eq('id', postId);

      fetchPosts();
    } catch (error) {
      console.error('Error locking post:', error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await supabase
        .from('community_posts')
        .update({
          is_deleted: true,
          deleted_by: userId,
          deleted_at: new Date().toISOString()
        })
        .eq('id', postId);

      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const fetchComments = async (postId: string) => {
    if (comments[postId]) {
      setExpandedPost(expandedPost === postId ? null : postId);
      return;
    }

    try {
      setLoadingComments({ ...loadingComments, [postId]: true });

      const { data, error } = await supabase
        .from('community_comments')
        .select(`
          *,
          author:users!community_comments_author_id_fkey(id, full_name, avatar_url, role)
        `)
        .eq('post_id', postId)
        .eq('is_deleted', false)
        .order('is_best_answer', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Check if user has liked each comment
      const commentsWithUserData = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: liked } = await supabase
            .from('community_comment_likes')
            .select('id')
            .eq('comment_id', comment.id)
            .eq('user_id', userId)
            .single();

          return {
            ...comment,
            user_has_liked: !!liked
          };
        })
      );

      setComments({ ...comments, [postId]: commentsWithUserData });
      setExpandedPost(postId);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoadingComments({ ...loadingComments, [postId]: false });
    }
  };

  const handleAddComment = async (postId: string) => {
    const content = newComment[postId]?.trim();
    if (!content) return;

    try {
      const { error } = await supabase
        .from('community_comments')
        .insert({
          post_id: postId,
          author_id: userId,
          content
        });

      if (error) throw error;

      setNewComment({ ...newComment, [postId]: '' });
      // Refresh comments
      const updatedComments = { ...comments };
      delete updatedComments[postId];
      setComments(updatedComments);
      fetchComments(postId);
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    }
  };

  const handleMarkBestAnswer = async (commentId: string, postId: string) => {
    try {
      // Update comment as best answer
      await supabase
        .from('community_comments')
        .update({
          is_best_answer: true,
          marked_as_best_by: userId,
          marked_as_best_at: new Date().toISOString()
        })
        .eq('id', commentId);

      // Update post as answered
      await supabase
        .from('community_posts')
        .update({ is_answered: true })
        .eq('id', postId);

      // Refresh
      fetchPosts();
      const updatedComments = { ...comments };
      delete updatedComments[postId];
      setComments(updatedComments);
      fetchComments(postId);
    } catch (error) {
      console.error('Error marking best answer:', error);
    }
  };

  const getPostIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return <Megaphone className="w-5 h-5" />;
      case 'question':
        return <HelpCircle className="w-5 h-5" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setFilter('all')}
          className={`px-6 py-3 font-semibold transition-colors ${filter === 'all'
            ? 'text-indigo-600 border-b-2 border-indigo-600'
            : 'text-slate-600 hover:text-slate-900'
            }`}
        >
          All Posts
        </button>
        <button
          onClick={() => setFilter('questions')}
          className={`px-6 py-3 font-semibold transition-colors ${filter === 'questions'
            ? 'text-indigo-600 border-b-2 border-indigo-600'
            : 'text-slate-600 hover:text-slate-900'
            }`}
        >
          Questions
        </button>
        <button
          onClick={() => setFilter('announcements')}
          className={`px-6 py-3 font-semibold transition-colors ${filter === 'announcements'
            ? 'text-indigo-600 border-b-2 border-indigo-600'
            : 'text-slate-600 hover:text-slate-900'
            }`}
        >
          Announcements
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search posts..."
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Posts List */}
      {posts.filter(post => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          post.title?.toLowerCase().includes(query) ||
          post.content.toLowerCase().includes(query) ||
          post.author?.full_name?.toLowerCase().includes(query)
        );
      }).length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-10 h-10 text-indigo-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            {searchQuery ? 'No posts found' : 'No posts yet'}
          </h3>
          <p className="text-slate-600">
            {searchQuery ? 'Try different search terms' : 'Be the first to start a discussion!'}
          </p>
        </div>
      ) : (
        posts.filter(post => {
          if (!searchQuery) return true;
          const query = searchQuery.toLowerCase();
          return (
            post.title?.toLowerCase().includes(query) ||
            post.content.toLowerCase().includes(query) ||
            post.author?.full_name?.toLowerCase().includes(query)
          );
        }).map((post) => (
          <div
            key={post.id}
            className={`bg-white rounded-2xl p-6 border-2 transition-all ${post.is_pinned
              ? 'border-indigo-200 bg-indigo-50/30'
              : 'border-slate-200 hover:border-slate-300'
              }`}
          >
            {/* Post Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                  {post.author.avatar_url ? (
                    <img
                      src={post.author.avatar_url}
                      alt={post.author.full_name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    post.author.full_name.charAt(0)
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{post.author.full_name}</span>
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded-full ${post.author.role === 'mentor'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                        }`}
                    >
                      {post.author.role}
                    </span>
                    {post.type !== 'normal' && (
                      <span
                        className={`flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${post.type === 'announcement'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-green-100 text-green-700'
                          }`}
                      >
                        {getPostIcon(post.type)}
                        {post.type}
                      </span>
                    )}
                    {post.is_answered && post.type === 'question' && (
                      <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3" />
                        Answered
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </span>
                    {post.updated_at && post.updated_at !== post.created_at && (
                      <span className="text-xs text-slate-400">(edited)</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Post Actions Menu */}
              <div className="flex items-center gap-2">
                {post.is_pinned && (
                  <Pin className="w-5 h-5 text-indigo-600" />
                )}
                {post.is_locked && (
                  <Lock className="w-5 h-5 text-slate-600" />
                )}
                {(isMentor || post.author_id === userId) && (
                  <div className="relative group">
                    <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                      <MoreVertical className="w-5 h-5 text-slate-600" />
                    </button>
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2 hidden group-hover:block z-10">
                      {post.author_id === userId && (
                        <button
                          onClick={() => setEditingPost(post)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit Post
                        </button>
                      )}
                      {isMentor && (
                        <>
                          <button
                            onClick={() => handlePinPost(post.id, post.is_pinned)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Pin className="w-4 h-4" />
                            {post.is_pinned ? 'Unpin' : 'Pin'} Post
                          </button>
                          <button
                            onClick={() => handleLockPost(post.id, post.is_locked)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Lock className="w-4 h-4" />
                            {post.is_locked ? 'Unlock' : 'Lock'} Comments
                          </button>
                        </>
                      )}
                      {(isMentor || post.author_id === userId) && (
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Post
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Post Content */}
            <div className="mb-4">
              {post.title && (
                <h3 className="text-xl font-bold text-slate-900 mb-2">{post.title}</h3>
              )}
              <p className="text-slate-700 whitespace-pre-wrap">{post.content}</p>

              {/* Poll Display */}
              {post.type === 'poll' && (
                <div className="mt-4">
                  <PollComponent postId={post.id} communityId={communityId} userId={userId} />
                </div>
              )}

              {/* Images */}
              {post.images && post.images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {post.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Post image ${idx + 1}`}
                      className="rounded-lg w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(img, '_blank')}
                    />
                  ))}
                </div>
              )}

              {/* File Attachments */}
              {post.files && Array.isArray(post.files) && post.files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {post.files.map((file: any, idx: number) => (
                    <a
                      key={idx}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Paperclip className="w-4 h-4 text-slate-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                        <p className="text-xs text-slate-500">{((file.size || 0) / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <Download className="w-4 h-4 text-slate-500" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Post Stats & Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${post.user_has_liked
                    ? 'bg-red-50 text-red-600'
                    : 'hover:bg-slate-100 text-slate-600'
                    }`}
                >
                  <Heart className={`w-5 h-5 ${post.user_has_liked ? 'fill-current' : ''}`} />
                  <span className="font-semibold">{post.likes_count}</span>
                </button>

                <button
                  onClick={() => fetchComments(post.id)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-semibold">{post.comments_count}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSave(post.id)}
                  className={`p-2 rounded-lg transition-colors ${post.user_has_saved
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'hover:bg-slate-100 text-slate-600'
                    }`}
                >
                  <Bookmark className={`w-5 h-5 ${post.user_has_saved ? 'fill-current' : ''}`} />
                </button>

                <button
                  onClick={() => handleReport(post.id)}
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                >
                  <Flag className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Comments Section */}
            {expandedPost === post.id && (
              <div className="mt-6 pt-6 border-t border-slate-200 space-y-4">
                {loadingComments[post.id] ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : (
                  <>
                    {/* Comments List */}
                    {comments[post.id]?.map((comment) => (
                      <div
                        key={comment.id}
                        className={`flex gap-3 p-4 rounded-lg ${comment.is_best_answer
                          ? 'bg-green-50 border-2 border-green-200'
                          : 'bg-slate-50'
                          }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                          {comment.author.avatar_url ? (
                            <img
                              src={comment.author.avatar_url}
                              alt={comment.author.full_name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            comment.author.full_name.charAt(0)
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-slate-900">
                              {comment.author.full_name}
                            </span>
                            <span
                              className={`px-2 py-0.5 text-xs font-semibold rounded-full ${comment.author.role === 'mentor'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                                }`}
                            >
                              {comment.author.role}
                            </span>
                            {comment.is_best_answer && (
                              <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                                <CheckCircle className="w-3 h-3" />
                                Best Answer
                              </span>
                            )}
                            <span className="text-xs text-slate-500">
                              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-slate-700 mb-2">{comment.content}</p>
                          <div className="flex items-center gap-3">
                            <button
                              className={`flex items-center gap-1 text-sm ${comment.user_has_liked
                                ? 'text-red-600'
                                : 'text-slate-500 hover:text-red-600'
                                }`}
                            >
                              <Heart className={`w-4 h-4 ${comment.user_has_liked ? 'fill-current' : ''}`} />
                              <span>{comment.likes_count}</span>
                            </button>
                            {isMentor && post.type === 'question' && !post.is_answered && !comment.is_best_answer && (
                              <button
                                onClick={() => handleMarkBestAnswer(comment.id, post.id)}
                                className="text-sm text-green-600 hover:text-green-700 font-medium"
                              >
                                Mark as Best Answer
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Add Comment */}
                    {!post.is_locked && (
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                          You
                        </div>
                        <div className="flex-1 flex gap-2">
                          <input
                            type="text"
                            value={newComment[post.id] || ''}
                            onChange={(e) =>
                              setNewComment({ ...newComment, [post.id]: e.target.value })
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAddComment(post.id);
                              }
                            }}
                            placeholder="Write a comment..."
                            className="flex-1 px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                          <button
                            onClick={() => handleAddComment(post.id)}
                            disabled={!newComment[post.id]?.trim()}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ))
      )}

      {/* Edit Post Modal */}
      {editingPost && (
        <EditPostModal
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onSuccess={() => {
            setEditingPost(null);
            fetchPosts();
          }}
        />
      )}
    </div>
  );
}
