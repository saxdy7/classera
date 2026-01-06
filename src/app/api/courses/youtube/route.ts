import { NextResponse } from 'next/server';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';

// Whitelisted educational channels (prioritize these)
const EDUCATIONAL_CHANNELS = [
    'freeCodeCamp.org',
    'Traversy Media',
    'Programming with Mosh',
    'The Net Ninja',
    'Academind',
    'CS50',
    '3Blue1Brown',
    'Fireship',
    'Web Dev Simplified',
    'Tech With Tim',
    'Corey Schafer',
    'JavaScript Mastery',
    'SuperSimpleDev',
    'Bro Code',
    'CrashCourse',
    'Khan Academy'
];

// Blocked keywords (not educational)
const BLOCKED_KEYWORDS = [
    'vlog', 'travel', 'mukbang', 'asmr', 'funny', 'comedy', 'prank',
    'reaction', 'unboxing', 'challenge', 'tiktok', 'shorts', 'music video',
    'trailer', 'movie', 'film', 'gameplay', 'let\'s play', 'gaming stream'
];

interface YouTubeVideo {
    id: string;
    title: string;
    channel: string;
    channelId: string;
    views: string;
    duration: string;
    thumbnail: string;
    publishedAt: string;
    description: string;
    isEducational: boolean;
}

// Cache for API results
const cache: Map<string, { data: any; timestamp: number }> = new Map();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        let query = searchParams.get('query') || searchParams.get('topic') || 'programming';
        const maxResults = Math.min(parseInt(searchParams.get('maxResults') || '20'), 50);

        // Enhance query for educational content
        const educationalQuery = enhanceQueryForEducation(query);

        // Check cache
        const cacheKey = `youtube_edu_${educationalQuery}_${maxResults}`;
        const cached = cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return NextResponse.json({ videos: cached.data, source: 'cache', query: educationalQuery });
        }

        // If no API key, return curated fallback
        if (!YOUTUBE_API_KEY) {
            console.warn('YouTube API key not configured, using fallback data');
            return NextResponse.json({
                videos: getFallbackVideos(query),
                source: 'fallback',
                message: 'Using curated educational videos. Add YOUTUBE_API_KEY for live search.'
            });
        }

        // Search with educational filters
        const searchResponse = await fetch(
            `${YOUTUBE_API_URL}/search?` + new URLSearchParams({
                part: 'snippet',
                type: 'video',
                q: educationalQuery,
                maxResults: String(Math.min(maxResults * 2, 50)), // Get more to filter
                order: 'relevance',
                relevanceLanguage: 'en',
                videoDuration: 'medium', // 4-20 minutes, or use 'long' for 20+ min
                videoDefinition: 'high',
                safeSearch: 'strict',
                key: YOUTUBE_API_KEY
            })
        );

        if (!searchResponse.ok) {
            const errorText = await searchResponse.text();
            console.error('YouTube API error:', errorText);
            return NextResponse.json({ videos: getFallbackVideos(query), source: 'fallback' });
        }

        const searchData = await searchResponse.json();
        const videoIds = searchData.items?.map((item: any) => item.id.videoId).join(',');

        if (!videoIds) {
            return NextResponse.json({ videos: [], source: 'api', message: 'No results found' });
        }

        // Get video details
        const detailsResponse = await fetch(
            `${YOUTUBE_API_URL}/videos?` + new URLSearchParams({
                part: 'snippet,contentDetails,statistics',
                id: videoIds,
                key: YOUTUBE_API_KEY
            })
        );

        if (!detailsResponse.ok) {
            return NextResponse.json({ videos: getFallbackVideos(query), source: 'fallback' });
        }

        const detailsData = await detailsResponse.json();

        // Transform and filter for educational content
        let videos: YouTubeVideo[] = detailsData.items?.map((item: any) => ({
            id: item.id,
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            channelId: item.snippet.channelId,
            views: formatViews(item.statistics?.viewCount || '0'),
            duration: formatDuration(item.contentDetails?.duration || 'PT0M'),
            thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url,
            publishedAt: item.snippet.publishedAt,
            description: item.snippet.description?.substring(0, 300) || '',
            isEducational: isEducationalVideo(item)
        })) || [];

        // Filter: only educational videos
        videos = videos.filter(v => v.isEducational);

        // Sort: prioritize whitelisted channels, then by views
        videos.sort((a, b) => {
            const aWhitelisted = EDUCATIONAL_CHANNELS.some(c => a.channel.includes(c)) ? 1 : 0;
            const bWhitelisted = EDUCATIONAL_CHANNELS.some(c => b.channel.includes(c)) ? 1 : 0;
            if (aWhitelisted !== bWhitelisted) return bWhitelisted - aWhitelisted;
            return parseViewCount(b.views) - parseViewCount(a.views);
        });

        // Limit results
        videos = videos.slice(0, maxResults);

        // Cache results
        cache.set(cacheKey, { data: videos, timestamp: Date.now() });

        return NextResponse.json({
            videos,
            source: 'api',
            query: educationalQuery,
            filtered: true
        });
    } catch (error) {
        console.error('Error fetching YouTube videos:', error);
        return NextResponse.json({ videos: getFallbackVideos('programming'), source: 'fallback' });
    }
}

