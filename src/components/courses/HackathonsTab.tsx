'use client';

import { useState, useEffect } from 'react';
import { Search, Trophy, Globe, MapPin, Calendar, Users, Sparkles, MapPinIcon, Banknote } from 'lucide-react';

interface Hackathon {
  title: string;
  url: string;
  description: string;
  image: string;
  source: string;
  location: string;
  deadline: string;
  prizePool: string;
  teamSize: string;
  startDate: string;
  publishedAt: string;
}

export function HackathonsTab() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchHackathons();
  }, []);

  const fetchHackathons = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/hub/hackathons');
      const data = await response.json();
      setHackathons(data || []);
    } catch (error) {
      console.error('Error fetching hackathons:', error);
      setHackathons([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredHackathons = hackathons.filter(h => 
    h.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.source?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search for Unstop, MLH, LinkedIn events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-red-500 transition-colors shadow-sm focus:shadow-md"
        />
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-red-500" />
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest leading-none">Live Opportunities Hub</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase">15+ Daily Results</span>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-slate-200 rounded-2xl h-80 animate-pulse"></div>
          ))}
        </div>
      ) : filteredHackathons.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 shadow-inner">
          <Sparkles className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">Seeking new hackathons from Unstop & MLH...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHackathons.map((h, idx) => (
            <div key={idx} className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-red-400 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="relative h-44 w-full overflow-hidden">
                <img 
                  src={h.image} 
                  alt={h.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-3 left-3 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-black text-white shadow-xl uppercase tracking-widest border border-white/20">
                  {h.source}
                </div>
                {h.prizePool && h.prizePool !== 'Available' && (
                  <div className="absolute top-3 right-3 px-3 py-1.5 bg-yellow-400/90 backdrop-blur-sm rounded-lg text-[10px] font-black text-yellow-950 shadow-xl uppercase tracking-tighter border border-yellow-200 flex items-center gap-1">
                    <Banknote size={12} />
                    {h.prizePool}
                  </div>
                )}
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-md font-bold text-slate-900 mb-3 line-clamp-2 leading-tight group-hover:text-red-700 transition-colors">
                  {h.title}
                </h3>
                
                <p className="text-xs text-slate-500 line-clamp-2 mb-5 leading-relaxed opacity-80">
                  {h.description}
                </p>
                
                <div className="mt-auto space-y-3">
                  <div className="grid grid-cols-2 gap-2 border-y border-slate-50 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Location</span>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                        <MapPinIcon size={12} className="text-red-500" />
                        <span className="truncate">{h.location || 'Global'}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Team Size</span>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                        <Users size={12} className="text-blue-500" />
                        <span className="truncate">{h.teamSize || 'Varies'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex flex-col">
                       <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Start Date</span>
                       <span className="text-[11px] font-black text-red-600">
                         {h.startDate ? new Date(h.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Check Listing'}
                       </span>
                    </div>
                    <a 
                      href={h.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg active:scale-95"
                    >
                      Details
                      <Globe size={14} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
