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
  BarChart3,
  Plus
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
  /** Filter controlled by parent (e.g. CommunitySidebar). When provided the internal tabs are hidden. */
  activeFilter?: string;
  onStartDiscussion?: () => void;
}

export function CommunityFeed({ communityId, userId, userRole, isMentor, activeFilter, onStartDiscussion }: CommunityFeedProps) {
  const supabase = createClient();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>(activeFilter ?? 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  // Sync filter when parent (CommunitySidebar) changes it
  useEffect(() => {
    if (activeFilter !== undefined) setFilter(activeFilter);
  }, [activeFilter]);

  useEffect(() => {
    fetchPosts();
    return subscribeToChanges();
  }, [filter]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/community-posts?communityId=${communityId}&filter=${filter}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('❌ Community posts API error:', {
          status: res.status,
          statusText: res.statusText,
          error: errorData.error,
          communityId,
          filter
        });
        throw new Error(`API request failed: ${res.status} ${res.statusText} - ${errorData.error || 'Unknown error'}`);
      }
      const { posts: fetchedPosts } = await res.json();

      // For user tracking (likes/saves), we still use the client client for now to avoid session overhead on the API
      // Or we can just trust the API if it's enhanced later.
      const postsWithUserData = await Promise.all(
        (fetchedPosts || []).map(async (post: Post) => {
          const [likedResult, savedResult] = await Promise.all([
            supabase.from('community_post_likes').select('id').eq('post_id', post.id).eq('user_id', userId).maybeSingle(),
            supabase.from('community_saved_posts').select('id').eq('post_id', post.id).eq('user_id', userId).maybeSingle()
          ]);

          return {
            ...post,
            user_has_liked: !!likedResult.data,
            user_has_saved: !!savedResult.data
          };
        })
      );

      setPosts(postsWithUserData);
    } catch (error) {
      console.error('❌ Error fetching posts:', {
        error: error instanceof Error ? error.message : String(error),
        communityId,
        filter,
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      setPosts([]); // Reset to empty on error
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
      const res = await fetch(`/api/community-comments?postId=${postId}`);
      if (!res.ok) throw new Error('Failed to fetch comments');
      const { comments: fetchedComments } = await res.json();

      const commentsWithUserData = await Promise.all(
        (fetchedComments || []).map(async (comment: Comment) => {
          const { data: liked } = await supabase
            .from('community_comment_likes')
            .select('id')
            .eq('comment_id', comment.id)
            .eq('user_id', userId)
            .maybeSingle();

          return { ...comment, user_has_liked: !!liked };
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
      {/* Filter Tabs — hidden when CommunitySidebar controls the filter */}
      {activeFilter === undefined && (
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
      )}

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

      {/* Empty State / Posts List */}
      {(() => {
        const filteredPosts = (filter === 'saved' ? posts.filter(p => p.user_has_saved) : posts).filter(post => {
          if (!searchQuery) return true;
          const query = searchQuery.toLowerCase();
          return (
            post.title?.toLowerCase().includes(query) ||
            post.content.toLowerCase().includes(query) ||
            post.author?.full_name?.toLowerCase().includes(query)
          );
        });

        if (filteredPosts.length === 0) {
          return (
            <div className="bg-white rounded-[2.5rem] p-20 border-2 border-dashed border-slate-100 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-indigo-600 mb-8 shadow-inner group">
                <MessageCircle className="w-12 h-12 group-hover:scale-110 transition-transform" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight uppercase">
                {searchQuery ? 'Nothing Found' : filter === 'saved' ? 'No Saved Posts' : 'No Discussions Yet'}
              </h2>
              <p className="text-slate-500 text-lg max-w-md mx-auto font-medium leading-relaxed mb-10">
                {searchQuery
                  ? 'Try broadening your search terms to find what you need.'
                  : filter === 'saved'
                    ? 'You haven\'t saved any posts to your library yet.'
                    : 'Be the first to share your journey, ask a tough question, or just say hello to your fellow learners!'}
              </p>
              {!searchQuery && filter !== 'saved' && (
                <button
                  onClick={onStartDiscussion}
                  className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all active:scale-95 flex items-center gap-3"
                >
                  <Plus size={20} />
                  Start the conversation
                </button>
              )}
            </div>
          );
        }

        return filteredPosts.map((post) => (
          <div
            key={post.id}
            className={`bg-white rounded-[2rem] p-8 border-2 transition-all group ${post.is_pinned
              ? 'border-indigo-100 bg-indigo-50/30'
              : 'border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5'
              }`}
          >
            {/* Post Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                  {post.author?.avatar_url ? (
                    <img
                      src={post.author.avatar_url}
                      alt={post.author?.full_name || ''}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    (post.author?.full_name || '?').charAt(0)
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-800 tracking-tight">{post.author?.full_name || 'Unknown'}</span>
                    <span
                      className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-xl ${post.author?.role === 'mentor'
                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                        : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                        }`}
                    >
                      {post.author?.role}
                    </span>
                    {post.type !== 'normal' && (
                      <span
                        className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-xl ${post.type === 'announcement'
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'bg-green-100 text-green-700 border border-green-200'
                          }`}
                      >
                        {getPostIcon(post.type)}
                        {post.type}
                      </span>
                    )}
                    {post.is_answered && post.type === 'question' && (
                      <span className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Resolved
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
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
                   <div className="px-3 py-1 bg-indigo-600 text-white rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20">
                      <Pin className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Featured</span>
                   </div>
                )}
                {post.is_locked && (
                   <div className="px-3 py-1 bg-slate-100 text-slate-500 rounded-xl flex items-center gap-2 border border-slate-200">
                      <Lock className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Closed</span>
                   </div>
                )}
                {(isMentor || post.author_id === userId) && (
                  <div className="relative group">
                    <button className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all border border-slate-200">
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
            <div className="mb-6 mt-4">
              {post.title && (
                <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors cursor-pointer">{post.title}</h3>
              )}
              <p className="text-slate-600 text-lg leading-relaxed whitespace-pre-wrap font-medium">{post.content}</p>

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
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl transition-all active:scale-95 ${post.user_has_liked
                    ? 'bg-red-50 text-red-600 border border-red-100 shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100'
                    }`}
                >
                  <Heart className={`w-5 h-5 ${post.user_has_liked ? 'fill-current' : ''}`} />
                  <span className="font-black text-sm">{post.likes_count}</span>
                </button>

                <button
                  onClick={() => fetchComments(post.id)}
                  className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100 transition-all active:scale-95"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-black text-sm">{post.comments_count}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden sm:flex -space-x-3 mr-4 overflow-hidden py-1">
                   {[1,2,3,4].map(i => (
                     <div key={i} className={`inline-block h-8 w-8 rounded-full ring-4 ring-white bg-slate-${i*100 + 100} border border-slate-200`} />
                   ))}
                   <div className="flex items-center justify-center h-8 w-8 rounded-full ring-4 ring-white bg-indigo-50 text-[10px] font-black text-indigo-600 border border-indigo-100">+24</div>
                </div>
                <button
                  onClick={() => handleSave(post.id)}
                  className={`p-3.5 rounded-2xl transition-all active:scale-95 ${post.user_has_saved
                    ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-400 border border-slate-100'
                    }`}
                >
                  <Bookmark className={`w-5 h-5 ${post.user_has_saved ? 'fill-current' : ''}`} />
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
                        className={`flex gap-4 p-5 rounded-3xl transition-all ${comment.is_best_answer
                          ? 'bg-emerald-50 border-2 border-emerald-200 shadow-sm'
                          : 'bg-slate-50 border border-slate-100'
                          }`}
                      >
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black flex-shrink-0 shadow-lg shadow-indigo-500/10">
                          {comment.author?.avatar_url ? (
                            <img
                              src={comment.author.avatar_url}
                              alt={comment.author?.full_name || ''}
                              className="w-full h-full rounded-2xl object-cover"
                            />
                          ) : (
                            (comment.author?.full_name || '?').charAt(0)
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="font-black text-slate-800 tracking-tight">
                              {comment.author?.full_name || 'Unknown'}
                            </span>
                            <span
                              className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-xl ${comment.author?.role === 'mentor'
                                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                }`}
                            >
                              {comment.author?.role}
                            </span>
                            {comment.is_best_answer && (
                              <span className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Solution
                              </span>
                            )}
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
                              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-slate-600 font-medium mb-3 leading-relaxed">{comment.content}</p>
                          <div className="flex items-center gap-3">
                            <button
                              className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-widest transition-colors ${comment.user_has_liked
                                ? 'text-red-500'
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
      })()}

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