function enhanceQueryForEducation(query: string): string {
    const lowerQuery = query.toLowerCase();

    // Add educational keywords if not present
    const educationalKeywords = ['tutorial', 'course', 'learn', 'guide', 'how to', 'for beginners'];
    const hasEducationalKeyword = educationalKeywords.some(kw => lowerQuery.includes(kw));

    if (!hasEducationalKeyword) {
        // Map common topics to better search terms
        const topicMappings: Record<string, string> = {
            'full stack': 'full stack development tutorial',
            'react': 'react js tutorial for beginners',
            'python': 'python programming tutorial',
            'javascript': 'javascript tutorial course',
            'node': 'node.js tutorial',
            'machine learning': 'machine learning course',
            'ai': 'artificial intelligence tutorial',
            'data science': 'data science tutorial',
            'web development': 'web development course',
            'css': 'css tutorial for beginners',
            'html': 'html tutorial complete course',
        };

        for (const [key, value] of Object.entries(topicMappings)) {
            if (lowerQuery.includes(key)) {
                return value;
            }
        }

        return `${query} tutorial course`;
    }

    return query;
}

function isEducationalVideo(item: any): boolean {
    const title = item.snippet?.title?.toLowerCase() || '';
    const description = item.snippet?.description?.toLowerCase() || '';
    const channel = item.snippet?.channelTitle || '';

    // Check if from whitelisted channel
    if (EDUCATIONAL_CHANNELS.some(c => channel.includes(c))) {
        return true;
    }

    // Check for blocked keywords
    for (const blocked of BLOCKED_KEYWORDS) {
        if (title.includes(blocked) || description.includes(blocked)) {
            return false;
        }
    }

    // Check for educational indicators
    const educationalIndicators = [
        'tutorial', 'course', 'learn', 'how to', 'guide', 'lesson',
        'programming', 'coding', 'development', 'developer', 'lecture',
        'explained', 'introduction', 'beginner', 'complete', 'full course',
        'crash course', 'bootcamp', 'masterclass'
    ];

    const hasEducationalIndicator = educationalIndicators.some(
        indicator => title.includes(indicator) || description.includes(indicator)
    );

    // Check minimum duration (at least 5 minutes for educational content)
    const duration = item.contentDetails?.duration || '';
    const durationMinutes = parseDurationToMinutes(duration);
    const hasMinDuration = durationMinutes >= 5;

    // Check minimum views (quality indicator)
    const views = parseInt(item.statistics?.viewCount || '0');
    const hasMinViews = views >= 10000;

    return hasEducationalIndicator && hasMinDuration && hasMinViews;
}

function parseDurationToMinutes(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    return hours * 60 + minutes;
}

function parseViewCount(views: string): number {
    const num = parseFloat(views.replace(/[^\d.]/g, ''));
    if (views.includes('M')) return num * 1000000;
    if (views.includes('K')) return num * 1000;
    return num;
}

function formatViews(viewCount: string): string {
    const views = parseInt(viewCount);
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return viewCount;
}

