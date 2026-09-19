import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  BarChart3,
  Users,
  MessageSquare,
  ThumbsUp,
  TrendingUp,
  Award,
  Calendar,
  Eye,
} from "lucide-react";
import { AnalyticsCharts } from "@/components/communities/AnalyticsCharts";

export default async function CommunityAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: communityId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  // Verify mentor owns this community
  const { data: community } = await supabase
    .from("communities")
    .select("name, description, created_at, mentor_id")
    .eq("id", communityId)
    .single();

  if (!community || community.mentor_id !== user.id) {
    redirect("/dashboard/mentor");
  }

  // Get member count
  const { count: memberCount } = await supabase
    .from("community_members")
    .select("*", { count: "exact", head: true })
    .eq("community_id", communityId)
    .eq("status", "approved");

  // Get total posts
  const { count: postCount } = await supabase
    .from("community_posts")
    .select("*", { count: "exact", head: true })
    .eq("community_id", communityId);

  // Get total comments
  const { count: commentCount } = await supabase
    .from("community_comments")
    .select("*", { count: "exact", head: true })
    .eq("community_id", communityId);

  // Get total likes
  const { count: likeCount } = await supabase
    .from("community_post_likes")
    .select("*", { count: "exact", head: true })
    .eq("community_id", communityId);

  // Get engagement rate (posts + comments per member)
  const engagementRate =
    memberCount && memberCount > 0
      ? (((postCount || 0) + (commentCount || 0)) / memberCount).toFixed(2)
      : "0.00";

  // Get top contributors
  const { data: topContributors } = await supabase
    .from("community_posts")
    .select(
      `
      author_id,
      author:author_id (
        id,
        full_name,
        avatar_url
      )
    `
    )
    .eq("community_id", communityId)
    .order("created_at", { ascending: false });

  // Count posts per author
  const authorStats: Record<
    string,
    { author: any; postCount: number; commentCount: number; likeCount: number }
  > = {};

  if (topContributors) {
    for (const post of topContributors) {
      if (!post.author_id) continue;

      if (!authorStats[post.author_id]) {
        authorStats[post.author_id] = {
          author: post.author,
          postCount: 0,
          commentCount: 0,
          likeCount: 0,
        };
      }
      authorStats[post.author_id].postCount++;
    }
  }

  // Get comment counts for top contributors
  const { data: commentData } = await supabase
    .from("community_comments")
    .select("author_id")
    .eq("community_id", communityId);

  if (commentData) {
    for (const comment of commentData) {
      if (!comment.author_id) continue;
      if (authorStats[comment.author_id]) {
        authorStats[comment.author_id].commentCount++;
      }
    }
  }

  // Get like counts for top contributors
  const { data: likeData } = await supabase
    .from("community_post_likes")
    .select("post_id, community_posts!inner(author_id)")
    .eq("community_id", communityId);

  if (likeData) {
    for (const like of likeData) {
      const authorId = like.community_posts?.[0]?.author_id;
      if (!authorId) continue;
      if (authorStats[authorId]) {
        authorStats[authorId].likeCount++;
      }
    }
  }

  // Sort by total activity
  const sortedContributors = Object.values(authorStats)
    .map((stat) => ({
      ...stat,
      totalActivity: stat.postCount + stat.commentCount + stat.likeCount,
    }))
    .sort((a, b) => b.totalActivity - a.totalActivity)
    .slice(0, 5);

  // Get most popular posts
  const { data: popularPosts } = await supabase
    .from("community_posts")
    .select(
      `
      id,
      title,
      content,
      created_at,
      author:author_id (
        full_name,
        avatar_url
      ),
      likes:community_post_likes(count),
      comments:community_comments(count)
    `
    )
    .eq("community_id", communityId)
    .order("created_at", { ascending: false })
    .limit(50);

  // Sort by engagement (likes + comments)
  const sortedPosts = (popularPosts || [])
    .map((post) => ({
      ...post,
      engagement: (post.likes?.[0]?.count || 0) + (post.comments?.[0]?.count || 0),
    }))
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 5);

  // Calculate growth metrics (last 7 days vs previous 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const { count: recentPosts } = await supabase
    .from("community_posts")
    .select("*", { count: "exact", head: true })
    .eq("community_id", communityId)
    .gte("created_at", sevenDaysAgo);

  const { count: previousPosts } = await supabase
    .from("community_posts")
    .select("*", { count: "exact", head: true })
    .eq("community_id", communityId)
    .gte("created_at", fourteenDaysAgo)
    .lt("created_at", sevenDaysAgo);

  const postGrowth =
    previousPosts && previousPosts > 0
      ? (((recentPosts || 0) - previousPosts) / previousPosts) * 100
      : recentPosts && recentPosts > 0
        ? 100
        : 0;

  const { count: recentMembers } = await supabase
    .from("community_members")
    .select("*", { count: "exact", head: true })
    .eq("community_id", communityId)
    .eq("status", "approved")
    .gte("joined_at", sevenDaysAgo);

  const { count: previousMembers } = await supabase
    .from("community_members")
    .select("*", { count: "exact", head: true })
    .eq("community_id", communityId)
    .eq("status", "approved")
    .gte("joined_at", fourteenDaysAgo)
    .lt("joined_at", sevenDaysAgo);

  const memberGrowth =
    previousMembers && previousMembers > 0
      ? (((recentMembers || 0) - previousMembers) / previousMembers) * 100
      : recentMembers && recentMembers > 0
        ? 100
        : 0;

  return (
    <div className="min-h-screen py-8 bg-[var(--cl-canvas)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-[var(--cl-primary-soft)] rounded-[var(--cl-r-lg)]">
              <BarChart3 className="w-6 h-6 text-[var(--cl-primary)]" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-[var(--cl-ink)]">Analytics Dashboard</h1>
              <p className="text-[var(--cl-body)]">{community.name}</p>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border border-[var(--cl-hairline)]">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-[var(--cl-primary-soft)] rounded-[var(--cl-r-lg)]">
                <Users className="w-6 h-6 text-[var(--cl-primary)]" />
              </div>
              {memberGrowth !== 0 && (
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${memberGrowth > 0
                    ? "bg-[rgba(22,163,74,0.12)] text-[var(--cl-success)]"
                    : "bg-[rgba(239,68,68,0.12)] text-[var(--cl-error)]"
                    }`}
                >
                  <TrendingUp className="w-3 h-3" />
                  {memberGrowth > 0 ? "+" : ""}
                  {memberGrowth.toFixed(1)}%
                </div>
              )}
            </div>
            <div className="text-3xl font-semibold text-[var(--cl-ink)] mb-1">{memberCount || 0}</div>
            <div className="text-sm text-[var(--cl-body)]">Total Members</div>
          </div>

          <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border border-[var(--cl-hairline)]">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-[rgba(13,116,206,0.12)] rounded-[var(--cl-r-lg)]">
                <MessageSquare className="w-6 h-6 text-[var(--cl-info)]" />
              </div>
              {postGrowth !== 0 && (
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${postGrowth > 0 ? "bg-[rgba(22,163,74,0.12)] text-[var(--cl-success)]" : "bg-[rgba(239,68,68,0.12)] text-[var(--cl-error)]"
                    }`}
                >
                  <TrendingUp className="w-3 h-3" />
                  {postGrowth > 0 ? "+" : ""}
                  {postGrowth.toFixed(1)}%
                </div>
              )}
            </div>
            <div className="text-3xl font-semibold text-[var(--cl-ink)] mb-1">{postCount || 0}</div>
            <div className="text-sm text-[var(--cl-body)]">Total Posts</div>
          </div>

          <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border border-[var(--cl-hairline)]">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-[rgba(171,100,0,0.12)] rounded-[var(--cl-r-lg)]">
                <ThumbsUp className="w-6 h-6 text-[var(--cl-warning)]" />
              </div>
            </div>
            <div className="text-3xl font-semibold text-[var(--cl-ink)] mb-1">{likeCount || 0}</div>
            <div className="text-sm text-[var(--cl-body)]">Total Likes</div>
          </div>

          <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] p-6 border border-[var(--cl-hairline)]">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-[rgba(22,163,74,0.12)] rounded-[var(--cl-r-lg)]">
                <TrendingUp className="w-6 h-6 text-[var(--cl-success)]" />
              </div>
            </div>
            <div className="text-3xl font-semibold text-[var(--cl-ink)] mb-1">{engagementRate}</div>
            <div className="text-sm text-[var(--cl-body)]">Engagement Rate</div>
          </div>
        </div>

        {/* Charts */}
        <AnalyticsCharts communityId={communityId} />

        {/* Top Contributors */}
        <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] border border-[var(--cl-hairline)] mb-8">
          <div className="p-6 border-b border-[var(--cl-hairline)] flex items-center gap-3">
            <Award className="w-5 h-5 text-[var(--cl-warning)]" />
            <h2 className="text-xl font-semibold text-[var(--cl-ink)]">Top Contributors</h2>
          </div>
          <div className="divide-y divide-[var(--cl-hairline)]">
            {sortedContributors.length > 0 ? (
              sortedContributors.map((contributor, index) => (
                <div key={contributor.author?.id || index} className="p-6 flex items-center gap-4">
                  <div
                    className={`text-2xl font-semibold ${index === 0
                      ? "text-[var(--cl-warning)]"
                      : index === 1
                        ? "text-[var(--cl-muted-soft)]"
                        : index === 2
                          ? "text-[var(--cl-warning)]"
                          : "text-[var(--cl-muted-soft)]"
                      }`}
                  >
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-[var(--cl-ink)]">
                      {contributor.author?.full_name || "Unknown User"}
                    </div>
                    <div className="text-sm text-[var(--cl-body)]">
                      {contributor.postCount} posts • {contributor.commentCount} comments •{" "}
                      {contributor.likeCount} likes received
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-semibold text-[var(--cl-primary)]">
                      {contributor.totalActivity}
                    </div>
                    <div className="text-xs text-[var(--cl-body)]">Total Activity</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-[var(--cl-muted-soft)] mx-auto mb-3" />
                <p className="text-[var(--cl-body)]">No contributors yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Most Popular Posts */}
        <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] border border-[var(--cl-hairline)]">
          <div className="p-6 border-b border-[var(--cl-hairline)] flex items-center gap-3">
            <Eye className="w-5 h-5 text-[var(--cl-primary)]" />
            <h2 className="text-xl font-semibold text-[var(--cl-ink)]">Most Popular Posts</h2>
          </div>
          <div className="divide-y divide-[var(--cl-hairline)]">
            {sortedPosts.length > 0 ? (
              sortedPosts.map((post, index) => (
                <div key={post.id} className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="text-xl font-semibold text-[var(--cl-muted-soft)]">#{index + 1}</div>
                    <div className="flex-1">
                      {post.title && (
                        <h3 className="font-semibold text-[var(--cl-ink)] mb-1">{post.title}</h3>
                      )}
                      <p className="text-sm text-[var(--cl-body)] line-clamp-2 mb-2">{post.content}</p>
                      <div className="flex items-center gap-4 text-xs text-[var(--cl-muted)]">
                        <span>By {post.author?.[0]?.full_name || "Unknown"}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" />
                          {post.likes?.[0]?.count || 0}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {post.comments?.[0]?.count || 0}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-semibold text-[var(--cl-primary)]">{post.engagement}</div>
                      <div className="text-xs text-[var(--cl-body)]">Engagement</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <MessageSquare className="w-12 h-12 text-[var(--cl-muted-soft)] mx-auto mb-3" />
                <p className="text-[var(--cl-body)]">No posts yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
