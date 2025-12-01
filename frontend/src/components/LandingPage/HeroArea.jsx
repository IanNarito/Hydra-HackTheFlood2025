/**
 * HeroArea Component
 * Main hero section with tagline, heading, and CTA button
 * Displays HYDRA icon/logo with fallback handling
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 6.3, 6.4, 7.1
 */

import { useState } from 'react';
import { Shield } from 'lucide-react';
import LOGO2 from '../../assets/LOGO-2.png';

export const HeroArea = () => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = (e) => {
    console.warn('Failed to load hero image');
    setImageError(true);
    e.target.style.display = 'none';
  };

  const handleCtaClick = () => {
    // Scroll to services section or navigate to main app
    const servicesSection = document.querySelector('#services');
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section 
      id="overview"
      className="flex flex-col items-center justify-center px-4 md:px-8 lg:px-16 min-h-[calc(100vh-80px)]"
    >
      {/* Hero Icon/Image */}
      <div className="mb-6 md:mb-8">
        {!imageError ? (
          <img
            src={LOGO2}
            alt="HYDRA Logo - Anti-Corruption Intelligence Platform"
            className="w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 object-contain"
            onError={handleImageError}
          />
        ) : (
          /* Fallback icon when image fails to load */
          <div className="flex items-center justify-center w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40">
            {/* TODO: Replace with actual hero asset */}
            <Shield className="w-16 h-16 md:w-24 md:h-24 lg:w-32 lg:h-32 text-[#8f0000]" />
          </div>
        )}
      </div>

      {/* Tagline */}
      <p className="font-inter text-center text-[#c0c0c0] text-base md:text-lg lg:text-xl tracking-[1px] max-w-[90%] md:max-w-2xl lg:max-w-3xl mb-4 md:mb-6">
        Corruption thrives on two weaknesses: fragmented data allowing ghost projects, and citizen fear suppressing online participation.
      </p>

      {/* Main Heading */}
      <h1 className="font-play font-bold text-center text-3xl md:text-5xl lg:text-6xl tracking-[4px] md:tracking-[6px] mb-8 md:mb-10 lg:mb-12 text-[#d9d9d9]"
          style={{ textShadow: '0 0 40px rgba(192, 5, 5, 0.6), 0 0 80px rgba(139, 0, 0, 0.4)' }}>
        WE TARGET BOTH.
      </h1>

      {/* CTA Button with glow effect and scale animation */}
      <button
        onClick={handleCtaClick}
        className="font-inter font-semibold text-white text-sm md:text-base tracking-[1.5px] 
                   bg-[#510606] hover:bg-[#6a1515] active:scale-[0.95]
                   border border-[#8F3434]
                   px-8 md:px-10 lg:px-12 py-3 md:py-3.5 
                   rounded-full transition-all duration-300 ease-out
                   hover:scale-110
                   hover:shadow-[0_0_30px_rgba(192,5,5,0.7),0_0_60px_rgba(192,5,5,0.4),0_0_90px_rgba(192,5,5,0.2)]
                   focus:outline-none focus:ring-2 focus:ring-[#C00505] focus:ring-offset-2 focus:ring-offset-transparent"
        style={{ boxShadow: '0 0 20px rgba(192, 5, 5, 0.5), 0 0 40px rgba(192, 5, 5, 0.3), 0 0 60px rgba(143, 52, 52, 0.2)' }}
        aria-label="Access HYDRA platform"
      >
        Access HYDRA
      </button>
    </section>
  );
};
