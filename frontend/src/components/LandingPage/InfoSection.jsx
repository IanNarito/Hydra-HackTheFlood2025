/**
 * InfoSection Component
 * Card component for the Automated Audit (OSINT) feature
 * Includes "Explore Map" button linking to /map route with fade transition
 * 
 * Requirements: 4.2, 4.3, 6.2, 6.3
 */

import { useNavigate } from 'react-router-dom';
import { Glasses } from 'lucide-react';

export const InfoSection = () => {
  const navigate = useNavigate();

  const handleNavigate = (e) => {
    e.preventDefault();
    
    // Start fade-out animation
    document.body.style.opacity = '1';
    document.body.style.transition = 'opacity 0.5s ease-out';
    
    setTimeout(() => {
      document.body.style.opacity = '0';
    }, 50);
    
    // Navigate after fade-out completes
    setTimeout(() => {
      navigate('/map');
      document.body.style.opacity = '1';
    }, 550);
  };

  return (
    <div 
      className="flex flex-col items-start p-6 md:p-8 lg:p-10
                 bg-[#ffffff08] backdrop-blur-md border border-[#ffffff20] rounded-2xl
                 hover:bg-[#ffffff10] hover:border-[#ffffff30]
                 transition-all duration-300"
    >
      {/* Icon */}
      <div className="mb-4">
        <Glasses 
          className="w-8 h-8 md:w-10 md:h-10 text-[#d9d9d9]" 
          aria-hidden="true"
        />
      </div>

      {/* Title */}
      <h3 className="font-play font-bold text-[#d9d9d9] text-xl md:text-2xl 
                     tracking-[2px] mb-3 md:mb-4">
        Automated Audit(OSINT)
      </h3>

      {/* Description */}
      <p className="font-inter text-[#a0a0a0] text-sm md:text-base
                    leading-relaxed mb-6 md:mb-8">
        System HYDRA utilizes public data sources to detect anomalies in project timelines, budgets, and physical construction status.
      </p>

      {/* CTA Button with glow effect, scale animation, and fade transition */}
      <a
        href="/map"
        onClick={handleNavigate}
        className="font-inter font-semibold text-white text-sm tracking-[1px] 
                   bg-[#4a1010] hover:bg-[#5a1515] active:scale-[0.95]
                   border border-[#6a2020]
                   px-6 py-2.5 
                   rounded-full transition-all duration-300 ease-out cursor-pointer
                   hover:scale-110
                   hover:shadow-[0_0_25px_rgba(192,5,5,0.6),0_0_50px_rgba(192,5,5,0.35),0_0_75px_rgba(139,0,0,0.2)]
                   focus:outline-none focus:ring-2 focus:ring-[#8f0000] focus:ring-offset-2 focus:ring-offset-transparent"
        style={{ boxShadow: '0 0 15px rgba(192, 5, 5, 0.4), 0 0 30px rgba(139, 0, 0, 0.2)' }}
        aria-label="Explore the Investigator Map"
      >
        Explore Map
      </a>
    </div>
  );
};
