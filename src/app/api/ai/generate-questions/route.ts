import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

interface GeneratedQuestion {
  id: string;
  question: string;
  type: 'mcq' | 'short_answer' | 'descriptive';
  options?: string[];
  correctAnswer?: number | string;
  marks: number;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic?: string;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      topic,
      subject,
      count = 5,
      difficulty = 'medium',
      questionType = 'mcq',
      includeExplanations = true,
      gradeLevel,
      additionalContext,
    } = body;

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const prompt = `You are an expert educator creating test questions. Generate ${count} ${questionType.toUpperCase()} questions about "${topic}"${subject ? ` in ${subject}` : ''}.

Requirements:
- Difficulty: ${difficulty}
${gradeLevel ? `- Grade Level: ${gradeLevel}` : ''}
${additionalContext ? `- Additional Context: ${additionalContext}` : ''}
- For MCQ: Provide 4 options with one correct answer
- ${includeExplanations ? 'Include explanations for correct answers' : 'No explanations needed'}
- Questions should test understanding, not just memorization
- Vary question styles (definitions, applications, comparisons, scenarios)

Respond with ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "question": "The question text",
      "type": "${questionType}",
      ${questionType === 'mcq' ? `"options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,` : `"correctAnswer": "Expected answer for grading",`}
      "marks": ${questionType === 'descriptive' ? 5 : questionType === 'short_answer' ? 3 : 1},
      "explanation": "Why this is the correct answer",
      "difficulty": "${difficulty}",
      "topic": "${topic}"
    }
  ]
}`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are an expert test question creator. Always respond with valid JSON only. Never include markdown or explanations outside the JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 3000,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 });
    }

    const result = JSON.parse(jsonMatch[0]);
    
    // Add unique IDs to questions
    const questionsWithIds: GeneratedQuestion[] = (result.questions || []).map((q: any, index: number) => ({
      ...q,
      id: `ai_${Date.now()}_${index}`,
    }));

    return NextResponse.json({
      success: true,
      questions: questionsWithIds,
      metadata: {
        topic,
        subject,
        count: questionsWithIds.length,
        difficulty,
        questionType,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error generating questions:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to generate questions' 
    }, { status: 500 });
  }
}

// Generate questions from document/text content
export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      content,
      count = 5,
      questionTypes = ['mcq', 'short_answer'],
      difficulty = 'medium',
    } = body;

    if (!content || content.length < 100) {
      return NextResponse.json({ 
        error: 'Content must be at least 100 characters' 
      }, { status: 400 });
    }

    const prompt = `Analyze the following educational content and generate ${count} test questions based on it.

CONTENT:
"""
${content.substring(0, 4000)}
"""

Requirements:
- Generate a mix of ${questionTypes.join(', ')} questions
- Difficulty: ${difficulty}
- Questions should cover key concepts from the content
- For MCQ: 4 options, one correct
- Include explanations referencing the content

Respond with ONLY valid JSON:
{
  "questions": [
    {
      "question": "Question text",
      "type": "mcq|short_answer|descriptive",
      "options": ["A", "B", "C", "D"], // Only for MCQ
      "correctAnswer": 0, // Index for MCQ, text for others
      "marks": 1,
      "explanation": "Based on the content...",
      "difficulty": "${difficulty}",
      "topic": "Extracted topic"
    }
  ],
  "suggestedTopics": ["Topic 1", "Topic 2"]
}`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at creating educational assessments from content. Respond with valid JSON only.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.6,
      max_tokens: 3000,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 });
    }

    const result = JSON.parse(jsonMatch[0]);
    
    const questionsWithIds = (result.questions || []).map((q: any, index: number) => ({
      ...q,
      id: `ai_content_${Date.now()}_${index}`,
    }));

    return NextResponse.json({
      success: true,
      questions: questionsWithIds,
      suggestedTopics: result.suggestedTopics || [],
      metadata: {
        count: questionsWithIds.length,
        difficulty,
        generatedAt: new Date().toISOString(),
        contentLength: content.length,
      },
    });
  } catch (error: any) {
    console.error('Error generating from content:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to generate questions' 
    }, { status: 500 });
  }
}
