'use client';

import { useState, useEffect } from 'react';
import { BarChart3, CheckCircle2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PollOption {
  id: string;
  text: string;
  votes: string[];
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  multiple_choice: boolean;
  anonymous: boolean;
  expires_at: string | null;
  created_at: string;
  creator: {
    full_name: string;
  };
}

export interface PollComponentProps {
  poll?: Poll;
  postId?: string;
  communityId?: string;
  userId?: string;
  onVote?: () => void;
}

export function PollComponent({ poll: initialPoll, postId, communityId, userId, onVote }: PollComponentProps) {
  const [poll, setPoll] = useState<Poll | null>(initialPoll || null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [voting, setVoting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(!initialPoll);

  // Fetch poll data if only postId is provided
  useEffect(() => {
    if (initialPoll) {
      setPoll(initialPoll);
      setLoading(false);
      return;
    }

    if (postId) {
      const fetchPoll = async () => {
        try {
          const res = await fetch(`/api/community-polls?postId=${postId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.poll) {
              setPoll(data.poll);
            }
          }
        } catch (error) {
          console.error('Error fetching poll:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchPoll();
    }
  }, [postId, initialPoll]);

  const totalVotes = poll?.options?.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0) || 0;
  const isExpired = poll?.expires_at ? new Date(poll.expires_at) < new Date() : false;

  useEffect(() => {
    if (!poll) return;

    // Check if user has already voted
    const checkVote = async () => {
      try {
        const res = await fetch(`/api/community-poll-votes?pollId=${poll.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.voted) {
            setHasVoted(true);
            setSelectedOption(data.optionId);
            setShowResults(true);
          }
        }
      } catch (error) {
        console.error('Error checking vote:', error);
      }
    };
    checkVote();
  }, [poll?.id]);

  const handleVote = async (optionId: string) => {
    if (!poll || (hasVoted && !poll.multiple_choice)) return;

    setVoting(true);
    try {
      const res = await fetch('/api/community-poll-votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId: poll.id, optionId })
      });

      if (res.ok) {
        setSelectedOption(optionId);
        setHasVoted(true);
        setShowResults(true);
        if (onVote) onVote();
      }
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setVoting(false);
    }
  };

  const getPercentage = (option: PollOption) => {
    if (totalVotes === 0) return 0;
    return Math.round(((option.votes?.length || 0) / totalVotes) * 100);
  };

  if (loading) {
    return (
      <div className="rounded-xl p-6 border border-accent-purple bg-accent-purple/10">
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-purple"></div>
        </div>
      </div>
    );
  }

  if (!poll) {
    return null;
  }

  return (
    <div className="rounded-xl p-6 border border-accent-purple bg-accent-purple/10">
      {/* Poll Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-accent-purple" />
          <span className="text-sm font-semibold text-accent-purple">Poll</span>
        </div>
        {poll.expires_at && !isExpired && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-4 h-4" />
            Ends {formatDistanceToNow(new Date(poll.expires_at), { addSuffix: true })}
          </div>
        )}
        {isExpired && (
          <span className="text-xs text-destructive font-semibold">Expired</span>
        )}
      </div>

      {/* Question */}
      <h3 className="text-lg font-semibold text-foreground mb-4">{poll.question}</h3>

      {/* Options */}
      <div className="space-y-3">
        {poll.options.map((option) => {
          const percentage = getPercentage(option);
          const isSelected = selectedOption === option.id;

          return (
            <button
              key={option.id}
              onClick={() => !isExpired && !showResults && handleVote(option.id)}
              disabled={voting || isExpired || showResults}
              className={`w-full text-left transition-all ${showResults
                  ? 'cursor-default'
                  : 'hover:bg-card hover:shadow-md cursor-pointer'
                } ${isSelected && showResults
                  ? 'bg-accent-purple/10 border-accent-purple'
                  : 'bg-card border-border'
                } rounded-lg border-2 p-4 relative overflow-hidden`}
            >
              {/* Progress Bar */}
              {showResults && (
                <div
                  className={`absolute inset-0 ${isSelected ? 'bg-primary' : 'bg-muted'
                    } transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              )}

              {/* Content */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isSelected && showResults && (
                    <CheckCircle2 className="w-5 h-5 text-accent-purple" />
                  )}
                  <span className="font-medium text-foreground">{option.text}</span>
                </div>
                {showResults && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-foreground/80">
                      {option.votes.length} {option.votes.length === 1 ? 'vote' : 'votes'}
                    </span>
                    <span className="text-lg font-semibold text-accent-purple">{percentage}%</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-accent-purple flex items-center justify-between text-sm">
        <span className="text-foreground/80">
          {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
        </span>
        {!showResults && hasVoted && !isExpired && (
          <button
            onClick={() => setShowResults(true)}
            className="text-accent-purple hover:text-accent-purple font-semibold"
          >
            View Results
          </button>
        )}
        {showResults && !hasVoted && !isExpired && (
          <button
            onClick={() => setShowResults(false)}
            className="text-accent-purple hover:text-accent-purple font-semibold"
          >
            Hide Results
          </button>
        )}
      </div>
    </div>
  );
}
