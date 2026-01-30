import { NextRequest, NextResponse } from 'next/server';
import { deepseek, groq } from '@/lib/deepseek';

// POST /api/ai/generate-guide - Generate guide with AI
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { topic, difficulty = 'beginner', include_code = true } = body;

        if (!topic) {
            return NextResponse.json(
                { error: 'topic is required' },
                { status: 400 }
            );
        }

        const prompt = `You are an expert technical writer and educator.

Create a comprehensive learning guide about: ${topic}

Target Audience: ${difficulty} level learners

Requirements:
1. Clear, concise explanations
2. Practical examples
3. Code blocks with syntax highlighting
4. Key concepts highlighted
5. Best practices
6. Common pitfalls to avoid
7. Curated Resources (List 5+ real, high-quality links to official docs, tutorials, or tools. Do not hallucinate links if possible, focus on domains like MDN, YouTube, Official Docus.)

Structure:
- **Introduction** (Context and importance)
- **Prerequisites & Setup** (Tools needed, environment setup - Be specific!)
- **Step-by-Step Implementation** (The core guide - Use code blocks)
- **Common Pitfalls** (What goes wrong and how to fix it)
- **Best Practices** (Industry standards)
- **Curated External Resources** (CRITICAL: List 5+ REAL, high-quality links to official docs, great tutorials, or tools. Do not hallucinate URLs.)
- **Next Steps** (What to build/learn next)

Output as clean, structured Markdown.
Use '\`\`\`language' for code blocks.
Make it actionable: The user should be able to follow this and build / learn something concrete.
Include a "Time to Read" estimate at the top.

Generate the guide now: `;

        let content = '';
        const systemMessage = 'You are an expert technical educator. Create clear, practical learning guides.';

        try {
            console.log("🤖 Attempting generation with DeepSeek...");
            const completion = await deepseek.chat.completions.create({
                messages: [
                    { role: 'system', content: systemMessage },
                    { role: 'user', content: prompt }
                ],
                model: 'deepseek-chat',
                temperature: 0.7,
                max_tokens: 3000
            });
            content = completion.choices[0]?.message?.content || '';
        } catch (deepseekError: any) {
            console.warn("⚠️ DeepSeek failed, falling back to Groq...", deepseekError.message);
            const completion = await groq.chat.completions.create({
                messages: [
                    { role: 'system', content: systemMessage },
                    { role: 'user', content: prompt }
                ],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.7,
                max_tokens: 3000
            });
            content = completion.choices[0]?.message?.content || '';
        }

        // Extract title from content or use topic
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1] : `${topic} - Complete Guide`;

        return NextResponse.json({
            guide: {
                title,
                content,
                topic,
                difficulty,
                ai_generated: true
            },
            message: 'Guide generated successfully!'
        });

    } catch (error: any) {
        console.error('Error generating guide:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate guide' },
            { status: 500 }
        );
    }
}
