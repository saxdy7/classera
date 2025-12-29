import { NextResponse } from 'next/server';

const OPENROUTER_API_KEY = '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';

// Function to clean markdown formatting
function cleanMarkdownFormatting(text: string): string {
  let cleaned = text;
  
  // Remove bold markdown (**text** or __text__)
  cleaned = cleaned.replace(/\*\*(.+?)\*\*/g, '$1');
  cleaned = cleaned.replace(/__(.+?)__/g, '$1');
  
  // Remove italic markdown (*text* or _text_)
  cleaned = cleaned.replace(/\*(.+?)\*/g, '$1');
  cleaned = cleaned.replace(/_(.+?)_/g, '$1');
  
  // Remove code block markers (```language and ```)
  cleaned = cleaned.replace(/```\w*\n/g, '');
  cleaned = cleaned.replace(/```/g, '');
  
  // Remove inline code markers (`code`)
  cleaned = cleaned.replace(/`(.+?)`/g, '$1');
  
  // Remove heading markers (###, ##, #)
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');
  
  // Remove horizontal rules (---, ***)
  cleaned = cleaned.replace(/^[-*]{3,}$/gm, '');
  
  // Clean up extra blank lines (more than 2 consecutive)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  return cleaned.trim();
}

export async function POST(request: Request) {
  let message = '';
  try {
    const body = await request.json();
    message = body.message;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Use OpenRouter API with multiple model fallbacks
    const models = [
      'deepseek/deepseek-chat',
      'google/gemini-2.0-flash-exp:free',
      'meta-llama/llama-3.2-3b-instruct:free',
      'qwen/qwen-2-7b-instruct:free',
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
                content: `You are a helpful AI learning assistant for students. 

FORMATTING RULES:
- Do NOT use markdown formatting (no **, __, *, _, \`, ###, etc.)
- Write in plain text with clear paragraphs
- For comparisons, create simple text tables using | for columns
- Use bullet points with • symbol (not - or *)
- Use numbered lists with numbers followed by period (1. 2. 3.)
- Separate sections with blank lines
- For code examples, just indent with spaces (no code blocks)

Answer all questions clearly and provide detailed explanations. Help with any topic including science, math, programming, history, and general knowledge. Be friendly and educational.`,
              },
              {
                role: 'user',
                content: message,
              },
            ],
            temperature: 0.7,
            max_tokens: 1000,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          let aiReply = data.choices?.[0]?.message?.content;
          
          if (aiReply && typeof aiReply === 'string') {
            // Clean up markdown formatting
            aiReply = cleanMarkdownFormatting(aiReply);
            
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

    // Educational fallback if all models fail
    return NextResponse.json({
      reply: getEducationalResponse(message),
      source: 'educational',
    });
  } catch (error) {
    console.error('Error in AI chat:', error);
    return NextResponse.json({
      reply: getEducationalResponse(message),
      source: 'educational',
    });
  }
}

