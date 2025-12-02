/**
 * CallToActionSection Component
 * Displays "THE ORIGIN OF HYDRA" section with THE MANDATE and THE ADVOCACY content blocks
 * Implements responsive layout with flex-col on mobile and flex-row on desktop
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 6.2
 */

import { Search, Shield } from 'lucide-react';

// Content data for the origin section blocks
const originContent = [
  {
    id: 1,
    title: 'THE MANDATE',
    quote: '"Born from the frontlines of HackTheFlood."',
    content: 'We recognized that corruption survives not because it is invincible, but because the data is fragmented and people are afraid. Ghost projects thrive in the shadows of bureaucracy. Our mandate is simple: to unify scattered data and make the invisible, visible.',
    icon: Search,
  },
  {
    id: 2,
    title: 'THE ADVOCACY',
    quote: '"Defending Oversight as a Digital Right."',
    content: 'HYDRA is not merely a monitoring tool; it is a digital shield. We advocate for a future where citizens can participate in governance without fear of retribution, armed with the protection of encryption and the objective truth of satellite forensics.',
    icon: Shield,
  },
];

export const CallToActionSection = () => {
  return (
    <section 
      id="origin"
      className="w-full px-4 md:px-8 lg:px-16 py-12 md:py-16 lg:py-24"
    >
      {/* Section Heading */}
      <h2 className="font-play font-bold text-[#d9d9d9] text-2xl md:text-3xl lg:text-4xl 
                     tracking-[4px] md:tracking-[6px] text-center mb-10 md:mb-12 lg:mb-16">
        THE ORIGIN OF HYDRA
      </h2>

      {/* Content Blocks - Stack on mobile, side-by-side on desktop */}
      <div className="flex flex-col lg:flex-row gap-6 md:gap-8 lg:gap-12">
        {originContent.map((block) => {
          const IconComponent = block.icon;
          return (
            <div
              key={block.id}
              className="flex-1 flex flex-col items-center p-6 md:p-8 lg:p-10
                         bg-[#ffffff08] backdrop-blur-md border border-[#ffffff20] rounded-2xl
                         hover:bg-[#ffffff10] hover:border-[#ffffff30]
                         transition-all duration-300"
            >
              {/* Icon */}
              <div className="mb-4">
                <IconComponent 
                  className="w-8 h-8 md:w-10 md:h-10 text-[#d9d9d9]" 
                  aria-hidden="true"
                />
              </div>

              {/* Block Title */}
              <h3 className="font-play font-bold text-[#d9d9d9] text-lg md:text-xl lg:text-2xl 
                             tracking-[2px] text-center mb-3 md:mb-4">
                {block.title}
              </h3>

              {/* Quote */}
              <blockquote className="font-inter italic text-[#c0c0c0] text-sm md:text-base
                                     text-center mb-4 md:mb-5">
                {block.quote}
              </blockquote>

              {/* Content Text */}
              <p className="font-inter text-[#a0a0a0] text-xs md:text-sm
                            text-center leading-relaxed">
                {block.content}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
