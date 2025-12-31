import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const messageId = formData.get('messageId') as string;

        if (!file || !messageId) {
            return NextResponse.json({ error: 'File and message ID required' }, { status: 400 });
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: 'File size limit exceeded (10MB)' }, { status: 400 });
        }

        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${messageId}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
            .from('community-uploads')
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('community-uploads')
            .getPublicUrl(fileName);

        // Save metadata to database
        const { data: attachment, error: dbError } = await supabase
            .from('message_attachments')
            .insert({
                message_id: messageId,
                file_name: file.name,
                file_url: publicUrl,
                file_type: file.type,
                file_size: file.size
            })
            .select()
            .single();

        if (dbError) throw dbError;

        return NextResponse.json({ success: true, attachment });
    } catch (error: any) {
        console.error('Error uploading file:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
