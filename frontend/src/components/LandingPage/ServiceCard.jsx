/**
 * ServiceCard Component
 * Reusable card component for displaying service offerings
 * Accepts title, description, and icon props
 * 
 * Requirements: 4.4, 6.2, 7.1
 */

import { Shield } from 'lucide-react';

export const ServiceCard = ({ title, description, icon }) => {
  // Use provided icon or fallback to Shield icon
  const IconComponent = icon || Shield;

  return (
    <div 
      className="flex flex-col items-center p-6 md:p-8
                 bg-[#ffffff08] backdrop-blur-md border border-[#ffffff20] rounded-2xl
                 hover:bg-[#ffffff10] hover:border-[#ffffff30]
                 transition-all duration-300"
    >
      {/* Icon */}
      <div className="mb-4">
        {typeof IconComponent === 'function' ? (
          <IconComponent 
            className="w-10 h-10 md:w-12 md:h-12 text-[#d9d9d9]" 
            aria-hidden="true"
          />
        ) : (
          /* Fallback placeholder if icon is not a valid component */
          /* TODO: Replace with actual asset */
          <div className="w-10 h-10 md:w-12 md:h-12 bg-[#3a0a0a] rounded-full flex items-center justify-center">
            <Shield className="w-5 h-5 md:w-6 md:h-6 text-white" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className="font-play font-bold text-[#d9d9d9] text-base md:text-lg 
                     tracking-[1px] text-center mb-2 md:mb-3">
        {title}
      </h3>

      {/* Description */}
      <p className="font-inter text-[#a0a0a0] text-xs md:text-sm 
                    text-center leading-relaxed">
        {description}
      </p>
    </div>
  );
};
