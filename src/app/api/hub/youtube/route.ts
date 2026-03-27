import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || 'programming courses';
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ error: 'YouTube API key not configured' }, { status: 500 });
    }

    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=12&key=${apiKey}`
        );
        const data = await response.json();

        if (data.error) {
            return NextResponse.json({ error: data.error.message }, { status: data.error.code });
        }

        const videos = data.items.map((item: any) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.high.url,
            channelTitle: item.snippet.channelTitle,
            publishedAt: item.snippet.publishedAt,
        }));

        return NextResponse.json(videos);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
