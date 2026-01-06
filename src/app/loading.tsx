export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 overflow-hidden relative">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse [animation-delay:700ms]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl animate-pulse [animation-delay:1000ms]" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />

      <div className="relative z-10 text-center">
        {/* Main loader container */}
        <div className="relative w-32 h-32 mx-auto mb-10">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-2 border-purple-500/20" />
          
          {/* Spinning gradient ring */}
          <div className="absolute inset-0 rounded-full animate-spin [animation-duration:3s]">
            <div className="w-full h-full rounded-full border-4 border-transparent border-t-purple-500 border-r-pink-500" />
          </div>
          
          {/* Second spinning ring (opposite direction) */}
          <div className="absolute inset-2 rounded-full animate-spin [animation-duration:2s] [animation-direction:reverse]">
            <div className="w-full h-full rounded-full border-4 border-transparent border-b-indigo-400 border-l-violet-400" />
          </div>
          
          {/* Inner pulsing core */}
          <div className="absolute inset-6 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 animate-pulse shadow-lg shadow-purple-500/50">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 animate-ping opacity-20" />
          </div>
          
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Brand text */}
        <div className="space-y-3">
          <h2 className="text-3xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent animate-pulse">
              Classera
            </span>
          </h2>
          
          {/* Loading dots */}
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-sm text-slate-400 font-medium">Loading</span>
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </span>
          </div>
        </div>

        {/* Progress bar with shimmer effect */}
        <div className="mt-8 w-48 mx-auto">
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full w-full bg-gradient-to-r from-transparent via-purple-500 to-transparent rounded-full animate-[shimmer_1.5s_ease-in-out_infinite] [background-size:200%_100%]" />
          </div>
        </div>
      </div>
    </div>
  );
}
