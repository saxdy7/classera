import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    console.log('[AI Chat] Request received');

    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Deduct tokens
        const { data: deduction, error: deductError } = await supabase.rpc('deduct_ai_tokens', {
            p_user_id: user.id,
            p_amount: 1
        });

        const status = Array.isArray(deduction) ? deduction[0] : deduction;
        if (deductError || !status || !status.success) {
            return new Response(JSON.stringify({ error: status?.message || 'Insufficient credits. Please Top Up.' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!process.env.GROQ_API_KEY) {
            return NextResponse.json({ error: 'GROQ_API_KEY missing' }, { status: 500 });
        }

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const body = await req.json();
        const messages = body.messages || (body.message ? [{ role: 'user', content: body.message }] : []);
        const systemPromptFromClient = body.systemPrompt;

        if (!messages.length) return NextResponse.json({ error: 'No messages' }, { status: 400 });

        // Fetch Stats and actual Mentor Names for better RAG
        const [mentors, students, universities] = await Promise.all([
            supabase.from('users').select('full_name').eq('role', 'mentor').limit(10),
            supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student'),
            supabase.from('universities').select('*', { count: 'exact', head: true })
        ]);

        const mentorNames = (mentors.data ?? []).map(m => m.full_name).join(', ');

        const platformContext = `
[CLASSERA PLATFORM LIVE DATA]:
- Total Mentors: ${mentors.data?.length || 0}
- Total Students Enrolled: ${students.count || 0}
- Partnered Universities: ${universities.count || 0}
- Current User: ${user.user_metadata?.full_name || 'Student'}
`;

        const finalSystemPrompt = `${systemPromptFromClient || 'You are Classera AI, your mission is to help students achieve their goals intelligently.'}

You are an advanced Agentic AI. Your identity is **Classera AI** - the smart learning assistant.

IMPORTANT: When users ask to CREATE content (roadmaps, courses, guides), return STRUCTURED DATA in these formats:

For ROADMAP requests:
[ROADMAP: {
  "goal": "The learning goal",
  "description": "2-3 sentence overview",
  "steps": ["Step 1", "Step 2", "Step 3"],
  "recommended_courses": ["Course 1", "Course 2"],
  "recommended_mentor": "Mentor Name",
  "action_item": "What to do next"
}]

For COURSE requests:
[COURSE: {
  "title": "Course Title",
  "description": "What you'll learn",
  "modules": ["Module 1", "Module 2"],
  "difficulty": "beginner/intermediate/advanced",
  "duration_hours": 20,
  "action_item": "Next step"
}]

For GUIDE requests:
[GUIDE: {
  "title": "Study Guide Title",
  "topics": ["Topic 1", "Topic 2"],
  "key_concepts": ["Concept 1", "Concept 2"],
  "resources": ["Resource 1", "Resource 2"],
  "action_item": "Next step"
}]

[CLASSERA PLATFORM LIVE DATA]:
${platformContext}

[MENTORS AVAILABLE]:
${mentorNames || 'Our expert mentors are ready to assist'}

When users ask creation questions, ALWAYS output using the [FORMAT: {...}] structure.
When users ask general questions, answer naturally and helpfully.`;


        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: finalSystemPrompt },
                ...messages.map((m: any) => ({ role: m.role, content: m.content }))
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.5,
            max_tokens: 1024,
            stream: true,
        });

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of completion) {
                        const content = chunk.choices[0]?.delta?.content || '';
                        if (content) controller.enqueue(encoder.encode(content));
                    }
                } catch (err) {
                    console.error('[AI Chat] Stream Chunk Error:', err);
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });

    } catch (error: any) {
        console.error('AI Chat Global Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