// Educational fallback responses
function getEducationalResponse(message: string): string {
  const lowerMessage = message.toLowerCase();

  // Cloud Computing
  if (lowerMessage.includes('cloud') || lowerMessage.includes('aws') || lowerMessage.includes('azure')) {
    return `☁️ Cloud Computing Explained:

Cloud computing is the delivery of computing services over the internet ("the cloud") to offer faster innovation, flexible resources, and economies of scale.

Key Services:

1. IaaS (Infrastructure as a Service)
   • Virtual machines, storage, networks
   • Examples: AWS EC2, Azure VMs

2. PaaS (Platform as a Service)
   • Development platforms, databases
   • Examples: Heroku, Google App Engine

3. SaaS (Software as a Service)
   • Ready-to-use applications
   • Examples: Gmail, Microsoft 365, Salesforce

Major Cloud Providers:
• AWS (Amazon Web Services) - Market leader
• Microsoft Azure - Enterprise focused
• Google Cloud Platform (GCP) - Data analytics
• IBM Cloud, Oracle Cloud

Benefits:
• Cost savings - Pay only for what you use
• Scalability - Scale up or down easily
• Accessibility - Access from anywhere
• Reliability - High uptime and backups
• Security - Enterprise-grade protection

Common Use Cases:
• Website hosting
• Data storage and backup
• Mobile app backend
• Machine learning and AI
• Big data analytics

Want to learn more about a specific cloud service or provider?`;
  }

  // Photosynthesis
  if (lowerMessage.includes('photosynthesis')) {
    return `🌱 Photosynthesis Explained:

Photosynthesis is the process plants use to convert sunlight into food! Here's how it works:

The Formula: 
6CO₂ + 6H₂O + Light Energy → C₆H₁₂O₆ + 6O₂

Simple Steps:

1. Light Absorption - Chlorophyll in leaves absorbs sunlight

2. Water Splitting - Plants take in water through roots

3. CO₂ Intake - Carbon dioxide enters through leaf pores (stomata)

4. Glucose Production - Sunlight energy converts CO₂ and H₂O into glucose (sugar)

5. Oxygen Release - Oxygen is released as a byproduct

Why It Matters: 
Plants make their own food and give us oxygen to breathe!

Fun Fact: All the oxygen you breathe came from photosynthesis! 🌍

Need help with any specific part of photosynthesis?`;
  }

  // Math/Calculus
  if (lowerMessage.includes('math') || lowerMessage.includes('calculus') || lowerMessage.includes('algebra')) {
    return `📐 Math Help Available!

I can help you with:

• Algebra - Equations, factoring, polynomials
• Calculus - Derivatives, integrals, limits
• Geometry - Shapes, angles, proofs
• Statistics - Mean, median, probability

Tips for Success:

1. Practice regularly (15-30 min daily)
2. Show all your work step-by-step
3. Check your answers
4. Ask questions when stuck

What specific math topic would you like help with? Share a problem and I'll guide you through it!`;
  }

  // Study tips
  if (lowerMessage.includes('study') || lowerMessage.includes('exam') || lowerMessage.includes('test')) {
    return `📚 Effective Study Strategies:

Before Studying:
✅ Find a quiet, distraction-free space
✅ Gather all materials (notes, textbooks, etc.)
✅ Set specific goals for each session

Study Techniques:

1. Pomodoro Technique - 25 min study, 5 min break
2. Active Recall - Test yourself without looking at notes
3. Spaced Repetition - Review material multiple times over days
4. Feynman Technique - Explain concepts in simple terms

Exam Prep:
• Start reviewing 1-2 weeks early
• Create summary sheets
• Practice with past papers
• Get enough sleep (7-8 hours)
• Stay hydrated and eat well

What subject are you preparing for?`;
  }

  // HTML/Web Development
  if (lowerMessage.includes('html') || lowerMessage.includes('css') || lowerMessage.includes('web')) {
    return `🌐 HTML & Web Development:

HTML stands for HyperText Markup Language

• It's the standard language for creating web pages
• Uses tags like <div>, <p>, <a>, <img> to structure content
• Not a programming language - it's a markup language

Basic HTML Structure:

<!DOCTYPE html>
<html>
  <head>
    <title>My Page</title>
  </head>
  <body>
    <h1>Hello World!</h1>
    <p>This is a paragraph.</p>
  </body>
</html>

Related Technologies:
• CSS (Cascading Style Sheets) - Styles and layouts
• JavaScript - Makes pages interactive
• React/Next.js - Modern web frameworks

Learning Path:

1. Learn HTML basics (tags, elements, attributes)
2. Add CSS for styling
3. Add JavaScript for interactivity
4. Practice building real projects

Need help with specific HTML tags or concepts?`;
  }

  // Programming
  if (lowerMessage.includes('program') || lowerMessage.includes('code') || lowerMessage.includes('python') || lowerMessage.includes('javascript') || lowerMessage.includes('java')) {
    return `💻 Programming Help:

I can assist with:
• Python - Basics, loops, functions, data structures
• JavaScript - Variables, functions, DOM manipulation
• Java - OOP concepts, classes, methods
• Data Structures - Arrays, lists, trees, graphs
• Algorithms - Sorting, searching, complexity

Learning Tips:

1. Write code daily (even 20 minutes helps!)
2. Build small projects
3. Debug your own code
4. Read others' code
5. Practice on coding platforms

What programming concept do you need help with?`;
  }

  // Default helpful response
  return `👋 Hi! I'm your AI learning assistant. I can help you with:

📚 Study Topics:
• Science (Biology, Chemistry, Physics)
• Math (Algebra, Calculus, Geometry)
• Programming (Python, JavaScript, Java)
• History, Literature, Languages

💡 Study Skills:
• Exam preparation strategies
• Time management tips
• Note-taking techniques
• Memory improvement

🎯 Problem Solving:
• Step-by-step explanations
• Practice problems
• Concept clarification

What would you like to learn about today? Be specific with your question, and I'll provide a detailed explanation!`;
}
