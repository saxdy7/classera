import { NextResponse } from 'next/server';

// This API returns curated top YouTube educational videos
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const topic = searchParams.get('topic') || 'programming';

        const videos = getCuratedVideos(topic);

        return NextResponse.json({ videos });
    } catch (error) {
        console.error('Error fetching videos:', error);
        return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
    }
}

function getCuratedVideos(topic: string) {
    // Curated list of top educational YouTube videos
    const videoDatabase: Record<string, any[]> = {
        programming: [
            {
                id: 'rfscVS0vtbw',
                title: 'Learn Python - Full Course for Beginners',
                channel: 'freeCodeCamp.org',
                views: '40M',
                duration: '4:26:52',
                thumbnail: `https://i.ytimg.com/vi/rfscVS0vtbw/mqdefault.jpg`,
            },
            {
                id: 'PkZNo7MFNFg',
                title: 'Learn JavaScript - Full Course for Beginners',
                channel: 'freeCodeCamp.org',
                views: '25M',
                duration: '3:26:42',
                thumbnail: `https://i.ytimg.com/vi/PkZNo7MFNFg/mqdefault.jpg`,
            },
            {
                id: 'Mus_vwhTCq0',
                title: 'React Course - Beginner\'s Tutorial',
                channel: 'freeCodeCamp.org',
                views: '8M',
                duration: '11:55:27',
                thumbnail: `https://i.ytimg.com/vi/Mus_vwhTCq0/mqdefault.jpg`,
            },
            {
                id: 'qz0aGYrrlhU',
                title: 'HTML Tutorial for Beginners',
                channel: 'Programming with Mosh',
                views: '12M',
                duration: '1:00:41',
                thumbnail: `https://i.ytimg.com/vi/qz0aGYrrlhU/mqdefault.jpg`,
            },
            {
                id: 'Edsxf_NBFrw',
                title: 'Next.js 14 Full Course 2024',
                channel: 'JavaScript Mastery',
                views: '2M',
                duration: '9:03:15',
                thumbnail: `https://i.ytimg.com/vi/Edsxf_NBFrw/mqdefault.jpg`,
            },
            {
                id: 'RGOj5yH7evk',
                title: 'Git and GitHub for Beginners',
                channel: 'freeCodeCamp.org',
                views: '15M',
                duration: '1:08:41',
                thumbnail: `https://i.ytimg.com/vi/RGOj5yH7evk/mqdefault.jpg`,
            },
        ],
        'machine-learning': [
            {
                id: 'aircAruvnKk',
                title: 'But what is a neural network?',
                channel: '3Blue1Brown',
                views: '20M',
                duration: '19:13',
                thumbnail: `https://i.ytimg.com/vi/aircAruvnKk/mqdefault.jpg`,
            },
            {
                id: 'i_LwzRVP7bg',
                title: 'Machine Learning Course for Beginners',
                channel: 'freeCodeCamp.org',
                views: '5M',
                duration: '10:23:07',
                thumbnail: `https://i.ytimg.com/vi/i_LwzRVP7bg/mqdefault.jpg`,
            },
        ],
        'web-development': [
            {
                id: 'G3e-cpL7ofc',
                title: 'HTML & CSS Full Course',
                channel: 'SuperSimpleDev',
                views: '8M',
                duration: '6:31:04',
                thumbnail: `https://i.ytimg.com/vi/G3e-cpL7ofc/mqdefault.jpg`,
            },
            {
                id: 'nu_pCVPKzTk',
                title: 'Tailwind CSS Full Course',
                channel: 'freeCodeCamp.org',
                views: '3M',
                duration: '3:09:30',
                thumbnail: `https://i.ytimg.com/vi/nu_pCVPKzTk/mqdefault.jpg`,
            },
        ],
    };

    return videoDatabase[topic] || videoDatabase.programming;
}
