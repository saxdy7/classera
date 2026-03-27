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

    // Deduct tokens (AI Course costs 2 credits)
    const { data: deduction, error: deductError } = await supabase.rpc('deduct_ai_tokens', {
      p_user_id: user.id,
      p_amount: 2
    });

    const status = Array.isArray(deduction) ? deduction[0] : deduction;

    if (deductError || !status || !status.success) {
      return NextResponse.json({ error: status?.message || 'Insufficient credits. Please Top Up.' }, { status: 403 });
    }

    const { topic, difficulty = 'beginner', num_modules = 5 } = await req.json();
    if (!topic) return NextResponse.json({ error: 'topic is required' }, { status: 400 });

    const prompt = `Create a structured online course for: "${topic}". Level: ${difficulty}. Modules: ${num_modules}.

Output ONLY valid raw JSON (no markdown, no code blocks):
{
  "course_title": "string",
  "course_description": "string",
  "difficulty": "${difficulty}",
  "total_duration_minutes": number,
  "target_audience": "string",
  "prerequisites": ["string"],
  "learning_outcomes": ["string"],
  "modules": [
    {
      "title": "string",
      "description": "string",
      "lessons": [
        {
          "title": "string",
          "description": "string",
          "duration_minutes": number,
          "type": "video|reading|exercise|quiz",
          "content": "3-4 paragraphs of educational content",
          "resources": [{ "title": "string", "url": "https://..." }]
        }
      ]
    }
  ]
}

Make ${num_modules} modules with 3-4 lessons each.`;

    const system = 'You are a JSON-only API. Output raw valid JSON, no markdown, no explanation.';
    let text = '';
    try {
      const c = await deepseek.chat.completions.create({
        messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }],
        model: 'deepseek-chat', temperature: 0.6, max_tokens: 6000,
      });
      text = c.choices[0]?.message?.content ?? '';
    } catch {
      const c = await groq.chat.completions.create({
        messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile', temperature: 0.6, max_tokens: 6000,
      });
      text = c.choices[0]?.message?.content ?? '';
    }

    return NextResponse.json(extractJSON(text));
  } catch (err: any) {
    console.error('generate-course error:', err);
    return NextResponse.json({ error: err.message || 'Generation failed' }, { status: 500 });
  }
}
