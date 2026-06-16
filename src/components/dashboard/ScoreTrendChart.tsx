'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface ScoreTrendChartProps {
  data: { label: string; score: number }[];
  color?: string;
}

export function ScoreTrendChart({ data, color = '#9333ea' }: ScoreTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data}>
        <CartesianGrid vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <YAxis hide domain={[0, 100]} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
          formatter={(value: number) => [`${value}%`, 'Score']}
        />
        <Line type="monotone" dataKey="score" stroke={color} strokeWidth={2.5} dot={{ r: 4, fill: color }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
