
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        if (!messages || messages.length === 0) {
            return NextResponse.json({ replies: [] });
        }

        // Get last 5 messages for context
        const recentMessages = messages.slice(-5).map((m: any) => ({
            role: 'user', // Simplified for now, ideally differentiate sender
            content: m.content
        }));

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful assistant assisting a student or mentor in a chat. Generate 3 short, relevant, and professional quick replies based on the conversation context. Return ONLY the replies as a JSON array of strings. Example: ["Yes, I agree", "Can you explain more?", "Thanks!"].'
                    },
                    ...recentMessages
                ],
                temperature: 0.7,
                max_tokens: 50
            })
        });

        const data = await response.json();
        let replies = [];

        try {
            const content = data.choices[0].message.content;
            // Handle case where it returns markdown json block
            const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
            replies = JSON.parse(cleaned);
        } catch (e) {
            console.error('Error parsing AI response:', e);
            replies = ['Okay', 'Thanks', 'Sounds good'];
        }

        return NextResponse.json({ replies });
    } catch (error) {
        console.error('Error in smart replies:', error);
        return NextResponse.json({ replies: [] }, { status: 500 });
    }
}
