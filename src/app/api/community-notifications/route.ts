import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, recipientId, senderId, communityId, postId, commentId, content } = await request.json();

    if (!type || !recipientId || !senderId || !communityId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create notification
    const { data: notification, error } = await supabase
      .from("community_notifications")
      .insert({
        type,
        recipient_id: recipientId,
        sender_id: senderId,
        community_id: communityId,
        post_id: postId,
        comment_id: commentId,
        content: content || "",
        read: false,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ notification });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    let query = supabase
      .from("community_notifications")
      .select(
        `
        id,
        type,
        content,
        read,
        created_at,
        sender:sender_id (
          id,
          full_name,
          avatar_url
        ),
        community:community_id (
          id,
          name
        ),
        post:post_id (
          id,
          title
        ),
        comment:comment_id (
          id,
          content
        )
      `
      )
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false });

    if (unreadOnly) {
      query = query.eq("read", false);
    }

    const { data: notifications, error } = await query;

    if (error) throw error;

    return NextResponse.json({ notifications: notifications || [] });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notificationId, read } = await request.json();

    if (!notificationId) {
      return NextResponse.json(
        { error: "Notification ID required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("community_notifications")
      .update({ read })
      .eq("id", notificationId)
      .eq("recipient_id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}
