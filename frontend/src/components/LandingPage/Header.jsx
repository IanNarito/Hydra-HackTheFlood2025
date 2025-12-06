/**
 * Header Component
 * Displays HYDRA logo, title, and navigation
 * Implements fixed positioning with backdrop blur
 * Navigation with fade-out transitions before redirecting
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import LOGO2 from '../../assets/LOGO-2.png';

// Navigation items configuration - Overview now redirects to dashboard
const navigationItems = [
  { label: 'Overview', href: '/dashboard' },
  { label: 'Investigator Map', href: '/map' },
  { label: 'Dropbox', href: '/dropbox' },
  { label: 'Reports', href: '/public-reports' }, 
  { label: 'admin', href: '/admin' },
];

export const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const navigate = useNavigate();

  const handleLogoError = (e) => {
    console.warn('Failed to load HYDRA logo in header');
    e.target.style.display = 'none';
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavClick = (e, href) => {
    e.preventDefault();
    
    // Close mobile menu when a link is clicked
    setIsMobileMenuOpen(false);
    
    // Start fade-out animation
    setIsNavigating(true);
    
    // Add fade-out class to body
    document.body.style.opacity = '1';
    document.body.style.transition = 'opacity 0.5s ease-out';
    
    setTimeout(() => {
      document.body.style.opacity = '0';
    }, 50);
    
    // Navigate after fade-out completes
    setTimeout(() => {
      navigate(href);
      // Reset opacity for the new page
      document.body.style.opacity = '1';
      setIsNavigating(false);
    }, 550);
  };

  const renderNavLink = (item) => {
    const baseClasses = "font-inter text-[#d9d9d9] hover:text-white transition-colors duration-200 tracking-[1px] text-sm lg:text-base rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#8f0000] cursor-pointer";
    
    return (
      <a
        key={item.label}
        href={item.href}
        onClick={(e) => handleNavClick(e, item.href)}
        className={baseClasses}
        aria-label={`Navigate to ${item.label}`}
      >
        {item.label}
      </a>
    );
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] bg-transparent backdrop-blur-sm transition-all duration-300">
      <div className="w-full max-w-[1920px] mx-auto px-4 md:px-8 lg:px-16">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <img
              src={LOGO2}
              alt="HYDRA Logo"
              className="w-10 h-10 lg:w-12 lg:h-12 object-contain"
              onError={handleLogoError}
            />
            <span className="font-play font-bold text-xl lg:text-2xl tracking-[2px] text-[#8f0000]">
              HYDRA
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8" aria-label="Main navigation">
            {navigationItems.map(renderNavLink)}
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden p-2 text-[#d9d9d9] hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#8f0000] rounded"
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <nav 
            className="lg:hidden py-4 border-t border-[#777777]/30 bg-[#1E1E1E]/90 backdrop-blur-md"
            aria-label="Mobile navigation"
          >
            <div className="flex flex-col gap-4">
              {navigationItems.map((item) => {
                const baseClasses = "font-inter text-[#d9d9d9] hover:text-white transition-colors duration-200 tracking-[1px] py-2 rounded px-2 focus:outline-none focus:ring-2 focus:ring-[#8f0000] cursor-pointer";
                
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href)}
                    className={baseClasses}
                    aria-label={`Navigate to ${item.label}`}
                  >
                    {item.label}
                  </a>
                );
              })}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};
