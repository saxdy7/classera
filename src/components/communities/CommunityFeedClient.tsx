'use client';

import { useState } from 'react';
import { CommunityFeed } from './CommunityFeed';
import { CreatePostModal } from './CreatePostModal';
import { CommunitySidebar } from './CommunitySidebar';
import { CommunityRightSidebar } from './CommunityRightSidebar';
import { Plus } from 'lucide-react';

interface CommunityFeedClientProps {
  communityId: string;
  userId: string;
  userRole: 'student' | 'mentor';
  isMentor: boolean;
}

export function CommunityFeedClient({ communityId, userId, userRole, isMentor }: CommunityFeedClientProps) {
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [sidebarFilter, setSidebarFilter] = useState<string>('all');

  const handlePostCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div>
      {/* Create Post Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowCreatePost(true)}
          className="w-full px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl text-left hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
              <Plus className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <span className="text-slate-500 group-hover:text-indigo-600 transition-colors">
                What's on your mind? Share with the community...
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Sidebar */}
        <div className="col-span-12 lg:col-span-3">
          <CommunitySidebar
            communityId={communityId}
            activeFilter={sidebarFilter}
            onFilterChange={setSidebarFilter}
          />
        </div>

        {/* Main Feed */}
        <div className="col-span-12 lg:col-span-6">
          <CommunityFeed
            key={refreshTrigger}
            communityId={communityId}
            userId={userId}
            userRole={userRole}
            isMentor={isMentor}
            activeFilter={sidebarFilter}
          />
        </div>

        {/* Right Sidebar */}
        <div className="col-span-12 lg:col-span-3">
          <CommunityRightSidebar communityId={communityId} userId={userId} />
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <CreatePostModal
          communityId={communityId}
          userId={userId}
          userRole={userRole}
          onClose={() => setShowCreatePost(false)}
          onSuccess={handlePostCreated}
        />
      )}
    </div>
  );
}
