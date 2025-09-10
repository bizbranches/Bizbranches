"use client"

export default function FancyLoader({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative w-[13em] h-[13em] [font-size:8px]">
        {/* Static bars */}
        <div className="absolute inset-0 flex items-center justify-center">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className={`fancy-loader-bar`} style={{ transform: `rotate(${i * 20}deg)` }} />
          ))}
        </div>
        {/* Animated balls */}
        <div className="absolute inset-0 flex items-center justify-center">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="fancy-loader-track" style={{ transform: `rotate(${i * 20}deg)` }}>
              <div className={`fancy-loader-ball`} style={{ animationDelay: `${i * 0.2}s` }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
