import React from 'react';

export function CardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 rounded-lg p-6">
        <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
        <div className="h-3 bg-gray-300 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-gray-300 rounded w-2/3"></div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex space-x-4 mb-4">
        <div className="h-4 bg-gray-300 rounded w-1/4"></div>
        <div className="h-4 bg-gray-300 rounded w-1/4"></div>
        <div className="h-4 bg-gray-300 rounded w-1/4"></div>
        <div className="h-4 bg-gray-300 rounded w-1/4"></div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-4 bg-gray-100 rounded-lg">
          <div className="w-12 h-12 bg-gray-300 rounded-full flex-shrink-0"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center space-x-6 mb-8">
        <div className="w-24 h-24 bg-gray-300 rounded-full"></div>
        <div className="flex-1">
          <div className="h-6 bg-gray-300 rounded w-1/3 mb-3"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-2/3"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-lg p-6">
            <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>
            <div className="h-3 bg-gray-300 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-5/6"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CourseSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 rounded-lg overflow-hidden">
        <div className="h-48 bg-gray-300"></div>
        <div className="p-6">
          <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-5/6 mb-4"></div>
          <div className="flex items-center justify-between">
            <div className="h-8 bg-gray-300 rounded w-24"></div>
            <div className="h-8 bg-gray-300 rounded w-32"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MessageSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'} animate-pulse`}
        >
          <div
            className={`flex items-start space-x-2 max-w-md ${
              i % 2 === 0 ? 'flex-row' : 'flex-row-reverse space-x-reverse'
            }`}
          >
            <div className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0"></div>
            <div className="flex-1">
              <div
                className={`p-3 rounded-lg ${
                  i % 2 === 0 ? 'bg-gray-200' : 'bg-purple-200'
                }`}
              >
                <div className="h-3 bg-gray-300 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-48"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TestCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="h-5 bg-gray-300 rounded w-3/4 mb-3"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
          </div>
          <div className="w-16 h-8 bg-gray-300 rounded"></div>
        </div>

        <div className="flex items-center space-x-6 mb-4">
          <div className="h-3 bg-gray-300 rounded w-20"></div>
          <div className="h-3 bg-gray-300 rounded w-24"></div>
          <div className="h-3 bg-gray-300 rounded w-16"></div>
        </div>

        <div className="flex space-x-3">
          <div className="h-10 bg-gray-300 rounded flex-1"></div>
          <div className="h-10 bg-gray-300 rounded w-24"></div>
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="animate-pulse mb-8">
        <div className="h-8 bg-gray-300 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-1/4"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg p-6">
              <div className="h-4 bg-gray-300 rounded w-2/3 mb-4"></div>
              <div className="h-8 bg-gray-300 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-64"></div>
          </div>
          <div className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-48"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CommunityCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 rounded-lg p-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
          <div className="flex-1">
            <div className="h-5 bg-gray-300 rounded w-2/3 mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
        <div className="h-3 bg-gray-300 rounded w-full mb-2"></div>
        <div className="h-3 bg-gray-300 rounded w-4/5 mb-4"></div>
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-300 rounded w-24"></div>
          <div className="h-8 bg-gray-300 rounded w-20"></div>
        </div>
      </div>
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 rounded-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 bg-gray-300 rounded w-32"></div>
          <div className="flex space-x-2">
            <div className="h-8 bg-gray-300 rounded w-16"></div>
            <div className="h-8 bg-gray-300 rounded w-8"></div>
            <div className="h-8 bg-gray-300 rounded w-8"></div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-8 bg-gray-300 rounded"></div>
          ))}
          {/* Days */}
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-300 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 rounded-lg p-6">
        <div className="h-6 bg-gray-300 rounded w-1/3 mb-6"></div>
        <div className="h-64 bg-gray-300 rounded"></div>
      </div>
    </div>
  );
}
