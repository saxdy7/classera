import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { createClient } from '@/lib/supabase/server';

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

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

        const lastMessage = messages[messages.length - 1];
        const lastContent = lastContentString(lastMessage.content);
        
        // Stats
        const [mentors, students, universities] = await Promise.all([
            supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'mentor'),
            supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student'),
            supabase.from('universities').select('*', { count: 'exact', head: true })
        ]);

        const platformContext = `
[CLARIO PLATFORM LIVE STATS]:
- Mentors: ${mentors.count || 0}
- Students: ${students.count || 0}
- Institutions: ${universities.count || 0}
- Current User: ${user.user_metadata?.full_name || 'Student'}
`;

        const finalSystemPrompt = `${systemPromptFromClient || 'You are Clario, the world-class AI Career Copilot for students.'}

You are an advanced Agentic Al built on the Gemini Pro architecture, optimized for LPU (Language Processing Unit) inference. 

Your objective: Solve career confusion, increase platform awareness, and guide students with RAG-enhanced intelligence.

${platformContext}

[CAPABILITIES]:
1. Smart Q&A: Use the live stats provided.
2. Talent Matching: Output profiles in [TALENT_MATCHING: {...}] format if requested.
3. Roadmap Builder: Output [ROADMAP: {...}] format if requested.
`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: finalSystemPrompt },
                ...messages.map((m: any) => ({ role: m.role, content: m.content }))
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
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
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

function lastContentString(content: any): string {
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) return content.map(c => c.text || '').join(' ');
    return '';
}
