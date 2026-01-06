'use client';

import { useState, useEffect } from 'react';
import { Search, Play, Sparkles } from 'lucide-react';
import { VideoCard } from './VideoCard';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channel: string;
  views: string;
  duration: string;
  uploadDate: string;
}

const TOPICS = [
  { name: 'Programming Basics', color: 'from-blue-500 to-cyan-500' },
  { name: 'Web Development', color: 'from-purple-500 to-pink-500' },
  { name: 'Python', color: 'from-green-500 to-emerald-500' },
  { name: 'JavaScript', color: 'from-yellow-500 to-orange-500' },
  { name: 'React', color: 'from-cyan-500 to-blue-500' },
  { name: 'Machine Learning', color: 'from-fuchsia-500 to-purple-500' },
  { name: 'Data Science', color: 'from-indigo-500 to-purple-500' },
  { name: 'DevOps', color: 'from-orange-500 to-red-500' },
];

export function YouTubeVideosTab() {
  const [selectedTopic, setSelectedTopic] = useState('Programming Basics');
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
        uploadDate: video.uploadDate || 'Recently',
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
        uploadDate: video.uploadDate || 'Recently',
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
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
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
          className="w-full pl-12 pr-32 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-red-500 transition-colors"
        />
        <button
          onClick={handleSearch}
          disabled={loading || !searchQuery.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 rounded-lg font-semibold bg-gradient-to-r from-red-500 to-rose-500 text-white hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
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
          <Sparkles className="w-5 h-5 text-purple-500" />
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Popular Topics</h3>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {TOPICS.map((topic) => (
            <button
              key={topic.name}
              onClick={() => handleTopicClick(topic.name)}
              className={`px-5 py-2.5 rounded-full font-medium transition-all ${
                selectedTopic === topic.name
                  ? `bg-gradient-to-r ${topic.color} text-white shadow-lg shadow-${topic.color.split('-')[1]}-500/30 scale-105`
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {topic.name}
            </button>
          ))}
        </div>
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          {searchQuery ? (
            <>Search results for <span className="font-semibold text-slate-900">"{searchQuery}"</span></>
          ) : (
            <>Showing tutorials for <span className="font-semibold text-slate-900">{selectedTopic}</span></>
          )}
        </p>
        <p className="text-sm text-slate-500">{videos.length} videos</p>
      </div>

      {/* Videos Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-slate-200 rounded-2xl h-80 animate-pulse"></div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-12">
          <Play className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg">No videos found. Try another topic or search query.</p>
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
    </div>
  );
}
