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
      <div className="bg-white rounded-2xl border border-slate-200 p-12 mb-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="w-5 h-5 text-indigo-500" />
        <h2 className="text-xl font-bold text-slate-900">Activity Over Time (Last 30 Days)</h2>
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
        <div className="h-64 flex items-center justify-center text-slate-600">
          Not enough data to display chart
        </div>
      )}

      <div className="flex items-center justify-center gap-8 mt-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-indigo-500 rounded"></div>
          <span className="text-sm text-slate-600">Posts</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-sm text-slate-600">Comments</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-amber-500 rounded"></div>
          <span className="text-sm text-slate-600">Likes</span>
        </div>
      </div>
    </div>
  );
}
