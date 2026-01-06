import Groq from 'groq-sdk';

const GROQ_KEY = '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';
const TAVILY_KEY = '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';

async function testGroq() {
    console.log('Testing Groq...');
    try {
        const groq = new Groq({ apiKey: GROQ_KEY });
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: 'Hello' }],
            model: 'llama3-70b-8192',
        });
        console.log('✅ Groq Success:', completion.choices[0]?.message?.content?.slice(0, 50));
    } catch (e) {
        console.error('❌ Groq Failed:', e.message);
    }
}

async function testTavily() {
    console.log('\nTesting Tavily...');
    try {
        const res = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_key: TAVILY_KEY,
                query: 'test',
                search_depth: "basic"
            })
        });
        const data = await res.json();
        if (data.results) {
            console.log('✅ Tavily Success: Found', data.results.length, 'results');
        } else {
            console.error('❌ Tavily Failed:', data);
        }
    } catch (e) {
        console.error('❌ Tavily Error:', e.message);
    }
}

async function run() {
    await testGroq();
    await testTavily();
}

run();
