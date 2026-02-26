import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deepseek, groq } from '@/lib/deepseek';

// POST /api/ai/generate-course - Generate structured course content with AI
export async function POST(request: NextRequest) {
    try {
        // Auth guard
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }


        const body = await request.json();
        const { topic, difficulty = 'beginner', target_audience } = body;

        if (!topic) {
            return NextResponse.json(
                { error: 'topic is required' },
                { status: 400 }
            );
        }

        const prompt = `You are an expert academic course creator.
        Create a "University Grade" structured course on: "${topic}".
        
        Target Audience: ${target_audience || 'University Students'}
        Difficulty: ${difficulty}
        
        REQUIREMENTS:
        1. **Structure**: Create 4-6 Modules, with 3-5 Lessons per module.
        2. **Content Depth**: For EACH lesson, generate FULL TEXT CONTENT in Markdown format.
           - Use Headers (##, ###) for sections.
           - Use Code Blocks (\`\`\`language) for technical concepts.
           - Include "Key Takeaways" at the end.
           - Content length should be substantial (like a tutorial article), not just a summary.
        
        Output valid JSON exactly like this:
        {
          "course": {
            "title": "Course Title",
            "description": "Academic description of the course curriculum.",
            "difficulty": "${difficulty}",
            "category": "Technology",
            "tags": ["tag1", "tag2"],
            "modules": [
              {
                "title": "Module 1: Fundamentals",
                "description": "Module overview",
                "lessons": [
                  {
                    "title": "1.1 Lesson Title",
                    "description": "Brief abstract",
                    "content": "# Lesson Title\\n\\n## Introduction\\nDetailed concept explanation...\\n\\n## Technical Deep Dive\\n...\\n\\n## Example\\n\`\`\`javascript\\nconst x = 1;\\n\`\`\`\\n\\n## Key Takeaways\\n- Point 1...",
                    "duration_minutes": 20
                  }
                ]
              }
            ]
          }
        }`;

        let responseText = '';
        const systemMessage = 'You are an expert course creator. Always respond with valid JSON only. do not wrap in markdown code blocks.';

        try {
            console.log("🤖 Attempting generation with DeepSeek...");
            const completion = await deepseek.chat.completions.create({
                messages: [
                    { role: 'system', content: systemMessage },
                    { role: 'user', content: prompt }
                ],
                model: 'deepseek-chat', // Try direct/openrouter first
                temperature: 0.7,
                max_tokens: 6000
            });
            responseText = completion.choices[0]?.message?.content || '';
        } catch (deepseekError: any) {
            console.warn("⚠️ DeepSeek failed, falling back to Groq (Llama 3.3)...", deepseekError.message);
            // Fallback to Groq
            const completion = await groq.chat.completions.create({
                messages: [
                    { role: 'system', content: systemMessage },
                    { role: 'user', content: prompt }
                ],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.7,
                max_tokens: 6000
            });
            responseText = completion.choices[0]?.message?.content || '';
        }

        // Extract JSON from response
        let courseData;
        try {
            // Try to parse directly first
            courseData = JSON.parse(responseText);
        } catch (e) {
            // Try to extract JSON from markdown if direct parse fails
            const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) ||
                responseText.match(/```\n([\s\S]*?)\n```/) ||
                responseText.match(/\{[\s\S]*\}/); // Fallback to finding first brace

            if (jsonMatch) {
                // If the match is from regex finding brace, it might be the whole text or capture group
                const jsonString = jsonMatch[1] || jsonMatch[0];
                courseData = JSON.parse(jsonString);
            } else {
                console.error("Failed to parse response:", responseText);
                throw new Error('Failed to parse AI response as JSON');
            }
        }

        return NextResponse.json({
            course: courseData.course,
            message: 'Course generated successfully!'
        });

    } catch (error: any) {
        console.error('Error generating course:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate course' },
            { status: 500 }
        );
    }
}
