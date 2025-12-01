/**
 * ServicesSection Component
 * Wrapper component for the "OUR SERVICES" section
 * Composes InfoSection, HeroSection, and ServiceCards
 * Implements responsive grid layout
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */

import { UserX, Database, Users } from 'lucide-react';
import { InfoSection } from './InfoSection';
import { HeroSection } from './HeroSection';
import { ServiceCard } from './ServiceCard';

// Service cards data configuration
const serviceCardsData = [
  {
    title: 'Secure & Anonymous',
    description: 'End-to-end encryption and metadata stripping protect whistleblowers',
    icon: UserX, // Anonymous/incognito user icon
  },
  {
    title: 'Data-Driven',
    description: 'Automated analysis of public records and satellite imagery',
    icon: Database, // Database/data icon
  },
  {
    title: 'Citizen Powered',
    description: 'Empowering Filipinos to exercise their digital rights',
    icon: Users, // Group of people icon
  },
];

export const ServicesSection = () => {
  return (
    <section 
      id="services"
      className="w-full px-4 md:px-8 lg:px-16 py-12 md:py-16 lg:py-24"
    >
      {/* Section Heading */}
      <h2 className="font-play font-bold text-2xl md:text-3xl lg:text-5xl 
                     tracking-[4px] md:tracking-[6px] text-center mb-3 md:mb-4 text-white/80">
        OUR SERVICES
      </h2>
      
      {/* Section Subtitle */}
      <p className="font-inter text-[#c0c0c0] text-sm md:text-base text-center max-w-2xl mx-auto mb-10 md:mb-12 lg:mb-16">
        HYDRA operates on two fronts to combat corruption: automated forensic analysis and secure whistle blowing channels.
      </p>

      {/* Main Feature Cards - InfoSection and HeroSection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-10 md:mb-12 lg:mb-16">
        <InfoSection />
        <HeroSection />
      </div>

      {/* Service Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {serviceCardsData.map((service, index) => (
          <ServiceCard
            key={index}
            title={service.title}
            description={service.description}
            icon={service.icon}
          />
        ))}
      </div>
    </section>
  );
};
