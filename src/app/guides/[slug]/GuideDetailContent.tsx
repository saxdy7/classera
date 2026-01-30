'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Calendar } from 'lucide-react';

export function GuideDetailContent() {
    const params = useParams();
    const router = useRouter();
    const [guide, setGuide] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.slug) {
            fetchGuide();
        }
    }, [params.slug]);

    const fetchGuide = async () => {
        try {
            const response = await fetch('/api/guides');
            const data = await response.json();
            const found = data.guides?.find((g: any) => g.slug === params.slug);
            setGuide(found);
        } catch (error) {
            console.error('Error fetching guide:', error);
        } finally {
            setLoading(false);
        }
    };

    const getReadingTime = (content: string) => {
        const words = content.split(/\s+/).length;
        const minutes = Math.ceil(words / 200);
        return `${minutes} min read`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!guide) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Guide Not Found</h2>
                <Button onClick={() => router.push('/guides')}>Back to Guides</Button>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8">
            <Button
                variant="ghost"
                onClick={() => router.push('/guides')}
                className="mb-4"
            >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Guides
            </Button>

            <div className="mb-6">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    {guide.title}
                </h1>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                    {guide.difficulty && (
                        <Badge>{guide.difficulty}</Badge>
                    )}
                    {guide.category && (
                        <Badge variant="secondary">{guide.category}</Badge>
                    )}
                    <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{getReadingTime(guide.content)}</span>
                    </div>
                    {guide.created_at && (
                        <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(guide.created_at).toLocaleDateString()}</span>
                        </div>
                    )}
                </div>
            </div>

            <Card className="p-8">
                <div className="prose prose-lg max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: guide.content.replace(/\n/g, '<br/>') }} />
                </div>
            </Card>

            {guide.video_url && (
                <Card className="p-6 mt-6">
                    <h3 className="text-lg font-semibold mb-4">Video Tutorial</h3>
                    <div className="aspect-video">
                        <iframe
                            src={guide.video_url}
                            className="w-full h-full rounded-lg"
                            allowFullScreen
                        ></iframe>
                    </div>
                </Card>
            )}

            {guide.tags && guide.tags.length > 0 && (
                <Card className="p-6 mt-6">
                    <h3 className="font-semibold mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                        {guide.tags.map((tag: string, idx: number) => (
                            <Badge key={idx} variant="outline">{tag}</Badge>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}
