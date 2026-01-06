import { NextResponse } from 'next/server';

const GOOGLE_SEARCH_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
const SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID || 'd001804078de54f0e';

// Platform-specific search refinements
const PLATFORM_SITES = [
    'coursera.org',
    'udemy.com',
    'edx.org',
    'udacity.com',
    'linkedin.com/learning',
    'freecodecamp.org',
    'codecademy.com',
    'pluralsight.com',
    'skillshare.com'
];

interface SearchResult {
    id: string;
    title: string;
    description: string;
    url: string;
    platform: string;
    image?: string;
    displayLink: string;
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query') || searchParams.get('q') || '';
        const platform = searchParams.get('platform') || 'all';
        const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 10); // API max is 10

        console.log('[Live Search] Query:', query, '| API Key exists:', !!GOOGLE_SEARCH_API_KEY);

        if (!query) {
            return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
        }

        if (!GOOGLE_SEARCH_API_KEY) {
            // Fallback: return a message but also try with hardcoded key for testing
            console.log('[Live Search] No API key found in env');
            return NextResponse.json({
                courses: [],
                source: 'no_api_key',
                message: 'Google Search API key not configured. Add GOOGLE_SEARCH_API_KEY to .env.local'
            });
        }

        // Build search query - keep it simple for Custom Search API
        let searchQuery = `${query} online course`;

        // Only add single site filter if platform specified (not multiple with OR)
        if (platform !== 'all') {
            const platformDomain = PLATFORM_SITES.find(site =>
                site.toLowerCase().includes(platform.toLowerCase())
            );
            if (platformDomain) {
                searchQuery += ` site:${platformDomain}`;
            }
        }
        // Note: When platform is 'all', we don't add site: filters
        // The Custom Search Engine is already configured to search the whole web

        // Call Google Custom Search API
        const apiUrl = new URL('https://www.googleapis.com/customsearch/v1');
        apiUrl.searchParams.set('key', GOOGLE_SEARCH_API_KEY);
        apiUrl.searchParams.set('cx', SEARCH_ENGINE_ID);
        apiUrl.searchParams.set('q', searchQuery);
        apiUrl.searchParams.set('num', limit.toString());
        apiUrl.searchParams.set('safe', 'active');

        const response = await fetch(apiUrl.toString());
        const data = await response.json();

        if (data.error) {
            console.error('Google Search API error:', data.error);
            return NextResponse.json({
                error: data.error.message,
                courses: [],
                source: 'api_error'
            }, { status: 400 });
        }

        // Transform results
        const courses: SearchResult[] = (data.items || []).map((item: any, index: number) => {
            // Extract platform from URL
            const url = new URL(item.link);
            let platform = 'Other';

            if (url.hostname.includes('coursera')) platform = 'Coursera';
            else if (url.hostname.includes('udemy')) platform = 'Udemy';
            else if (url.hostname.includes('edx')) platform = 'edX';
            else if (url.hostname.includes('udacity')) platform = 'Udacity';
            else if (url.hostname.includes('linkedin')) platform = 'LinkedIn Learning';
            else if (url.hostname.includes('freecodecamp')) platform = 'freeCodeCamp';
            else if (url.hostname.includes('codecademy')) platform = 'Codecademy';
            else if (url.hostname.includes('pluralsight')) platform = 'Pluralsight';
            else if (url.hostname.includes('skillshare')) platform = 'Skillshare';

            return {
                id: `live_${index}_${Date.now()}`,
                title: item.title?.replace(/ - .*$/, '').replace(/ \| .*$/, '') || 'Untitled Course',
                description: item.snippet || '',
                url: item.link,
                platform,
                image: item.pagemap?.cse_thumbnail?.[0]?.src ||
                    item.pagemap?.cse_image?.[0]?.src ||
                    `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400`,
                displayLink: item.displayLink
            };
        });

        return NextResponse.json({
            courses,
            total: data.searchInformation?.totalResults || courses.length,
            query: query,
            source: 'google_custom_search',
            searchTime: data.searchInformation?.searchTime
        });

    } catch (error: any) {
        console.error('Error in live search:', error);
        return NextResponse.json({
            error: error.message,
            courses: [],
            source: 'error'
        }, { status: 500 });
    }
}
