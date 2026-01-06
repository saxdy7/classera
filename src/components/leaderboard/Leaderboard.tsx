'use client';

import React, { useEffect, useState } from 'react';
import { Trophy, Medal, TrendingUp, Award, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface LeaderboardEntry {
  id: string;
  full_name: string;
  avatar_url: string | null;
  degree_type: string | null;
  current_semester: number | null;
  total_tests: number;
  avg_percentage: number;
}

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'all_time' | 'monthly' | 'weekly'>('all_time');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [period]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/leaderboard?period=${period}&limit=50`);
      const data = await response.json();
      setLeaderboard(data.leaderboard || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-700" />;
      default:
        return <div className="w-6 h-6 flex items-center justify-center font-bold text-gray-600">{rank}</div>;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500';
    if (rank === 3) return 'bg-gradient-to-r from-amber-600 to-amber-800';
    return 'bg-gradient-to-r from-purple-500 to-pink-500';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          <div className="flex space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Leaderboard
          </h1>
          <p className="text-gray-600 mt-1">Top performers in your university</p>
        </div>

        {/* Period Filter */}
        <div className="flex space-x-2">
          <Button
            variant={period === 'weekly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('weekly')}
          >
            This Week
          </Button>
          <Button
            variant={period === 'monthly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('monthly')}
          >
            This Month
          </Button>
          <Button
            variant={period === 'all_time' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('all_time')}
          >
            All Time
          </Button>
        </div>
      </div>

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* 2nd Place */}
          <Card className="p-6 text-center transform translate-y-4">
            <div className="relative inline-block mb-4">
              <Avatar className="w-20 h-20 mx-auto ring-4 ring-gray-300">
                {leaderboard[1].avatar_url ? (
                  <img src={leaderboard[1].avatar_url} alt={leaderboard[1].full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-2xl font-bold">
                    {leaderboard[1].full_name.charAt(0)}
                  </div>
                )}
              </Avatar>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gray-400 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-lg">
                2
              </div>
            </div>
            <h3 className="font-bold text-lg mb-1">{leaderboard[1].full_name}</h3>
            <p className="text-2xl font-bold text-gray-600 mb-2">{leaderboard[1].avg_percentage.toFixed(1)}%</p>
            <p className="text-sm text-gray-500">{leaderboard[1].total_tests} tests</p>
          </Card>

          {/* 1st Place */}
          <Card className="p-6 text-center bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-400">
            <div className="relative inline-block mb-4">
              <Avatar className="w-24 h-24 mx-auto ring-4 ring-yellow-400">
                {leaderboard[0].avatar_url ? (
                  <img src={leaderboard[0].avatar_url} alt={leaderboard[0].full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white text-2xl font-bold">
                    {leaderboard[0].full_name.charAt(0)}
                  </div>
                )}
              </Avatar>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold shadow-lg">
                <Trophy className="w-5 h-5" />
              </div>
            </div>
            <h3 className="font-bold text-xl mb-1">{leaderboard[0].full_name}</h3>
            <p className="text-3xl font-bold text-yellow-600 mb-2">{leaderboard[0].avg_percentage.toFixed(1)}%</p>
            <p className="text-sm text-gray-600">{leaderboard[0].total_tests} tests</p>
            <div className="mt-3 inline-flex items-center space-x-1 bg-yellow-100 px-3 py-1 rounded-full">
              <Star className="w-4 h-4 text-yellow-600 fill-yellow-600" />
              <span className="text-sm font-medium text-yellow-700">Top Performer</span>
            </div>
          </Card>

          {/* 3rd Place */}
          <Card className="p-6 text-center transform translate-y-4">
            <div className="relative inline-block mb-4">
              <Avatar className="w-20 h-20 mx-auto ring-4 ring-amber-700">
                {leaderboard[2].avatar_url ? (
                  <img src={leaderboard[2].avatar_url} alt={leaderboard[2].full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-white text-2xl font-bold">
                    {leaderboard[2].full_name.charAt(0)}
                  </div>
                )}
              </Avatar>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-amber-700 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-lg">
                3
              </div>
            </div>
            <h3 className="font-bold text-lg mb-1">{leaderboard[2].full_name}</h3>
            <p className="text-2xl font-bold text-amber-700 mb-2">{leaderboard[2].avg_percentage.toFixed(1)}%</p>
            <p className="text-sm text-gray-500">{leaderboard[2].total_tests} tests</p>
          </Card>
        </div>
      )}

      {/* Full Leaderboard List */}
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-gray-900 mb-4">All Rankings</h2>
        {leaderboard.map((entry, index) => (
          <Card
            key={entry.id}
            className={`p-4 ${
              index < 3 ? 'border-2' : ''
            } ${
              index === 0 ? 'border-yellow-400 bg-yellow-50' : 
              index === 1 ? 'border-gray-300 bg-gray-50' : 
              index === 2 ? 'border-amber-600 bg-amber-50' : ''
            }`}
          >
            <div className="flex items-center space-x-4">
              {/* Rank */}
              <div className="flex-shrink-0 w-12 flex justify-center">
                {getRankIcon(index + 1)}
              </div>

              {/* Avatar */}
              <Avatar className="w-12 h-12">
                {entry.avatar_url ? (
                  <img src={entry.avatar_url} alt={entry.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full ${getRankBadge(index + 1)} flex items-center justify-center text-white font-bold`}>
                    {entry.full_name.charAt(0)}
                  </div>
                )}
              </Avatar>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{entry.full_name}</h3>
                <p className="text-sm text-gray-600">
                  {entry.degree_type} • Sem {entry.current_semester}
                </p>
              </div>

              {/* Stats */}
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {entry.avg_percentage.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">{entry.total_tests} tests</div>
              </div>

              {/* Trend Icon */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {leaderboard.length === 0 && (
        <div className="text-center py-12">
          <Award className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg">No leaderboard data yet</p>
          <p className="text-gray-400 text-sm mt-2">
            Complete tests to appear on the leaderboard
          </p>
        </div>
      )}
    </div>
  );
}
