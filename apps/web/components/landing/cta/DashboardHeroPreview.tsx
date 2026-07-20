"use client"

import { MIcon } from "./helpers"

const services = ["Branding", "Web Dev", "Marketing", "AI Automation", "Legal", "Finance"]

export default function DashboardHeroPreview() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-[#07070A]">
      <div className="liquid-glass flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-['Instrument_Serif'] text-lg leading-none text-white">OGMJ Brands</span>
          <span className="text-[#C8FF00]">
            <MIcon name="star" size={14} fill={1} />
          </span>
        </div>
        <div className="hidden text-[10px] text-white/60 md:block">Dashboard</div>
        <div className="liquid-glass rounded-full px-3 py-1 text-[10px] text-[#C8FF00]">Login</div>
      </div>

      <div className="flex flex-col items-center px-4 pb-4 pt-6 text-center">
        <h1 className="animate-fade-rise font-['Instrument_Serif'] text-lg font-normal leading-[0.95] tracking-[-0.03em] text-white sm:text-2xl md:text-3xl">
          From Idea <em className="not-italic text-[#C8FF00]/80">to Empire.</em>
        </h1>
        <p className="animate-fade-rise-delay mt-2 max-w-[80%] text-[9px] text-white/60 sm:text-[11px]">
          26 AI-powered services. One platform. Zero agency fees.
        </p>
        <div className="liquid-glass animate-fade-rise-delay-2 mt-3 rounded-full border border-[#C8FF00]/30 px-4 py-1.5 text-[9px] text-[#C8FF00]">
          Explore Services -&gt;
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-1.5 px-4 pb-4">
        {services.map((service) => (
          <div key={service} className="rounded-xl bg-white/5 p-2 text-center text-[9px] text-white/60">
            {service}
          </div>
        ))}
      </div>
    </div>
  )
}