function formatDuration(duration: string): string {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '0:00';

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function getFallbackVideos(topic: string) {
    const videoDatabase: Record<string, any[]> = {
        programming: [
            { id: 'rfscVS0vtbw', title: 'Learn Python - Full Course for Beginners [Tutorial]', channel: 'freeCodeCamp.org', views: '40M', duration: '4:26:52', thumbnail: 'https://i.ytimg.com/vi/rfscVS0vtbw/hqdefault.jpg', isEducational: true },
            { id: 'PkZNo7MFNFg', title: 'Learn JavaScript - Full Course for Beginners', channel: 'freeCodeCamp.org', views: '25M', duration: '3:26:42', thumbnail: 'https://i.ytimg.com/vi/PkZNo7MFNFg/hqdefault.jpg', isEducational: true },
            { id: 'Mus_vwhTCq0', title: 'React Course - Beginner\'s Tutorial for React JavaScript Library', channel: 'freeCodeCamp.org', views: '8M', duration: '11:55:27', thumbnail: 'https://i.ytimg.com/vi/Mus_vwhTCq0/hqdefault.jpg', isEducational: true },
            { id: 'qz0aGYrrlhU', title: 'HTML Tutorial for Beginners: HTML Crash Course', channel: 'Programming with Mosh', views: '12M', duration: '1:00:41', thumbnail: 'https://i.ytimg.com/vi/qz0aGYrrlhU/hqdefault.jpg', isEducational: true },
            { id: 'Edsxf_NBFrw', title: 'Next.js 14 Full Course 2024 | Build and Deploy a Full Stack App', channel: 'JavaScript Mastery', views: '2M', duration: '9:03:15', thumbnail: 'https://i.ytimg.com/vi/Edsxf_NBFrw/hqdefault.jpg', isEducational: true },
            { id: 'RGOj5yH7evk', title: 'Git and GitHub for Beginners - Crash Course', channel: 'freeCodeCamp.org', views: '15M', duration: '1:08:41', thumbnail: 'https://i.ytimg.com/vi/RGOj5yH7evk/hqdefault.jpg', isEducational: true },
        ],
        'machine learning': [
            { id: 'aircAruvnKk', title: 'But what is a neural network? | Chapter 1, Deep learning', channel: '3Blue1Brown', views: '20M', duration: '19:13', thumbnail: 'https://i.ytimg.com/vi/aircAruvnKk/hqdefault.jpg', isEducational: true },
            { id: 'i_LwzRVP7bg', title: 'Machine Learning Course for Beginners', channel: 'freeCodeCamp.org', views: '5M', duration: '10:23:07', thumbnail: 'https://i.ytimg.com/vi/i_LwzRVP7bg/hqdefault.jpg', isEducational: true },
            { id: 'tPYj3fFJGjk', title: 'TensorFlow 2.0 Complete Course - Python Neural Networks', channel: 'freeCodeCamp.org', views: '4M', duration: '6:52:08', thumbnail: 'https://i.ytimg.com/vi/tPYj3fFJGjk/hqdefault.jpg', isEducational: true },
        ],
        'web development': [
            { id: 'G3e-cpL7ofc', title: 'HTML & CSS Full Course - Beginner to Pro', channel: 'SuperSimpleDev', views: '8M', duration: '6:31:04', thumbnail: 'https://i.ytimg.com/vi/G3e-cpL7ofc/hqdefault.jpg', isEducational: true },
            { id: 'nu_pCVPKzTk', title: 'Tailwind CSS Full Course for Beginners', channel: 'freeCodeCamp.org', views: '3M', duration: '3:09:30', thumbnail: 'https://i.ytimg.com/vi/nu_pCVPKzTk/hqdefault.jpg', isEducational: true },
            { id: 'mJgBOIoGihA', title: 'Node.js and Express.js - Full Course', channel: 'freeCodeCamp.org', views: '4M', duration: '8:16:47', thumbnail: 'https://i.ytimg.com/vi/mJgBOIoGihA/hqdefault.jpg', isEducational: true },
        ],
    };

    const lowerTopic = topic.toLowerCase();
    for (const [key, videos] of Object.entries(videoDatabase)) {
        if (lowerTopic.includes(key) || key.includes(lowerTopic)) {
            return videos;
        }
    }
    return videoDatabase.programming;
}
