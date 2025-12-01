/**
 * Header Component Unit Tests
 * Tests for logo/title rendering, navigation links, and sticky classes
 * 
 * Requirements: 2.1, 2.4, 2.5
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Header } from './Header';

// Wrapper component to provide router context
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Header Component', () => {
  describe('Logo and Title', () => {
    it('renders the HYDRA logo image', () => {
      renderWithRouter(<Header />);
      const logo = screen.getByAltText('HYDRA Logo');
      expect(logo).toBeInTheDocument();
    });

    it('renders the HYDRA title text', () => {
      renderWithRouter(<Header />);
      const title = screen.getByText('HYDRA');
      expect(title).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('renders Overview navigation link', () => {
      renderWithRouter(<Header />);
      const overviewLink = screen.getByRole('link', { name: /navigate to overview/i });
      expect(overviewLink).toBeInTheDocument();
    });

    it('renders Investigator Map navigation link', () => {
      renderWithRouter(<Header />);
      const mapLink = screen.getByRole('link', { name: /navigate to investigator map/i });
      expect(mapLink).toBeInTheDocument();
      expect(mapLink).toHaveAttribute('href', '/map');
    });

    it('renders Dropbox navigation link', () => {
      renderWithRouter(<Header />);
      const dropboxLink = screen.getByRole('link', { name: /navigate to dropbox/i });
      expect(dropboxLink).toBeInTheDocument();
      expect(dropboxLink).toHaveAttribute('href', '/dropbox');
    });
  });

  describe('Fixed Header Classes', () => {
    it('applies fixed positioning class to header', () => {
      renderWithRouter(<Header />);
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('fixed');
    });

    it('applies top-0 class for fixed positioning', () => {
      renderWithRouter(<Header />);
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('top-0');
    });

    it('applies z-index class for proper stacking', () => {
      renderWithRouter(<Header />);
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('z-[100]');
    });

    it('applies backdrop-blur class for blur effect', () => {
      renderWithRouter(<Header />);
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('backdrop-blur-sm');
    });
  });
});
