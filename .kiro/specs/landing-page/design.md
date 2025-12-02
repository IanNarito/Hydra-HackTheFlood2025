# Design Document

## Overview

This design document outlines the implementation of the HYDRA Landing Page, a fully responsive marketing page that appears after the splash screen. The landing page showcases the platform's mission, services, and provides navigation to key features. The implementation converts Figma-exported Anima code from absolute positioning to a flexible Tailwind CSS layout system, ensuring proper display across all device sizes.

The landing page integrates with the existing React + Vite + Tailwind CSS architecture established by the LoadingPage component, reusing existing animations, font configurations, and styling conventions.

## Architecture

### Component Structure

```
frontend/src/
├── pages/
│   └── LandingPage.jsx              # Main landing page (replaces Dashboard as default)
├── components/
│   └── LandingPage/
│       ├── index.jsx                # Re-export for clean imports
│       ├── Header.jsx               # Logo + Navigation
│       ├── HeroArea.jsx             # Main hero with tagline and CTA
│       ├── ServicesSection.jsx      # OUR SERVICES section wrapper
│       ├── ServiceCard.jsx          # Individual service card component
│       ├── InfoSection.jsx          # Automated Audit (OSINT) card
│       ├── HeroSection.jsx          # Anonymous Civic Dropbox card
│       ├── CallToActionSection.jsx  # Origin of HYDRA section
│       └── Footer.jsx               # Copyright and credits
├── assets/
│   ├── LOGO-2.png                   # Existing HYDRA logo
│   └── hydra-icon.png               # Hero icon (to be added)
└── index.css                        # Existing global styles (extend as needed)
```

### Integration Points

1. **Router Integration**: Update `App.jsx` to render `LandingPage` as the default route after splash screen
2. **Asset Pipeline**: Reuse existing logo, add new assets through Vite's static asset handling
3. **Style System**: Extend existing Tailwind config and CSS animations
4. **Component Conventions**: Follow existing patterns from `LoadingPage.jsx` (named exports, error handling)

### Technology Stack

- **React 19.2.0**: Component framework (existing)
- **Vite**: Build tool with asset optimization (existing)
- **Tailwind CSS**: Utility-first styling (existing)
- **React Router**: Navigation (existing)
- **Lucide React**: Icon library for placeholder icons (to be added)

## Components and Interfaces

### LandingPage (Page Component)

```jsx
// frontend/src/pages/LandingPage.jsx
export const LandingPage = () => {
  // Renders full landing page with fade-in animation
  // Composes all section components
}
```

### Header Component

```jsx
// Props: none
// Responsibilities:
// - Display HYDRA logo and title
// - Render navigation links (responsive)
// - Handle mobile menu toggle state
// - Sticky positioning: stays fixed at top when scrolling
// - Background blur effect when scrolled for better readability
export const Header = () => {}
```

### HeroArea Component

```jsx
// Props: none
// Responsibilities:
// - Display hero icon/image with fallback
// - Render tagline and "WE TARGET BOTH" heading
// - Render "Access HYDRA" CTA button
export const HeroArea = () => {}
```

### ServicesSection Component

```jsx
// Props: none
// Responsibilities:
// - Render "OUR SERVICES" heading
// - Compose InfoSection, HeroSection, and ServiceCards
// - Handle responsive grid layout
export const ServicesSection = () => {}
```

### ServiceCard Component

```jsx
// Props: { title: string, description: string, icon: ReactNode }
// Responsibilities:
// - Render individual service card with icon
// - Apply hover animations
// - Handle icon fallback
export const ServiceCard = ({ title, description, icon }) => {}
```

### InfoSection Component

```jsx
// Props: none
// Responsibilities:
// - Render Automated Audit (OSINT) card
// - Include "Explore Map" button linking to /map
export const InfoSection = () => {}
```

### HeroSection Component

```jsx
// Props: none
// Responsibilities:
// - Render Anonymous Civic Dropbox card
// - Include "Submit Evidence" button linking to /dropbox
export const HeroSection = () => {}
```

### CallToActionSection Component

```jsx
// Props: none
// Responsibilities:
// - Render "THE ORIGIN OF HYDRA" heading
// - Render THE MANDATE and THE ADVOCACY cards
// - Handle responsive stacking
export const CallToActionSection = () => {}
```

### Footer Component

```jsx
// Props: none
// Responsibilities:
// - Render copyright text
// - Render developer credits
export const Footer = () => {}
```

## Data Models

### Navigation Item

```typescript
interface NavigationItem {
  label: string;      // Display text
  href: string;       // Route path or anchor
}
```

### Service Card Data

```typescript
interface ServiceCardData {
  title: string;       // Card title
  description: string; // Card description
  iconType: string;    // Icon identifier for lucide-react
}
```

### Section Content

