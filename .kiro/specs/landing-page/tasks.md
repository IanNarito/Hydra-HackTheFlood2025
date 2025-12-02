# Implementation Plan

- [x] 1. Set up project dependencies and component structure








  - Install lucide-react for placeholder icons: `npm install lucide-react`
  - Create `frontend/src/components/LandingPage/` directory structure
  - Create index.jsx for clean component re-exports
  - _Requirements: 7.1, 7.2_

- [x] 2. Implement Header component with sticky navigation





  - [x] 2.1 Create Header.jsx with logo and navigation


    - Import HYDRA logo from existing assets
    - Implement sticky positioning with `sticky top-0 z-50`
    - Add backdrop blur effect `bg-[#1e1e1e]/80 backdrop-blur-md`
    - Display HYDRA logo and title with proper styling
    - _Requirements: 2.4, 2.5, 2.6_

  - [x] 2.2 Implement responsive navigation

    - Create horizontal nav links for desktop (lg breakpoint)
    - Create mobile menu with hamburger toggle for mobile
    - Add navigation items: Overview, Investigator Map, Dropbox
    - Implement smooth scroll for anchor links
    - _Requirements: 2.1, 2.2, 2.3_
  - [x] 2.3 Write unit tests for Header component






    - Test logo and title render correctly
    - Test navigation links are present
    - Test sticky classes are applied
    - _Requirements: 2.1, 2.4, 2.5_

- [x] 3. Implement HeroArea component






  - [x] 3.1 Create HeroArea.jsx with hero content

    - Add hero icon/image with onError fallback handler
    - Display tagline text with responsive typography
    - Display "WE TARGET BOTH." heading
    - Add "Access HYDRA" CTA button with hover/active states
    - Use flexbox centering with responsive padding
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 6.3, 6.4, 7.1_
  - [x] 3.2 Write unit tests for HeroArea component






    - Test tagline text is present
    - Test CTA button renders with correct text
    - Test image fallback behavior
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 4. Implement service section components





  - [x] 4.1 Create ServiceCard.jsx reusable component


    - Accept title, description, and icon props
    - Apply card styling with border and shadow
    - Add hover animations (scale, shadow)
    - Use Lucide icons as fallbacks
    - _Requirements: 4.4, 6.2, 7.1_
  - [x] 4.2 Create InfoSection.jsx (Automated Audit card)


    - Display "Automated Audit(OSINT)" title
    - Add description text
    - Include "Explore Map" button linking to /map route
    - Apply card styling and hover effects
    - _Requirements: 4.2, 4.3, 6.2, 6.3_

  - [x] 4.3 Create HeroSection.jsx (Anonymous Civic Dropbox card)

    - Display "Anonymous Civic Dropbox" title
    - Add description text
    - Include "Submit Evidence" button linking to /dropbox route
    - Apply card styling and hover effects
    - _Requirements: 4.2, 4.3, 6.2, 6.3_
  - [x] 4.4 Create ServicesSection.jsx wrapper


    - Display "OUR SERVICES" heading centered
    - Compose InfoSection and HeroSection with responsive grid
    - Add three ServiceCards (Secure & Anonymous, Data-Driven, Citizen Powered)
    - Implement responsive stacking: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  - [ ]* 4.5 Write unit tests for service components
    - Test ServiceCard renders with props
    - Test InfoSection and HeroSection content
    - Test ServicesSection contains all cards
    - _Requirements: 4.1, 4.4_

- [x] 5. Implement CallToActionSection component





  - [x] 5.1 Create CallToActionSection.jsx


    - Display "THE ORIGIN OF HYDRA" heading
    - Create THE MANDATE content block with quote and text
    - Create THE ADVOCACY content block with quote and text
    - Apply card styling with rounded corners and borders
    - Implement responsive layout: `flex-col lg:flex-row`
    - Add hover effects on content blocks
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.2_
  - [ ]* 5.2 Write unit tests for CallToActionSection
    - Test heading is present
    - Test both content blocks render
    - _Requirements: 5.1, 5.2_

- [x] 6. Implement Footer component






  - [x] 6.1 Create Footer.jsx

    - Display copyright text "© 2025 HYDRA"
    - Display developer credits
    - Apply dark background styling
    - Ensure text wraps properly on mobile
    - _Requirements: 8.1, 8.2, 8.3_
  - [ ]* 6.2 Write unit tests for Footer component
    - Test copyright text is present
    - Test developer credits are present
    - _Requirements: 8.1, 8.2_
-

- [x] 7. Assemble LandingPage and integrate with router




  - [x] 7.1 Create LandingPage.jsx page component


    - Import and compose all section components
    - Apply fade-in animation on mount
    - Use container pattern: `w-full max-w-[1920px] mx-auto`
    - Ensure proper section ordering and spacing
    - Add semantic HTML structure (main, sections)
    - _Requirements: 1.4, 6.1, 9.3_
  - [x] 7.2 Update App.jsx router configuration


    - Import LandingPage component
    - Set LandingPage as default route after splash screen
    - Ensure smooth transition from LoadingPage to LandingPage
    - _Requirements: 6.1_

  - [x] 7.3 Add component re-exports in index.jsx

    - Export all LandingPage components for clean imports
    - _Requirements: N/A (code organization)_

- [x] 8. Ensure accessibility compliance





  - [x] 8.1 Add aria-labels to all interactive elements


    - Add aria-labels to all buttons
    - Add aria-labels to navigation links
    - Add aria-label to mobile menu toggle
    - _Requirements: 9.1_
  - [x] 8.2 Add alt text to all images


    - Ensure all img elements have descriptive alt text
    - Add empty alt="" for decorative images with aria-hidden
    - _Requirements: 9.2_
  - [x] 8.3 Add focus indicators to buttons


    - Add visible focus ring styles to all buttons
    - Ensure focus states are keyboard accessible
    - _Requirements: 9.4_
-

- [x] 9. Checkpoint - Ensure all components render correctly




  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Write property-based tests






  - [x] 10.1 Write property test for responsive layout



    - **Property 1: No Horizontal Scroll at Any Viewport Width**
    - **Validates: Requirements 1.1**
    - Test across viewport widths 320px-1920px using fast-check
    - Verify document.body.scrollWidth <= window.innerWidth
  - [x] 10.2 Write property test for accessibility attributes



    - **Property 2: Accessibility Attributes Present**
    - **Validates: Requirements 9.1, 9.2**
    - Test all buttons/links have aria-label attributes
    - Test all img elements have non-empty alt attributes

- [x] 11. Final Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.
