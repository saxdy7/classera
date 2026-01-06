'use client';

import { Play, Eye, ThumbsUp, Clock, BookmarkPlus } from 'lucide-react';
import Image from 'next/image';

interface Video {
  id: string;
  title: string;
  channel: string;
  views: string;
  duration: string;
  thumbnail: string;
  uploadDate?: string;
  likes?: string;
}

interface VideoCardProps {
  video: Video;
  onPlay: (videoId: string) => void;
}

export function VideoCard({ video, onPlay }: VideoCardProps) {
  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-slate-200 hover:shadow-xl hover:border-red-200 transition-all duration-300 hover:-translate-y-1 cursor-pointer">
      {/* Thumbnail Section */}
      <div 
        className="relative h-48 bg-slate-900 overflow-hidden"
        onClick={() => onPlay(video.id)}
      >
        {video.thumbnail ? (
          <Image
            src={video.thumbnail}
            alt={video.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500 to-rose-600">
            <Play className="w-16 h-16 text-white" />
          </div>
        )}
        
        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <Play className="w-8 h-8 text-red-500 fill-red-500" />
          </div>
        </div>

        {/* Duration Badge */}
        <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/80 backdrop-blur-sm text-white text-xs font-semibold rounded">
          {video.duration}
        </div>

        {/* HD Badge */}
        <div className="absolute top-3 left-3 px-2 py-1 bg-black/80 backdrop-blur-sm text-white text-xs font-semibold rounded">
          HD
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5">
        {/* Title */}
        <h3 className="text-base font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-red-600 transition-colors">
          {video.title}
        </h3>

        {/* Channel Info */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {video.channel.charAt(0)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{video.channel}</p>
            <p className="text-xs text-slate-500">✓ Verified</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-4 mb-4 text-sm text-slate-600">
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>{video.views} views</span>
          </div>
          {video.likes && (
            <div className="flex items-center gap-1">
              <ThumbsUp className="w-4 h-4" />
              <span>{video.likes}</span>
            </div>
          )}
        </div>

        {/* Upload Date */}
        {video.uploadDate && (
          <p className="text-xs text-slate-500 mb-4">
            📅 {video.uploadDate}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onPlay(video.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-rose-500 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all"
          >
            <Play className="w-4 h-4 fill-white" />
            Watch
          </button>
          <button className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors">
            <BookmarkPlus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
