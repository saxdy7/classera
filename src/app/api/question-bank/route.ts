import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const subject = searchParams.get('subject');
    const topic = searchParams.get('topic');
    const difficulty = searchParams.get('difficulty');
    const tags = searchParams.get('tags')?.split(',');
    const search = searchParams.get('search');

    let query = supabase
      .from('question_bank')
      .select('*')
      .eq('mentor_id', user.id)
      .order('created_at', { ascending: false });

    if (type) query = query.eq('question_type', type);
    if (subject) query = query.eq('subject', subject);
    if (topic) query = query.eq('topic', topic);
    if (difficulty) query = query.eq('difficulty', difficulty);
    if (tags && tags.length > 0) query = query.contains('tags', tags);
    if (search) query = query.ilike('question_text', `%${search}%`);

    const { data: questions, error } = await query;

    if (error) {
      console.error('Error fetching questions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch questions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error in question bank API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a mentor
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'mentor') {
      return NextResponse.json(
        { error: 'Only mentors can create questions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      question_text,
      question_type,
      subject,
      topic,
      difficulty,
      options,
      correct_answer,
      code_template,
      test_cases,
      marks,
      tags,
    } = body;

    const { data: question, error } = await supabase
      .from('question_bank')
      .insert({
        mentor_id: user.id,
        question_text,
        question_type,
        subject,
        topic,
        difficulty,
        options,
        correct_answer,
        code_template,
        test_cases,
        marks: marks || 1,
        tags: tags || [],
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating question:', error);
      return NextResponse.json(
        { error: 'Failed to create question' },
        { status: 500 }
      );
    }

    return NextResponse.json({ question });
  } catch (error) {
    console.error('Error in question bank API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    const { data: question, error } = await supabase
      .from('question_bank')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('mentor_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating question:', error);
      return NextResponse.json(
        { error: 'Failed to update question' },
        { status: 500 }
      );
    }

    return NextResponse.json({ question });
  } catch (error) {
    console.error('Error in question bank API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Question ID required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('question_bank')
      .delete()
      .eq('id', id)
      .eq('mentor_id', user.id);

    if (error) {
      console.error('Error deleting question:', error);
      return NextResponse.json(
        { error: 'Failed to delete question' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in question bank API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
