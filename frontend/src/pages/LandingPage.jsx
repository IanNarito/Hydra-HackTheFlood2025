/**
 * LandingPage Component
 * Main landing page displayed after the splash screen
 * Composes all section components with fade-in animation
 * Uses semantic HTML structure for accessibility
 * 
 * Requirements: 1.4, 6.1, 9.3
 */

import {
  Header,
  HeroArea,
  ServicesSection,
  CallToActionSection,
  Footer,
} from '../components/LandingPage';

export const LandingPage = () => {
  return (
    <>
      {/* Fixed Header with Navigation - outside main container for proper fixed positioning */}
      <Header />
      
      <div 
        className="w-full min-h-screen animate-fade-in opacity-0 relative"
        style={{ 
          animationFillMode: 'forwards',
          backgroundColor: '#1E1E1E',
        }}
      >
        {/* Scattered color blobs with heavy blur - fixed position so they don't scroll */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" style={{ filter: 'blur(500px)' }}>
          {/* Top left - bright red */}
          <div className="absolute w-[600px] h-[600px] rounded-full" style={{ background: '#FA0202', top: '-10%', left: '-5%' }} />
          {/* Top center - coral */}
          <div className="absolute w-[500px] h-[500px] rounded-full" style={{ background: '#FA5353', top: '5%', left: '30%' }} />
          {/* Top right - pink */}
          <div className="absolute w-[400px] h-[400px] rounded-full" style={{ background: '#E38686', top: '-5%', right: '10%' }} />
          {/* Middle left - dark red */}
          <div className="absolute w-[450px] h-[450px] rounded-full" style={{ background: '#C00505', top: '25%', left: '10%' }} />
          {/* Middle center - maroon */}
          <div className="absolute w-[550px] h-[550px] rounded-full" style={{ background: '#8F3434', top: '35%', left: '40%' }} />
          {/* Middle right - dark maroon */}
          <div className="absolute w-[500px] h-[500px] rounded-full" style={{ background: '#510606', top: '30%', right: '5%' }} />
          {/* Bottom left - dark red brown */}
          <div className="absolute w-[600px] h-[600px] rounded-full" style={{ background: '#431414', bottom: '10%', left: '15%' }} />
          {/* Bottom right - red */}
          <div className="absolute w-[400px] h-[400px] rounded-full" style={{ background: '#C00505', bottom: '5%', right: '20%' }} />
        </div>

        {/* Content wrapper with z-index above background - add padding-top for fixed header */}
        <div className="relative z-10 pt-16 lg:pt-20">
          {/* Main Content Area */}
          <main className="w-full max-w-[1920px] mx-auto">
            {/* Hero Section - Main value proposition */}
            <section aria-labelledby="hero-heading">
              <HeroArea />
            </section>

            {/* Services Section - Platform capabilities */}
            <section aria-labelledby="services-heading">
              <ServicesSection />
            </section>

            {/* Call to Action Section - Origin of HYDRA */}
            <section aria-labelledby="origin-heading">
              <CallToActionSection />
            </section>
          </main>

          {/* Footer with credits */}
          <Footer />
        </div>
      </div>
    </>
  );
};

export default LandingPage;
