import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const revalidate = 3600; // Check DB every hour

export async function GET() {
    const supabase = createAdminClient();
    const apiKey = process.env.TAVILY_API_KEY;

    try {
        // 1. Check refresh (24h)
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        
        const { data: cachedData } = await supabase
            .from('hub_external_resources')
            .select('*')
            .eq('type', 'hackathon')
            .gt('last_updated_at', yesterday);

        if (cachedData && cachedData.length >= 15) {
            console.log('✅ Returning 15+ cached hackathons');
            return NextResponse.json(cachedData.map(item => ({
                id: item.id,
                title: item.title,
                url: item.url,
                description: item.description,
                image: item.image_url,
                source: item.source,
                location: item.location,
                deadline: item.deadline,
                prizePool: item.prize_pool,
                teamSize: item.team_size,
                startDate: item.start_date,
                publishedAt: item.last_updated_at
            })));
        }

        // 2. Refresh Scrape
        if (!apiKey) {
            const { data: oldData } = await supabase.from('hub_external_resources').select('*').eq('type', 'hackathon').order('last_updated_at', { ascending: false });
            if (oldData) return NextResponse.json(oldData);
            return NextResponse.json({ error: 'Missing Tavily Key' }, { status: 500 });
        }

        console.log('🚀 Deep Scrape: Hackathons (targeting Unstop, MLH, etc)...');
        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_key: apiKey,
                query: 'upcoming hackathons on Unstop MLH Devfolio and LinkedIn 2024 2025 with cash prizes and team size and start dates',
                search_depth: "advanced",
                include_images: true,
                max_results: 20
            }),
        });

        const data = await response.json();
        if (!data.results) return NextResponse.json({ error: 'Search failed' }, { status: 500 });

        const processed = data.results.map((r: { title: string, url: string, content: string, image?: string }) => {
            const content = r.content.toLowerCase();
            
            // Heuristic for Cash Prize
            let prizePool = "Available";
            const prizeMatch = r.content.match(/\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/i) || 
                              r.content.match(/prize\s*pool?\s*(?:of|is)?\s*(?:₹|INR)?\s*(\d{1,3}(?:,\d{3})*)/i);
            if (prizeMatch) prizePool = prizeMatch[0];
            else if (content.includes('cash prize')) prizePool = "Cash Prize";

            // Heuristic for Team Size
            let teamSize = "Not specified";
            const teamMatch = r.content.match(/team\s*size\s*(?:of)?\s*(\d+\s*-\s*\d+|\d+)/i) ||
                             r.content.match(/(\d+)\s*(?:-)\s*(\d+)\s*members/i);
            if (teamMatch) teamSize = teamMatch[0];
            else if (content.includes('solo') || content.includes('individual')) teamSize = "Individual / Teams";

            // Heuristic for Location/Place
            let location = "Global/Online";
            if (content.includes('in-person') || content.includes('on-site')) {
                const cityMatch = r.content.match(/at\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
                location = cityMatch ? cityMatch[1] : "In-Person";
            }

            // Heuristic for Start Date
            let startDate = null;
            const sMatch = r.content.match(/(starts|begins|on)\s+([A-Z][a-z]+\s+\d{1,2}(?:st|nd|rd|th)?(?:,\s+20\d{2})?)/i);
            if (sMatch) try { startDate = new Date(sMatch[2]).toISOString(); } catch(e) {}

            return {
                type: 'hackathon',
                title: r.title,
                url: r.url,
                description: r.content.substring(0, 400),
                content: r.content,
                image_url: r.image || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=60',
                source: new URL(r.url).hostname.replace('www.', ''),
                location,
                deadline: startDate, // Fallback as deadline if only one date found
                prize_pool: prizePool,
                team_size: teamSize,
                start_date: startDate,
                last_updated_at: new Date().toISOString()
            };
        });

        // Upsert
        const { error: upsertError } = await supabase.from('hub_external_resources').upsert(processed, { onConflict: 'url' });
        if (upsertError) console.error('DB Error:', upsertError);

        return NextResponse.json(processed.map((r: any) => ({
            ...r,
            image: r.image_url,
            prizePool: r.prize_pool,
            teamSize: r.team_size,
            startDate: r.start_date,
            publishedAt: r.last_updated_at
        })));

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
