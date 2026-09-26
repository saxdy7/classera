'use client';

import { useState, useEffect } from 'react';
import { Search, Play, Sparkles, X, Fullscreen, MessageSquare, List } from 'lucide-react';
import { VideoCard } from './VideoCard';
import { motion, AnimatePresence } from 'framer-motion';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channel: string;
  views: string;
  duration: string;
  uploadDate: string;
  description?: string;
}

const TOPICS = [
  { name: 'Programming Basics', color: '' },
  { name: 'Web Development', color: '' },
  { name: 'Python', color: '' },
  { name: 'JavaScript', color: '' },
  { name: 'React', color: '' },
  { name: 'Machine Learning', color: '' },
  { name: 'Data Science', color: '' },
  { name: 'DevOps', color: '' },
];

export function YouTubeVideosTab() {
  const [selectedTopic, setSelectedTopic] = useState('Programming Basics');
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);

  useEffect(() => {
    fetchVideos(selectedTopic);
  }, [selectedTopic]);

  const fetchVideos = async (topic: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/courses/youtube?topic=${encodeURIComponent(topic)}`);
      const data = await response.json();
      
      const formattedVideos: Video[] = (data.videos || []).map((video: any) => ({
        id: video.id,
        title: video.title,
        thumbnail: video.thumbnail,
        channel: video.channel || 'YouTube',
        views: video.views || '0',
        duration: video.duration || '10:00',
        uploadDate: video.publishedAt ? new Date(video.publishedAt).toLocaleDateString() : 'Recently',
        description: video.description
      }));
      
      setVideos(formattedVideos);
    } catch (error) {
      console.error('Error fetching videos:', error);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTopicClick = (topic: string) => {
    setSelectedTopic(topic);
    setSearchQuery('');
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/courses/youtube?query=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      const formattedVideos: Video[] = (data.videos || []).map((video: any) => ({
        id: video.id,
        title: video.title,
        thumbnail: video.thumbnail,
        channel: video.channel || 'YouTube',
        views: video.views || '0',
        duration: video.duration || '10:00',
        uploadDate: video.publishedAt ? new Date(video.publishedAt).toLocaleDateString() : 'Recently',
        description: video.description
      }));
      
      setVideos(formattedVideos);
    } catch (error) {
      console.error('Error searching videos:', error);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (videoId: string) => {
    const video = videos.find(v => v.id === videoId);
    if (video) setActiveVideo(video);
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/70" />
        <input
          type="text"
          placeholder="Search for specific video tutorials..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && searchQuery.trim()) {
              handleSearch();
            }
          }}
          className="w-full pl-12 pr-32 py-3 border-2 border-border rounded-lg focus:outline-none focus:border-destructive transition-colors"
        />
        <button
          onClick={handleSearch}
          disabled={loading || !searchQuery.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 rounded-lg font-semibold text-white transition-all disabled:opacity-50 flex items-center gap-2 bg-destructive"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Search
            </>
          )}
        </button>
      </div>

      {/* Topic Pills */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-accent-purple" />
          <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-wide">Popular Topics</h3>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {TOPICS.map((topic) => (
            <button
              key={topic.name}
              onClick={() => handleTopicClick(topic.name)}
              className={`px-5 py-2.5 rounded-full font-medium transition-all ${
                selectedTopic === topic.name
                  ? ` ${topic.color} text-white shadow-${topic.color.split('-')[1]}-500/30 scale-105`
                  : 'bg-muted text-foreground/80 hover:bg-muted'
              }`}
            >
              {topic.name}
            </button>
          ))}
        </div>
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-foreground/80">
          {searchQuery ? (
            <>Search results for <span className="font-semibold text-foreground">"{searchQuery}"</span></>
          ) : (
            <>Showing tutorials for <span className="font-semibold text-foreground">{selectedTopic}</span></>
          )}
        </p>
        <p className="text-sm text-muted-foreground">{videos.length} videos</p>
      </div>

      {/* Videos Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-muted rounded-xl h-80 animate-pulse"></div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-12">
          <Play className="w-16 h-16 text-muted-foreground/70 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">No videos found. Try another topic or search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onPlay={handlePlay}
            />
          ))}
        </div>
      )}

      {/* Video Player Modal */}
      <AnimatePresence>
        {activeVideo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
          >
            <div 
              className="absolute inset-0 bg-card backdrop-blur-md"
              onClick={() => setActiveVideo(null)}
            />
            
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-6xl aspect-video bg-black rounded-xl overflow-hidden border border-[rgba(255,255,255,0.1)]"
            >
              <button 
                onClick={() => setActiveVideo(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-card hover:bg-destructive text-white rounded-full transition-all group"
              >
                <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
              </button>
              
              <iframe 
                src={`https://www.youtube.com/embed/${activeVideo.id}?autoplay=1&rel=0`}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
              />
              
              <div className="absolute bottom-0 inset-x-0 p-6 pointer-events-none bg-neutral-900">
                <div className="max-w-4xl">
                  <h2 className="text-xl md:text-2xl font-semibold text-white mb-2">{activeVideo.title}</h2>
                  <div className="flex items-center gap-4 text-xs md:text-sm text-muted-foreground/70">
                    <span className="font-semibold text-destructive">{activeVideo.channel}</span>
                    <span className="w-1 h-1 bg-muted rounded-full" />
                    <span>{activeVideo.views} views</span>
                    <span className="w-1 h-1 bg-muted rounded-full" />
                    <span>{activeVideo.uploadDate}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
