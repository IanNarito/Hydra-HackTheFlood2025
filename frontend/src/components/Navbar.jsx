/**
 * Navbar Component
 * Reusable navigation bar for all internal pages
 * Features: Logo, navigation links, mobile menu, page transitions
 */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import LOGO2 from '../assets/LOGO-2.png';

const navigationItems = [
  { label: 'Overview', href: '/dashboard' },
  { label: 'Investigator Map', href: '/map' },
  { label: 'Dropbox', href: '/dropbox' },
  { label: 'Reports', href: '/public-reports' },
  { label: 'Search', href: '/search' },
];

export const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoError = (e) => {
    console.warn('Failed to load HYDRA logo');
    e.target.style.display = 'none';
  };

  const handleNavClick = (e, href) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    
    // Don't navigate if already on the page
    if (location.pathname === href) return;
    
    document.body.style.opacity = '1';
    document.body.style.transition = 'opacity 0.3s ease-out';
    
    setTimeout(() => {
      document.body.style.opacity = '0';
    }, 50);
    
    setTimeout(() => {
      navigate(href);
      document.body.style.opacity = '1';
    }, 350);
  };

  const isActive = (href) => location.pathname === href;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#161616]/95 backdrop-blur-sm border-b border-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <a 
            href="/"
            onClick={(e) => handleNavClick(e, '/')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <img
              src={LOGO2}
              alt="HYDRA Logo"
              className="w-10 h-10 object-contain transition-transform group-hover:scale-110"
              onError={handleLogoError}
            />
            <span className="font-play font-bold text-xl tracking-[2px] text-[#8f0000] group-hover:text-red-600 transition-colors">
              HYDRA
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  isActive(item.href)
                    ? 'text-white border-b-2 border-red-500 bg-gray-800/50'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#1a1a1a] border-t border-gray-800/50 animate-fadeIn">
          <div className="px-4 pt-2 pb-3 space-y-1">
            {navigationItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive(item.href)
                    ? 'text-white bg-gray-800'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </nav>
  );
};
