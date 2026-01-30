import { NextRequest, NextResponse } from 'next/server';
import { deepseek, groq } from '@/lib/deepseek';

// POST /api/ai/generate-roadmap - Generate personalized roadmap with AI
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            target_role,
            current_skills = [],
            experience_level = 'beginner',
            daily_hours = 2,
            target_weeks = 12
        } = body;

        if (!target_role) {
            return NextResponse.json(
                { error: 'target_role is required' },
                { status: 400 }
            );
        }

        const prompt = `You are an expert career advisor and technical curriculum designer.
        
        Generate a "roadmap.sh" style comprehensive learning path for: "${target_role}".
        
        User Context:
        - Current Skills: ${current_skills.length > 0 ? current_skills.join(', ') : 'None'}
        - Experience: ${experience_level}
        - Time: ${daily_hours} hours/day
        
        REQUIREMENTS:
        1. **Structure**: Create 12-18 nodes representing key milestones. Order them logically from basics to advanced.
        2. **Content Depth**: For EACH node, provide a "detailed_summary" that is 3-4 paragraphs long. It must explain the concept deeply, why it matters, and how to use it. This will be shown in a sidebar reading panel.
        3. **Resources**: For EACH node, provide 2-4 HIGH QUALITY, REAL resources.
           - Use known domains: youtube.com, developer.mozilla.org, freecodecamp.org, documentation sites.
           - DO NOT generate fake URLs. If unsure, use a generic search URL or main domain.
        
        Output valid JSON exactly like this:
        {
          "roadmap_title": "${target_role} Professional Roadmap",
          "roadmap_description": "A detailed, step-by-step guide to mastering ${target_role} with curated resources.",
          "estimated_weeks": ${target_weeks},
          "nodes": [
            {
              "title": "Topic Title",
              "description": "Short tagline (10 words max)",
              "detailed_summary": "Paragraph 1: Concept intro...\\n\\nParagraph 2: Deep dive...\\n\\nParagraph 3: Practical application...",
              "node_type": "topic",
              "estimated_hours": 10,
              "resources": [
                { "title": "Crash Course Video", "url": "https://youtube.com/...", "type": "video" },
                { "title": "MDN Documentation", "url": "https://developer.mozilla.org/...", "type": "article" }
              ]
            }
          ]
        }`;

        let responseText = '';
        const systemMessage = 'You are an expert learning path designer. Always respond with valid JSON only.';

        try {
            console.log("🤖 Attempting generation with DeepSeek...");
            const completion = await deepseek.chat.completions.create({
                messages: [
                    { role: 'system', content: systemMessage },
                    { role: 'user', content: prompt }
                ],
                model: 'deepseek-chat',
                temperature: 0.7,
                max_tokens: 4000
            });
            responseText = completion.choices[0]?.message?.content || '';
        } catch (deepseekError: any) {
            console.warn("⚠️ DeepSeek failed, falling back to Groq...", deepseekError.message);
            const completion = await groq.chat.completions.create({
                messages: [
                    { role: 'system', content: systemMessage },
                    { role: 'user', content: prompt }
                ],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.7,
                max_tokens: 4000
            });
            responseText = completion.choices[0]?.message?.content || '';
        }

        // Extract JSON from response
        let roadmapData;
        try {
            // Try to parse directly
            roadmapData = JSON.parse(responseText);
        } catch (e) {
            // Try to extract JSON from markdown code blocks
            const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) ||
                responseText.match(/```\n([\s\S]*?)\n```/);
            if (jsonMatch) {
                roadmapData = JSON.parse(jsonMatch[1]);
            } else {
                console.error("Failed to parse response:", responseText);
                throw new Error('Failed to parse AI response as JSON');
            }
        }

        // Apply "Tree Layout" Logic (Center Trunk with Alternating Branches)
        // x=400 is center. x=150 is left. x=650 is right.
        roadmapData.nodes = roadmapData.nodes.map((node: any, index: number) => {
            let x = 400; // Default Center
            let y = 100 + (index * 120); // Spacing vertically

            // Pattern: Center -> Left -> Right -> Center -> Left -> Right...
            const positionPattern = index % 3;

            if (positionPattern === 1) {
                x = 150; // Left Branch
                y = 100 + ((index - 1) * 120) + 60; // Slightly offset vertically from spine
            } else if (positionPattern === 2) {
                x = 650; // Right Branch
                y = 100 + ((index - 2) * 120) + 60; // Slightly offset vertically from spine
            }
            // index % 3 === 0 stays at Center (x=400)

            return {
                ...node,
                order_index: index + 1,
                position_x: x,
                position_y: y
            };
        });

        return NextResponse.json({
            roadmap: roadmapData,
            message: 'Roadmap generated successfully!'
        });

    } catch (error: any) {
        console.error('Error generating roadmap:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate roadmap' },
            { status: 500 }
        );
    }
}
