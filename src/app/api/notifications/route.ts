import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: Fetch all notifications for current user
export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const unreadOnly = searchParams.get('unreadOnly') === 'true';
        const limit = parseInt(searchParams.get('limit') || '50');

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let query = supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (unreadOnly) {
            query = query.eq('read', false);
        }

        const { data: notifications, error } = await query;

        if (error) {
            console.error('Error fetching notifications:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ notifications: notifications || [] });
    } catch (error) {
        console.error('Error in GET /api/notifications:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: Create a new notification
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const body = await request.json();
        const { userId, type, title, message, relatedId, relatedType, actionUrl, metadata } = body;

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Validate required fields
        if (!userId || !type || !title || !message) {
            return NextResponse.json(
                { error: 'userId, type, title, and message are required' },
                { status: 400 }
            );
        }

        // Create notification using the helper function
        const { data, error } = await supabase.rpc('create_notification', {
            p_user_id: userId,
            p_type: type,
            p_title: title,
            p_message: message,
            p_related_id: relatedId || null,
            p_related_type: relatedType || null,
            p_action_url: actionUrl || null,
            p_metadata: metadata || {},
        });

        if (error) {
            console.error('Error creating notification:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ notificationId: data });
    } catch (error) {
        console.error('Error in POST /api/notifications:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH: Mark notification(s) as read
export async function PATCH(request: Request) {
    try {
        const supabase = await createClient();
        const body = await request.json();
        const { notificationId, markAllAsRead } = body;

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (markAllAsRead) {
            // Mark all notifications as read
            const { data, error } = await supabase.rpc('mark_all_notifications_read');

            if (error) {
                console.error('Error marking all notifications as read:', error);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({ success: true, count: data });
        } else if (notificationId) {
            // Mark single notification as read
            const { data, error } = await supabase.rpc('mark_notification_read', {
                p_notification_id: notificationId,
            });

            if (error) {
                console.error('Error marking notification as read:', error);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({ success: data });
        } else {
            return NextResponse.json(
                { error: 'notificationId or markAllAsRead is required' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Error in PATCH /api/notifications:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE: Delete a notification
export async function DELETE(request: Request) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const notificationId = searchParams.get('id');

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!notificationId) {
            return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId)
            .eq('user_id', user.id);

        if (error) {
            console.error('Error deleting notification:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in DELETE /api/notifications:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
