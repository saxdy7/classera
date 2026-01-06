import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Do not initialize globally to avoid crashes if env is missing
// const groq = new Groq({...}); 

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export async function POST(req: Request) {
    console.log('[AI Chat] Request received');

    try {
        if (!process.env.GROQ_API_KEY) {
            console.error('[AI Chat] GROQ_API_KEY is missing');
            return NextResponse.json(
                { error: 'Server configuration error: GROQ_API_KEY missing. Please restart the server.' },
                { status: 500 }
            );
        }

        const groq = new Groq({
            apiKey: process.env.GROQ_API_KEY,
        });

        const body = await req.json();
        /* Handle both simple {message} format and standard {messages} format */
        const messages = body.messages || (body.message ? [{ role: 'user', content: body.message }] : []);
        const systemPrompt = body.systemPrompt;

        if (!messages.length) {
            return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
        }

        const lastMessage = messages[messages.length - 1];
        let searchContext = '';

        // Simple heuristic: if the user asks a question that might need external info, search first.
        const needsSearch = containsQuestion(lastMessage.content);

        console.log(`[AI Chat] User message: "${lastMessage.content}" | Needs search: ${needsSearch}`);

        if (needsSearch && TAVILY_API_KEY) {
            console.log('[AI Chat] Searching Tavily...');
            try {
                const searchResponse = await fetch('https://api.tavily.com/search', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        api_key: TAVILY_API_KEY,
                        query: lastMessage.content,
                        search_depth: "basic",
                        include_answer: true,
                        max_results: 5
                    }),
                });

                const searchData = await searchResponse.json();
                if (searchData.results && searchData.results.length > 0) {
                    console.log(`[AI Chat] Found ${searchData.results.length} search results`);
                    searchContext = `\n\n[Real-time Search Context from Tavily]:\n${searchData.results.map((r: any) => `- ${r.title}: ${r.content} (${r.url})`).join('\n')}\n\nUse this context to answer if relevant.`;
                } else {
                    console.log('[AI Chat] No search results found');
                }
            } catch (err) {
                console.error('[AI Chat] Tavily search failed:', err);
            }
        }

        const finalSystemPrompt = `${systemPrompt || 'You are a helpful AI assistant for Classera, an educational platform.'}
        
Be concise, friendly, and encouraging. You are an expert mentor.
${searchContext ? 'You have access to real-time information from the web. Use it to provide up-to-date answers.' : ''}`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: finalSystemPrompt + searchContext },
                ...messages.map((m: any) => ({
                    role: m.role,
                    content: m.content
                }))
            ],
            model: 'llama-3.3-70b-versatile', // Updated to latest supported model
            temperature: 0.7,
            max_tokens: 1024,
            stream: true,
        });

        // Set up streaming response
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                for await (const chunk of completion) {
                    const content = chunk.choices[0]?.delta?.content || '';
                    if (content) {
                        controller.enqueue(encoder.encode(content));
                    }
                }
                controller.close();
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
            },
        });

    } catch (error: any) {
        console.error('AI Chat Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}

function containsQuestion(text: string): boolean {
    const triggers = [
        // Question words
        'what', 'how', 'why', 'when', 'who', 'where', 'can', 'could', 'should', 'is', 'are', 'do', 'does',
        // Action words
        'find', 'search', 'get', 'show', 'tell', 'explain', 'give', 'list',
        // Keywords
        'course', 'tutorial', 'learn', 'guide', 'news', 'latest', 'update', 'video', 'roadmap', 'syllabus',
        'python', 'javascript', 'react', 'nextjs', 'node', 'coding', 'programming'
    ];

    // Safety check
    if (!text || typeof text !== 'string') return false;

    const lower = text.toLowerCase();

    // Always search if it looks like a question or contains trigger words
    return text.includes('?') || triggers.some(w => lower.includes(w));
}
