/**
 * HeroArea Component Unit Tests
 * Tests for tagline text, CTA button, and image fallback behavior
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HeroArea } from './HeroArea';

describe('HeroArea Component', () => {
  describe('Tagline Text', () => {
    it('renders the tagline text about corruption', () => {
      render(<HeroArea />);
      const tagline = screen.getByText(/Corruption thrives on two weaknesses/i);
      expect(tagline).toBeInTheDocument();
    });

    it('renders the complete tagline message', () => {
      render(<HeroArea />);
      const tagline = screen.getByText(/fragmented data allowing ghost projects/i);
      expect(tagline).toBeInTheDocument();
    });
  });

  describe('Main Heading', () => {
    it('renders "WE TARGET BOTH." heading', () => {
      render(<HeroArea />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('WE TARGET BOTH.');
    });
  });

  describe('CTA Button', () => {
    it('renders the "Access HYDRA" button', () => {
      render(<HeroArea />);
      const button = screen.getByRole('button', { name: /access hydra/i });
      expect(button).toBeInTheDocument();
    });

    it('button has correct text content', () => {
      render(<HeroArea />);
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Access HYDRA');
    });

    it('button has aria-label for accessibility', () => {
      render(<HeroArea />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Access HYDRA platform');
    });
  });

  describe('Hero Image', () => {
    it('renders the HYDRA logo image with alt text', () => {
      render(<HeroArea />);
      const image = screen.getByAltText(/HYDRA Logo/i);
      expect(image).toBeInTheDocument();
    });

    it('displays fallback icon when image fails to load', () => {
      render(<HeroArea />);
      const image = screen.getByAltText(/HYDRA Logo/i);
      
      // Simulate image load error
      fireEvent.error(image);
      
      // After error, the image should be hidden and fallback should appear
      // The fallback is a Shield icon from lucide-react
      expect(image).toHaveStyle({ display: 'none' });
    });
  });
});
