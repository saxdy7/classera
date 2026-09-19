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
    <div className="group bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] overflow-hidden border border-[var(--cl-hairline)] hover:border-[var(--cl-error)] transition-all duration-300 hover:-translate-y-1 cursor-pointer">
      {/* Thumbnail Section */}
      <div 
        className="relative h-48 bg-[var(--cl-surface-inverse)] overflow-hidden"
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
          <div className="w-full h-full flex items-center justify-center bg-[var(--cl-error)]">
            <Play className="w-16 h-16 text-[var(--cl-on-dark)]" />
          </div>
        )}
        
        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-16 h-16 bg-[var(--cl-surface-card)] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <Play className="w-8 h-8 text-[var(--cl-error)] fill-[var(--cl-error)]" />
          </div>
        </div>

        {/* Duration Badge */}
        <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/80 backdrop-blur-sm text-[var(--cl-on-dark)] text-xs font-semibold rounded">
          {video.duration}
        </div>

        {/* HD Badge */}
        <div className="absolute top-3 left-3 px-2 py-1 bg-black/80 backdrop-blur-sm text-[var(--cl-on-dark)] text-xs font-semibold rounded">
          HD
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5">
        {/* Title */}
        <h3 className="text-base font-semibold text-[var(--cl-ink)] mb-2 line-clamp-2 group-hover:text-[var(--cl-error)] transition-colors">
          {video.title}
        </h3>

        {/* Channel Info */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-[var(--cl-error)]">
            <span className="text-[var(--cl-on-dark)] text-xs font-semibold">
              {video.channel.charAt(0)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--cl-ink)] truncate">{video.channel}</p>
            <p className="text-xs text-[var(--cl-muted)]">✓ Verified</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-4 mb-4 text-sm text-[var(--cl-body)]">
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
          <p className="text-xs text-[var(--cl-muted)] mb-4">
            📅 {video.uploadDate}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onPlay(video.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-[var(--cl-on-dark)] font-semibold rounded-[var(--cl-r-lg)] hover:scale-105 transition-all bg-[var(--cl-error)]"
          >
            <Play className="w-4 h-4 fill-white" />
            Watch
          </button>
          <button className="w-10 h-10 flex items-center justify-center bg-[var(--cl-surface-strong)] hover:bg-[var(--cl-surface-strong)] text-[var(--cl-body)] rounded-[var(--cl-r-lg)] transition-colors">
            <BookmarkPlus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
