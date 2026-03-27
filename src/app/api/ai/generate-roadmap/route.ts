import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deepseek, groq } from '@/lib/deepseek';

/** Robustly extract the first JSON object from a string that may contain
 *  markdown fences, leading text, trailing text, or partial content. */
function extractJSON(raw: string): any {
    if (!raw || !raw.trim()) throw new Error('Empty AI response');

    // 1. Try direct parse first
    try { return JSON.parse(raw.trim()); } catch { }

    // 2. Strip ```json ... ``` or ``` ... ``` fences
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenced) {
        try { return JSON.parse(fenced[1].trim()); } catch { }
    }

    // 3. Find first { ... } block (greedy, handles nested braces)
    const start = raw.indexOf('{');
    if (start !== -1) {
        // Walk to match the closing brace
        let depth = 0;
        let end = -1;
        for (let i = start; i < raw.length; i++) {
            if (raw[i] === '{') depth++;
            else if (raw[i] === '}') {
                depth--;
                if (depth === 0) { end = i; break; }
            }
        }
        if (end !== -1) {
            try { return JSON.parse(raw.slice(start, end + 1)); } catch { }

            // 4. Try fixing common issues: trailing commas before } or ]
            const chunk = raw.slice(start, end + 1)
                .replace(/,\s*([}\]])/g, '$1')   // trailing commas
                .replace(/[\u0000-\u001F\u007F]/g, ' '); // control chars
            try { return JSON.parse(chunk); } catch { }
        }
    }

    console.error('RAW AI RESPONSE (first 2000 chars):', raw.slice(0, 2000));
    throw new Error('Failed to parse AI response as JSON');
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Deduct tokens (AI Roadmap costs 2 credits)
        const { data: deduction, error: deductError } = await supabase.rpc('deduct_ai_tokens', {
            p_user_id: user.id,
            p_amount: 2
        });

        const status = Array.isArray(deduction) ? deduction[0] : deduction;

        if (deductError || !status || !status.success) {
            return NextResponse.json({ error: status?.message || 'Insufficient credits. Please Top Up.' }, { status: 403 });
        }

        const body = await request.json();
        const {
            target_role,
            current_skills = [],
            experience_level = 'beginner',
            daily_hours = 2,
            target_weeks = 12
        } = body;

        if (!target_role) return NextResponse.json({ error: 'target_role is required' }, { status: 400 });

        const prompt = `You are an expert career advisor and technical curriculum designer.

Generate a comprehensive learning roadmap for: "${target_role}".

User context:
- Current Skills: ${current_skills.length > 0 ? current_skills.join(', ') : 'None'}
- Experience: ${experience_level}
- Time available: ${daily_hours} hours/day
- Timeline: ${target_weeks} weeks

STRICT OUTPUT RULES:
- Output ONLY raw JSON. No markdown, no code blocks, no prose before or after.
- The JSON must be valid and parseable directly.

JSON schema (output exactly this shape):
{
  "roadmap_title": "string",
  "roadmap_description": "string",
  "estimated_weeks": ${target_weeks},
  "nodes": [
    {
      "title": "string",
      "description": "Short 8-word tagline",
      "detailed_summary": "3 paragraphs separated by \\n\\n",
      "node_type": "topic",
      "estimated_hours": 10,
      "resources": [
        { "title": "string", "url": "https://...", "type": "video" }
      ]
    }
  ]
}

Generate 10-14 nodes, ordered from fundamentals to advanced. Each node must have 2-3 real resources.`;

        const system = 'You are a JSON-only API. Output raw, valid JSON with no markdown, no explanation, no code fences.';
        let responseText = '';

        try {
            console.log('🤖 Trying DeepSeek…');
            const c = await deepseek.chat.completions.create({
                messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }],
                model: 'deepseek-chat',
                temperature: 0.6,
                max_tokens: 5000,
            });
            responseText = c.choices[0]?.message?.content ?? '';
        } catch (err: any) {
            console.warn('⚠️ DeepSeek failed, falling back to Groq:', err.message);
            const c = await groq.chat.completions.create({
                messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.6,
                max_tokens: 5000,
            });
            responseText = c.choices[0]?.message?.content ?? '';
        }

        const roadmapData = extractJSON(responseText);

        // Ensure nodes array exists
        if (!Array.isArray(roadmapData.nodes)) {
            throw new Error('AI response missing nodes array');
        }

        // Attach order_index to each node
        roadmapData.nodes = roadmapData.nodes.map((node: any, index: number) => ({
            ...node,
            order_index: index + 1,
        }));

        return NextResponse.json(roadmapData);

    } catch (error: any) {
        console.error('generate-roadmap error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate roadmap' },
            { status: 500 }
        );
    }
}
