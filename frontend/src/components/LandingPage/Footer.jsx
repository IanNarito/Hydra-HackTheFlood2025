/**
 * Footer Component
 * Displays copyright text and developer credits
 * Implements dark background styling with proper text wrapping on mobile
 * 
 * Requirements: 8.1, 8.2, 8.3
 */

export const Footer = () => {
  return (
    <footer className="w-full bg-[#0a0505]/80 backdrop-blur-sm px-4 md:px-8 lg:px-16 py-6 md:py-8 mt-12">
      <div className="w-full max-w-[1920px] mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 text-center">
          {/* Copyright Text */}
          <p className="font-inter text-[#c0c0c0] text-sm md:text-base">
            © 2025 HYDRA.
          </p>

          <span className="hidden md:inline text-[#c0c0c0]">•</span>

          {/* Developer Credits */}
          <p className="font-inter text-[#a0a0a0] text-xs md:text-sm break-words">
            Developers: Unera John Raven, Narito Ian Christian, Rivera Miggy.
          </p>
        </div>
      </div>
    </footer>
  );
};
