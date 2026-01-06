'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, CheckCircle, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface PollOption {
  id: string;
  text: string;
  votes: string[];
}

interface Poll {
  id: string;
  community_id: string;
  channel_id: string | null;
  created_by: string;
  question: string;
  options: PollOption[];
  multiple_choice: boolean;
  anonymous: boolean;
  expires_at: string | null;
  created_at: string;
  creator: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  poll_votes: Array<{
    user_id: string;
    option_id: string;
  }>;
}

interface PollCardProps {
  poll: Poll;
  currentUserId: string;
  onVote: (pollId: string, optionId: string) => void;
  onDelete?: (pollId: string) => void;
}

export function PollCard({ poll, currentUserId, onVote, onDelete }: PollCardProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    // Check if user has already voted
    const userVotes = poll.poll_votes
      .filter((v) => v.user_id === currentUserId)
      .map((v) => v.option_id);

    if (userVotes.length > 0) {
      setSelectedOptions(userVotes);
      setHasVoted(true);
    }
  }, [poll.poll_votes, currentUserId]);

  const totalVotes = poll.poll_votes.length;
  const isExpired = poll.expires_at && new Date(poll.expires_at) < new Date();
  const isCreator = poll.created_by === currentUserId;

  const getVoteCount = (optionId: string) => {
    return poll.poll_votes.filter((v) => v.option_id === optionId).length;
  };

  const getVotePercentage = (optionId: string) => {
    if (totalVotes === 0) return 0;
    return Math.round((getVoteCount(optionId) / totalVotes) * 100);
  };

  const handleOptionClick = (optionId: string) => {
    if (isExpired || hasVoted) return;

    if (poll.multiple_choice) {
      setSelectedOptions((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const handleVote = async () => {
    for (const optionId of selectedOptions) {
      await onVote(poll.id, optionId);
    }
    setHasVoted(true);
  };

  const userHasVotedForOption = (optionId: string) => {
    return selectedOptions.includes(optionId);
  };

  return (
    <Card className="p-6">
      {/* Poll Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3 flex-1">
          <Avatar className="w-10 h-10">
            {poll.creator.avatar_url ? (
              <img src={poll.creator.avatar_url} alt={poll.creator.full_name} />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                {poll.creator.full_name.charAt(0)}
              </div>
            )}
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-900">
                {poll.creator.full_name}
              </span>
              <span className="text-sm text-gray-500">created a poll</span>
            </div>
            <p className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(poll.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>

        {isCreator && onDelete && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(poll.id)}
            className="text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Question */}
      <div className="mb-4">
        <div className="flex items-start space-x-2 mb-2">
          <BarChart3 className="w-5 h-5 text-purple-600 mt-0.5" />
          <h3 className="text-lg font-semibold text-gray-900">{poll.question}</h3>
        </div>

        {/* Poll Info */}
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          {poll.multiple_choice && (
            <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
              Multiple Choice
            </span>
          )}
          {poll.anonymous && (
            <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
              Anonymous
            </span>
          )}
          {poll.expires_at && (
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>
                {isExpired
                  ? 'Expired'
                  : `Ends ${formatDistanceToNow(new Date(poll.expires_at), {
                      addSuffix: true,
                    })}`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Options */}
      <div className="space-y-2 mb-4">
        {poll.options.map((option) => {
          const voteCount = getVoteCount(option.id);
          const percentage = getVotePercentage(option.id);
          const isSelected = userHasVotedForOption(option.id);

          return (
            <button
              key={option.id}
              onClick={() => handleOptionClick(option.id)}
              disabled={isExpired || hasVoted}
              className={`w-full text-left transition-all ${
                isExpired || hasVoted
                  ? 'cursor-default'
                  : 'cursor-pointer hover:bg-gray-50'
              }`}
            >
              <div className="relative p-3 border rounded-lg overflow-hidden">
                {/* Vote Bar */}
                {(hasVoted || isExpired) && (
                  <div
                    className="absolute inset-0 bg-purple-100 transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                )}

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-2 flex-1">
                    {isSelected && (hasVoted || isExpired) && (
                      <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0" />
                    )}
                    {!hasVoted && !isExpired && (
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                          isSelected
                            ? 'border-purple-600 bg-purple-600'
                            : 'border-gray-300'
                        }`}
                      >
                        {isSelected && (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full" />
                          </div>
                        )}
                      </div>
                    )}
                    <span className="font-medium text-gray-900">{option.text}</span>
                  </div>

                  {(hasVoted || isExpired) && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{voteCount}</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {percentage}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Vote Button / Results */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
        </div>

        {!hasVoted && !isExpired && selectedOptions.length > 0 && (
          <Button onClick={handleVote} size="sm">
            Vote
          </Button>
        )}
      </div>
    </Card>
  );
}

interface PollListProps {
  communityId: string;
  channelId?: string;
  currentUserId: string;
}

export default function PollList({ communityId, channelId, currentUserId }: PollListProps) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPolls();
  }, [communityId, channelId]);

  const fetchPolls = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ community_id: communityId });
      if (channelId) params.append('channel_id', channelId);

      const response = await fetch(`/api/community-polls?${params}`);
      const data = await response.json();
      setPolls(data.polls || []);
    } catch (error) {
      console.error('Error fetching polls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (pollId: string, optionId: string) => {
    try {
      await fetch('/api/community-polls/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poll_id: pollId, option_id: optionId }),
      });
      await fetchPolls();
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleDelete = async (pollId: string) => {
    if (!confirm('Are you sure you want to delete this poll?')) return;

    try {
      await fetch(`/api/community-polls?id=${pollId}`, {
        method: 'DELETE',
      });
      await fetchPolls();
    } catch (error) {
      console.error('Error deleting poll:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (polls.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {polls.map((poll) => (
        <PollCard
          key={poll.id}
          poll={poll}
          currentUserId={currentUserId}
          onVote={handleVote}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
