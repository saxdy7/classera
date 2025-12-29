import { NextResponse } from 'next/server';

const OPENROUTER_API_KEY = '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';

export async function POST(request: Request) {
  let message = '';
  try {
    const body = await request.json();
    message = body.message;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Use OpenRouter API with deepseek model (best for structured responses)
    const models = [
      'deepseek/deepseek-chat',
      'google/gemini-2.0-flash-exp:free',
    ];

    for (const model of models) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://classera.app',
            'X-Title': 'Classera AI Assistant',
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'system',
                content: `You are an AI learning assistant. You MUST format ALL responses using proper Markdown.

CRITICAL RULES - FOLLOW EXACTLY:

1. CODE BLOCKS - ALWAYS use triple backticks:
\`\`\`html
<!DOCTYPE html>
<html>
</html>
\`\`\`

2. TABLES - ALWAYS use markdown tables:
| Column 1 | Column 2 |
|----------|----------|
| Data     | Data     |

3. STRUCTURE:
- Use # for main headings
- Use ## for sections
- Use **bold** for emphasis
- Use - for bullet lists
- Use 1. 2. 3. for numbered lists

4. NEVER write "code" or "Copy code" - just use triple backticks

EXAMPLE RESPONSE:

# Topic Title

Brief introduction.

## Code Example

\`\`\`javascript
function hello() {
    console.log("Hello");
}
\`\`\`

## Comparison

| Feature | Option A | Option B |
|---------|----------|----------|
| Speed   | Fast     | Slow     |

## Key Points

- Point 1
- Point 2
- Point 3

Always use this format. Be helpful and educational.`,
              },
              {
                role: 'user',
                content: message,
              },
            ],
            temperature: 0.7,
            max_tokens: 2000,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          let aiReply = data.choices?.[0]?.message?.content;

          if (aiReply && typeof aiReply === 'string') {
            return NextResponse.json({
              reply: aiReply,
              source: `openrouter-${model.split('/')[1]}`
            });
          }
        } else {
          console.log(`${model} API error:`, response.status);
        }
      } catch (error) {
        console.log(`${model} failed:`, error);
        continue;
      }
    }

    // Fallback response with proper markdown
    return NextResponse.json({
      reply: `# ${message}

I apologize, but I'm having trouble connecting to the AI service right now.

## What you can do:

1. Try asking your question again
2. Refresh the page
3. Check your internet connection

I'm here to help with:
- Programming (HTML, CSS, JavaScript, Python, etc.)
- Math and Science
- Study tips and explanations
- Problem solving

Please try again!`,
      source: 'fallback',
    });
  } catch (error) {
    console.error('Error in AI chat:', error);
    return NextResponse.json({
      reply: `# Error

Sorry, I encountered an error. Please try again.`,
      source: 'error',
    });
  }
}
