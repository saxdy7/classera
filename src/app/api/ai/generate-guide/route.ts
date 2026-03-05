import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deepseek, groq } from '@/lib/deepseek';

function extractJSON(raw: string): any {
    if (!raw?.trim()) throw new Error('Empty AI response');
    try { return JSON.parse(raw.trim()); } catch { }
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenced) { try { return JSON.parse(fenced[1].trim()); } catch { } }
    const start = raw.indexOf('{');
    if (start !== -1) {
        let depth = 0, end = -1;
        for (let i = start; i < raw.length; i++) {
            if (raw[i] === '{') depth++;
            else if (raw[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
        }
        if (end !== -1) {
            try { return JSON.parse(raw.slice(start, end + 1)); } catch { }
            const fixed = raw.slice(start, end + 1).replace(/,\s*([}\]])/g, '$1');
            try { return JSON.parse(fixed); } catch { }
        }
    }
    console.error('RAW (first 1500):', raw.slice(0, 1500));
    throw new Error('Failed to parse AI response as JSON');
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { topic, difficulty = 'beginner' } = await req.json();
        if (!topic) return NextResponse.json({ error: 'topic is required' }, { status: 400 });

        const prompt = `Write a comprehensive learning guide for: "${topic}". Level: ${difficulty}.

Output ONLY valid raw JSON (no markdown, no code blocks):
{
  "guide_title": "string",
  "introduction": "string (2-3 paragraphs)",
  "estimated_read_minutes": number,
  "difficulty": "${difficulty}",
  "sections": [
    {
      "heading": "string",
      "content": "string (2-3 detailed paragraphs)",
      "code_example": "string or null",
      "key_points": ["string"],
      "resources": [{ "title": "string", "url": "https://..." }]
    }
  ],
  "summary": "string",
  "next_steps": ["string"]
}

Create 5-7 logical sections with progressively deeper content about "${topic}".`;

        const system = 'You are a JSON-only API. Output raw valid JSON, no markdown, no explanation.';
        let text = '';
        try {
            const c = await deepseek.chat.completions.create({
                messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }],
                model: 'deepseek-chat', temperature: 0.6, max_tokens: 5000,
            });
            text = c.choices[0]?.message?.content ?? '';
        } catch {
            const c = await groq.chat.completions.create({
                messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }],
                model: 'llama-3.3-70b-versatile', temperature: 0.6, max_tokens: 5000,
            });
            text = c.choices[0]?.message?.content ?? '';
        }

        return NextResponse.json(extractJSON(text));
    } catch (err: any) {
        console.error('generate-guide error:', err);
        return NextResponse.json({ error: err.message || 'Generation failed' }, { status: 500 });
    }
}
