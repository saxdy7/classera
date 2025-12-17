'use client';

import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, ComposedChart, Bar } from 'recharts';

const chartData = [
  { month: 'Jan', students: 186, completion: 85, engagement: 78, revenue: 4200 },
  { month: 'Feb', students: 205, completion: 88, engagement: 82, revenue: 5100 },
  { month: 'Mar', students: 237, completion: 91, engagement: 85, revenue: 6800 },
  { month: 'Apr', students: 273, completion: 89, engagement: 88, revenue: 7200 },
  { month: 'May', students: 309, completion: 94, engagement: 91, revenue: 8900 },
  { month: 'Jun', students: 354, completion: 98, engagement: 95, revenue: 10200 },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl">
        <p className="text-white font-bold mb-2 text-sm">{payload[0].payload.month}</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-teal-400"></div>
            <span className="text-white/70 text-xs">Students:</span>
            <span className="text-white font-semibold text-xs ml-auto">{payload[0].payload.students}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
            <span className="text-white/70 text-xs">Completion:</span>
            <span className="text-white font-semibold text-xs ml-auto">{payload[0].payload.completion}%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-violet-400"></div>
            <span className="text-white/70 text-xs">Engagement:</span>
            <span className="text-white font-semibold text-xs ml-auto">{payload[0].payload.engagement}%</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function AnalyticsChart() {
  return (
    <div className="w-full h-full px-4 py-6">
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-teal-400 to-teal-500 shadow-lg shadow-teal-400/50"></div>
          <span className="text-white/80 text-xs font-medium">Active Students</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-500 shadow-lg shadow-cyan-400/50"></div>
          <span className="text-white/80 text-xs font-medium">Completion Rate</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-violet-400 to-violet-500 shadow-lg shadow-violet-400/50"></div>
          <span className="text-white/80 text-xs font-medium">Engagement</span>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorCompletion" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
            </linearGradient>
            <filter id="shadow">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.3" />
            </filter>
          </defs>
          
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="rgba(255,255,255,0.05)" 
            vertical={false}
          />
          
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={12}
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 500 }}
          />
          
          <YAxis
            yAxisId="left"
            tickLine={false}
            axisLine={false}
            tickMargin={12}
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
          />
          
          <YAxis
            yAxisId="right"
            orientation="right"
            tickLine={false}
            axisLine={false}
            tickMargin={12}
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
          />
          
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
          
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="students"
            stroke="#14b8a6"
            strokeWidth={3}
            fill="url(#colorStudents)"
            dot={{ fill: '#14b8a6', r: 4, strokeWidth: 2, stroke: '#0f766e' }}
            activeDot={{ r: 6, fill: '#14b8a6', strokeWidth: 3, stroke: '#0f766e' }}
          />
          
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="completion"
            stroke="#22d3ee"
            strokeWidth={3}
            dot={{ fill: '#22d3ee', r: 4, strokeWidth: 2, stroke: '#0e7490' }}
            activeDot={{ r: 6, fill: '#22d3ee', strokeWidth: 3, stroke: '#0e7490' }}
          />
          
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="engagement"
            stroke="#a78bfa"
            strokeWidth={3}
            strokeDasharray="5 5"
            dot={{ fill: '#a78bfa', r: 4, strokeWidth: 2, stroke: '#7c3aed' }}
            activeDot={{ r: 6, fill: '#a78bfa', strokeWidth: 3, stroke: '#7c3aed' }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Bottom Stats */}
      {/* <div className="grid grid-cols-3 gap-3 mt-6">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
          <div className="text-white/60 text-xs mb-1">Growth Rate</div>
          <div className="text-white text-lg font-bold">+47%</div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
          <div className="text-white/60 text-xs mb-1">Avg. Session</div>
          <div className="text-white text-lg font-bold">24min</div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
          <div className="text-white/60 text-xs mb-1">Satisfaction</div>
          <div className="text-white text-lg font-bold">4.9/5</div>
        </div>
      </div> */}
    </div>
  );
}