```typescript
interface OriginSection {
  id: number;
  title: string;       // "THE MANDATE" or "THE ADVOCACY"
  quote: string;       // Opening quote
  content: string;     // Main paragraph content
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: No Horizontal Scroll at Any Viewport Width

*For any* viewport width between 320px and 1920px, when the Landing Page renders, the document body's scroll width SHALL be less than or equal to the viewport width (no horizontal overflow).

**Validates: Requirements 1.1**

### Property 2: Accessibility Attributes Present

*For any* rendered Landing Page, all interactive elements (buttons, links) SHALL have aria-label attributes, and all img elements SHALL have non-empty alt attributes.

**Validates: Requirements 9.1, 9.2**

## Error Handling

### Asset Loading Failures

1. **Image onError Handler**: All image components implement `onError` callbacks that:
   - Log a warning to console
   - Hide the broken image or display a fallback icon
   - Do not crash the component tree

2. **Fallback Icons**: Use Lucide React icons as fallbacks when SVG assets are missing:
   ```jsx
   import { Shield, Database, Users, Search, Lock } from 'lucide-react';
   ```

3. **Graceful Degradation**: Components render placeholder colored divs with comments when assets are unavailable:
   ```jsx
   {/* TODO: Replace with actual asset */}
   <div className="w-16 h-16 bg-gray-600 rounded-full" />
   ```

### Navigation Errors

1. **Invalid Routes**: React Router handles 404s; navigation links use valid routes only
2. **Anchor Links**: Smooth scroll to sections with fallback to top if section not found

## Testing Strategy

### Unit Testing

Unit tests will verify specific component behaviors using Vitest and React Testing Library:

1. **Component Rendering**: Each component renders without crashing
2. **Content Presence**: Required text content appears in the DOM
3. **Button Functionality**: Buttons are clickable and have correct attributes
4. **Navigation Links**: Links have correct href values
5. **Error Handling**: Components handle missing assets gracefully

### Property-Based Testing

Property-based tests will use **fast-check** library to verify universal properties:

1. **Viewport Responsiveness**: Test no horizontal scroll across random viewport widths
2. **Accessibility Compliance**: Test all interactive elements have required attributes

Each property-based test will:
- Run a minimum of 100 iterations
- Be tagged with a comment referencing the correctness property: `**Feature: landing-page, Property {number}: {property_text}**`
- Use smart generators to constrain inputs to valid viewport ranges

### Test File Structure

```
frontend/src/
├── pages/
│   └── LandingPage.test.jsx         # Page-level tests
├── components/
│   └── LandingPage/
│       ├── Header.test.jsx          # Header unit tests
│       ├── HeroArea.test.jsx        # Hero unit tests
│       ├── ServicesSection.test.jsx # Services unit tests
│       └── ...
└── __tests__/
    └── landing-page.property.test.jsx  # Property-based tests
```

## Visual Design Specifications

### Color Palette

- **Background**: `#1e1e1e` (dark gray)
- **Gradient Background**: Red gradient matching LoadingPage
- **Primary Red**: `#510606` (buttons)
- **Hover Red**: `#6a0808` (button hover)
- **Text Primary**: `#d9d9d9` (headings)
- **Text Secondary**: `#c0c0c0` (body text)
- **Text Muted**: `#949090` (tagline)
- **Accent Red**: `#8f0000` (HYDRA title)
- **Card Background**: `rgba(255, 255, 255, 0.1)` (`#ffffff1a`)
- **Card Border**: `#777777`
- **Footer Background**: `#333333`

### Typography

- **Headings**: Play font, bold weight
- **Body Text**: Inter font, regular/medium weight
- **Letter Spacing**: 2-6.4px depending on element

### Responsive Breakpoints

| Breakpoint | Width | Layout Behavior |
|------------|-------|-----------------|
| Base (mobile) | < 768px | Single column, stacked sections |
| md (tablet) | >= 768px | Two-column for some sections |
| lg (desktop) | >= 1024px | Full horizontal layout |
| xl (large) | >= 1280px | Max-width container centered |

### Animation Specifications

- **Fade In**: `animate-fade-in` (1s ease, translateY -10px to 0)
- **Fade Up**: `animate-fade-up` (1s ease, translateY 20px to 0)
- **Hover Scale**: `hover:scale-[1.02]` with `transition-all duration-300`
- **Hover Shadow**: `hover:shadow-xl`
- **Button Active**: `active:scale-[0.98]`

### Sticky Header Behavior

The header/navbar will be sticky (fixed to top) as the user scrolls:

```jsx
<header className="sticky top-0 z-50 bg-[#1e1e1e]/80 backdrop-blur-md transition-all duration-300">
  {/* Logo + Navigation */}
</header>
```

- **Position**: `sticky top-0` keeps header at top during scroll
- **Z-Index**: `z-50` ensures header stays above other content
- **Background**: Semi-transparent with backdrop blur for modern glass effect
- **Transition**: Smooth transition for any state changes

## Responsive Layout Strategy

### Container Pattern

```jsx
<div className="w-full max-w-[1920px] mx-auto px-4 md:px-8 lg:px-16">
  {/* Content */}
</div>
```

### Section Stacking Pattern

```jsx
<section className="flex flex-col lg:flex-row gap-6 lg:gap-12">
  {/* Cards stack on mobile, row on desktop */}
</section>
```

### Card Grid Pattern

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Service cards */}
</div>
```

## Dependencies

### New Dependencies to Install

```json
{
  "lucide-react": "^0.400.0",
  "fast-check": "^3.15.0"
}
```

### Existing Dependencies (No Changes)

- react: ^19.2.0
- react-dom: ^19.2.0
- react-router-dom: existing
- tailwindcss: existing
- vite: existing
- vitest: (add if not present for testing)
- @testing-library/react: (add if not present for testing)
