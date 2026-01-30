
import OpenAI from 'openai';
import Groq from 'groq-sdk';

// 1. Groq Client (Reliable Fallback)
export const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || ''
});

// 2. DeepSeek/OpenAI Client (For Primary High-Quality Generation)
const deepSeekApiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENROUTER_API_KEY;
const deepSeekBaseURL = process.env.DEEPSEEK_API_KEY ? 'https://api.deepseek.com' : 'https://openrouter.ai/api/v1';

export const deepseek = new OpenAI({
    baseURL: deepSeekBaseURL,
    apiKey: deepSeekApiKey || 'dummy-key',
    dangerouslyAllowBrowser: false
});
