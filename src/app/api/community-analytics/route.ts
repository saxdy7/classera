import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get("communityId");

    if (!communityId) {
      return NextResponse.json({ error: "Community ID required" }, { status: 400 });
    }

    // Verify mentor owns this community
    const { data: community } = await supabase
      .from("communities")
      .select("mentor_id")
      .eq("id", communityId)
      .single();

    if (!community || community.mentor_id !== user.id) {
      return NextResponse.json(
        { error: "You don't have permission to view analytics" },
        { status: 403 }
      );
    }

    // Get activity data for last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch posts
    const { data: posts } = await supabase
      .from("community_posts")
      .select("created_at")
      .eq("community_id", communityId)
      .gte("created_at", thirtyDaysAgo)
      .order("created_at");

    // Fetch comments
    const { data: comments } = await supabase
      .from("community_comments")
      .select("created_at")
      .eq("community_id", communityId)
      .gte("created_at", thirtyDaysAgo)
      .order("created_at");

    // Fetch likes
    const { data: likes } = await supabase
      .from("community_post_likes")
      .select("created_at")
      .eq("community_id", communityId)
      .gte("created_at", thirtyDaysAgo)
      .order("created_at");

    // Group by date
    const activityByDate: Record<string, { posts: number; comments: number; likes: number }> = {};

    // Initialize all dates in last 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split("T")[0];
      activityByDate[dateKey] = { posts: 0, comments: 0, likes: 0 };
    }

    // Count posts by date
    posts?.forEach((post) => {
      const dateKey = new Date(post.created_at).toISOString().split("T")[0];
      if (activityByDate[dateKey]) {
        activityByDate[dateKey].posts++;
      }
    });

    // Count comments by date
    comments?.forEach((comment) => {
      const dateKey = new Date(comment.created_at).toISOString().split("T")[0];
      if (activityByDate[dateKey]) {
        activityByDate[dateKey].comments++;
      }
    });

    // Count likes by date
    likes?.forEach((like) => {
      const dateKey = new Date(like.created_at).toISOString().split("T")[0];
      if (activityByDate[dateKey]) {
        activityByDate[dateKey].likes++;
      }
    });

    // Convert to array and sort by date
    const activityData = Object.entries(activityByDate)
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        ...data,
      }))
      .reverse();

    return NextResponse.json({ activityData });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
