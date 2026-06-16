'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface ActivityBarChartProps {
  data: { day: string; submissions: number }[];
  color?: string;
  dataKeyLabel?: string;
}

export function ActivityBarChart({ data, color = '#6366f1', dataKeyLabel = 'Submissions' }: ActivityBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} barCategoryGap={18}>
        <CartesianGrid vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
        <YAxis hide allowDecimals={false} />
        <Tooltip
          cursor={{ fill: '#f8fafc' }}
          contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
          formatter={(value: number) => [value, dataKeyLabel]}
        />
        <Bar dataKey="submissions" radius={[6, 6, 0, 0]} fill={color} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
