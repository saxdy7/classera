import { Star } from 'lucide-react';

export default function MarqueeSection() {
  return (
    <div className="py-12 bg-lime-300 -rotate-1 overflow-hidden border-y-2 border-black">
      <div className="flex animate-marquee">
        <span className="text-4xl font-bold uppercase tracking-tight text-black flex items-center gap-8 whitespace-nowrap">
          Live Classes <Star className="w-8 h-8 fill-black" />
          Student Management <Star className="w-8 h-8 fill-black" />
          Video Conferencing <Star className="w-8 h-8 fill-black" />
          Course Builder <Star className="w-8 h-8 fill-black" />
          Analytics <Star className="w-8 h-8 fill-black" />
          Live Classes <Star className="w-8 h-8 fill-black" />
          Student Management <Star className="w-8 h-8 fill-black" />
          Video Conferencing <Star className="w-8 h-8 fill-black" />
          Course Builder <Star className="w-8 h-8 fill-black" />
          Analytics <Star className="w-8 h-8 fill-black" />
        </span>
        <span className="text-4xl font-bold uppercase tracking-tight text-black flex items-center gap-8 whitespace-nowrap">
          Live Classes <Star className="w-8 h-8 fill-black" />
          Student Management <Star className="w-8 h-8 fill-black" />
          Video Conferencing <Star className="w-8 h-8 fill-black" />
          Course Builder <Star className="w-8 h-8 fill-black" />
          Analytics <Star className="w-8 h-8 fill-black" />
          Live Classes <Star className="w-8 h-8 fill-black" />
          Student Management <Star className="w-8 h-8 fill-black" />
          Video Conferencing <Star className="w-8 h-8 fill-black" />
          Course Builder <Star className="w-8 h-8 fill-black" />
          Analytics <Star className="w-8 h-8 fill-black" />
        </span>
      </div>
    </div>
  );
}
