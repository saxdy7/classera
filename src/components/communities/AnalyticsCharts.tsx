"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Calendar } from "lucide-react";

interface AnalyticsChartsProps {
  communityId: string;
}

export function AnalyticsCharts({ communityId }: AnalyticsChartsProps) {
  const [activityData, setActivityData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivityData();
  }, [communityId]);

  const fetchActivityData = async () => {
    try {
      const response = await fetch(`/api/community-analytics?communityId=${communityId}`);
      const data = await response.json();
      setActivityData(data.activityData || []);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] border border-[var(--cl-hairline)] p-12 mb-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[var(--cl-surface-strong)] rounded w-1/4"></div>
          <div className="h-64 bg-[var(--cl-surface-strong)] rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] border border-[var(--cl-hairline)] p-6 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="w-5 h-5 text-[var(--cl-primary)]" />
        <h2 className="text-xl font-semibold text-[var(--cl-ink)]">Activity Over Time (Last 30 Days)</h2>
      </div>

      {activityData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={activityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
              }}
            />
            <Line
              type="monotone"
              dataKey="posts"
              stroke="#6366f1"
              strokeWidth={2}
              name="Posts"
              dot={{ fill: "#6366f1", r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="comments"
              stroke="#10b981"
              strokeWidth={2}
              name="Comments"
              dot={{ fill: "#10b981", r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="likes"
              stroke="#f59e0b"
              strokeWidth={2}
              name="Likes"
              dot={{ fill: "#f59e0b", r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-64 flex items-center justify-center text-[var(--cl-body)]">
          Not enough data to display chart
        </div>
      )}

      <div className="flex items-center justify-center gap-8 mt-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[var(--cl-primary)] rounded"></div>
          <span className="text-sm text-[var(--cl-body)]">Posts</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[var(--cl-success)] rounded"></div>
          <span className="text-sm text-[var(--cl-body)]">Comments</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[var(--cl-warning)] rounded"></div>
          <span className="text-sm text-[var(--cl-body)]">Likes</span>
        </div>
      </div>
    </div>
  );
}
