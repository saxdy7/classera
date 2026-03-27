import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const revalidate = 3600;

export async function GET() {
    const supabase = createAdminClient();
    const apiKey = process.env.TAVILY_API_KEY;

    try {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        
        const { data: cachedData } = await supabase
            .from('hub_external_resources')
            .select('*')
            .eq('type', 'course')
            .gt('last_updated_at', yesterday);

        if (cachedData && cachedData.length >= 15) {
            console.log('✅ Returning 15+ detailed cached courses');
            return NextResponse.json(cachedData.map(item => ({
                id: item.id,
                title: item.title,
                url: item.url,
                description: item.description,
                image: item.image_url,
                source: item.source,
                difficulty: item.difficulty,
                duration: item.duration,
                rating: item.rating,
                price: item.price,
                certificateOffered: item.certificate_offered,
                publishedAt: item.last_updated_at
            })));
        }

        if (!apiKey) {
            const { data: oldData } = await supabase.from('hub_external_resources').select('*').eq('type', 'course').order('last_updated_at', { ascending: false });
            if (oldData) return NextResponse.json(oldData);
            return NextResponse.json({ error: 'Missing API Key' }, { status: 500 });
        }

        console.log('🚀 Deep Scrape: Premium Online Courses (Coursera, Udemy, edX)...');
        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_key: apiKey,
                query: 'best free technology courses 2024 2025 Coursera Udemy edX ACS Code Hub with certificate ratings and duration',
                search_depth: "advanced",
                include_images: true,
                max_results: 20
            }),
        });

        const data = await response.json();
        if (!data.results) return NextResponse.json({ error: 'Scrape failed' }, { status: 500 });

        const processed = data.results.map((r: { title: string, url: string, content: string, image?: string }) => {
            const content = r.content.toLowerCase();
            
            // Heuristic for Rating
            let rating = "4.5+";
            const ratMatch = r.content.match(/(\d\.\d)\s*(star|out of 5)/i) || r.content.match(/rating\s*(\d\.\d)/i);
            if (ratMatch) rating = ratMatch[1];

            // Heuristic for Difficulty
            let difficulty = "Beginner";
            if (content.includes('intermediate')) difficulty = "Intermediate";
            else if (content.includes('advanced') || content.includes('expert')) difficulty = "Advanced";

            // Heuristic for Duration
            let duration = "Self-paced";
            const durMatch = r.content.match(/(\d+)\s*(hours|hrs|weeks|mnths)/i);
            if (durMatch) duration = durMatch[0];

            // Heuristic for Price/Cert
            let price = "Free";
            if (content.includes('paid') || content.includes('$')) price = "Paid (Assistance available)";
            
            const certificateOffered = content.includes('certificate') || content.includes('certified');

            return {
                type: 'course',
                title: r.title,
                url: r.url,
                description: r.content.substring(0, 450),
                content: r.content,
                image_url: r.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60',
                source: new URL(r.url).hostname.replace('www.', ''),
                difficulty: difficulty,
                duration: duration,
                rating: rating,
                price: price,
                certificate_offered: certificateOffered,
                last_updated_at: new Date().toISOString()
            };
        });

        const { error: upsertError } = await supabase.from('hub_external_resources').upsert(processed, { onConflict: 'url' });
        if (upsertError) console.error('DB Upsert error:', upsertError);

        return NextResponse.json(processed.map((r: any) => ({
            ...r,
            image: r.image_url,
            certificateOffered: r.certificate_offered,
            publishedAt: r.last_updated_at
        })));

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
