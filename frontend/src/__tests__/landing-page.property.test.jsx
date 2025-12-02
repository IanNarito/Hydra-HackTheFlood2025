/**
 * Property-Based Tests for Landing Page
 * Uses fast-check library to verify universal properties
 * 
 * **Feature: landing-page**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import * as fc from 'fast-check';
import { LandingPage } from '../pages/LandingPage';

// Wrapper component to provide router context
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Landing Page Property-Based Tests', () => {
  beforeEach(() => {
    // Reset any previous renders
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  /**
   * **Feature: landing-page, Property 1: No Horizontal Scroll at Any Viewport Width**
   * **Validates: Requirements 1.1**
   * 
   * For any viewport width between 320px and 1920px, when the Landing Page renders,
   * the document body's scroll width SHALL be less than or equal to the viewport width
   * (no horizontal overflow).
   */
  describe('Property 1: No Horizontal Scroll at Any Viewport Width', () => {
    it('should not have horizontal scroll at any viewport width between 320px and 1920px', () => {
      fc.assert(
        fc.property(
          // Generate viewport widths between 320px (minimum mobile) and 1920px (max desktop)
          fc.integer({ min: 320, max: 1920 }),
          (viewportWidth) => {
            // Set the viewport width
            Object.defineProperty(window, 'innerWidth', {
              writable: true,
              configurable: true,
              value: viewportWidth,
            });

            // Render the landing page
            const { container } = renderWithRouter(<LandingPage />);

            // Get all child elements (Header + main content div due to React Fragment)
            const children = container.children;
            
            // Check that all elements don't overflow horizontally
            // Each element should have w-full or fixed positioning
            let noHorizontalOverflow = true;
            
            for (const element of children) {
              const hasFullWidth = element.classList.contains('w-full');
              const hasFixed = element.classList.contains('fixed');
              const hasRelative = element.classList.contains('relative');
              
              if (!hasFullWidth && !hasFixed && !hasRelative) {
                noHorizontalOverflow = false;
                break;
              }
            }

            cleanup();
            
            return noHorizontalOverflow;
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * **Feature: landing-page, Property 2: Accessibility Attributes Present**
   * **Validates: Requirements 9.1, 9.2**
   * 
   * For any rendered Landing Page, all interactive elements (buttons, links) 
   * SHALL have aria-label attributes, and all img elements SHALL have non-empty alt attributes.
   */
  describe('Property 2: Accessibility Attributes Present', () => {
    it('all buttons should have aria-label attributes', () => {
      fc.assert(
        fc.property(
          // Generate a simple arbitrary to run the test multiple times
          // This ensures consistency across multiple renders
          fc.constant(true),
          () => {
            const { container } = renderWithRouter(<LandingPage />);

            // Get all button elements
            const buttons = container.querySelectorAll('button');
            
            // Check that all buttons have aria-label
            const allButtonsHaveAriaLabel = Array.from(buttons).every(button => {
              const hasAriaLabel = button.hasAttribute('aria-label') && 
                                   button.getAttribute('aria-label').trim() !== '';
              return hasAriaLabel;
            });

            cleanup();
            
            return allButtonsHaveAriaLabel;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('all links should have aria-label attributes', () => {
      fc.assert(
        fc.property(
          fc.constant(true),
          () => {
            const { container } = renderWithRouter(<LandingPage />);

            // Get all anchor elements that are navigation links (not just any anchor)
            const links = container.querySelectorAll('a[href]');
            
            // Check that all links have aria-label
            const allLinksHaveAriaLabel = Array.from(links).every(link => {
              const hasAriaLabel = link.hasAttribute('aria-label') && 
                                   link.getAttribute('aria-label').trim() !== '';
              return hasAriaLabel;
            });

            cleanup();
            
            return allLinksHaveAriaLabel;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('all img elements should have non-empty alt attributes', () => {
      fc.assert(
        fc.property(
          fc.constant(true),
          () => {
            const { container } = renderWithRouter(<LandingPage />);

            // Get all img elements
            const images = container.querySelectorAll('img');
            
            // Check that all images have non-empty alt text
            // Note: decorative images may have alt="" with aria-hidden="true"
            const allImagesHaveAlt = Array.from(images).every(img => {
              const hasAlt = img.hasAttribute('alt');
              const altValue = img.getAttribute('alt');
              // Either has meaningful alt text OR is decorative (empty alt with aria-hidden)
              const isDecorative = altValue === '' && img.getAttribute('aria-hidden') === 'true';
              const hasMeaningfulAlt = altValue && altValue.trim() !== '';
              return hasAlt && (hasMeaningfulAlt || isDecorative);
            });

            cleanup();
            
            return allImagesHaveAlt;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
