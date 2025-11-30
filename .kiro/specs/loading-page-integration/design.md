# Design Document

## Overview

This design document outlines the integration of a branded loading page component into the HYDRA Anti-Corruption Intelligence Platform. The loading page features the HYDRA logo, application name, and tagline displayed on a distinctive red gradient background. The component is exported from Figma via the Anima plugin and will be adapted to fit the existing React + Vite + Tailwind CSS architecture while maintaining responsive design principles and accessibility standards.

The loading page serves dual purposes: as a splash screen during application initialization and as a standalone route for testing or explicit loading states. The implementation prioritizes seamless integration with existing project conventions, minimal bundle size impact, and optimal user experience across devices.

## Architecture

### Component Structure

The loading page follows a component-based architecture consistent with the existing HYDRA application:

```
frontend/src/
├── components/
│   └── LoadingPage.jsx          # Main loading page component
├── assets/
│   └── LOGO-2.png               # HYDRA logo image
└── index.css                     # Global styles with Tailwind customizations
```

### Integration Points

1. **Component Export**: The `LoadingPage` component exports a named function component that can be imported anywhere in the application
2. **Router Integration**: Optional route configuration in `App.jsx` to make the loading page accessible at `/loading`
3. **Asset Pipeline**: Logo image processed through Vite's static asset handling
4. **Style System**: Tailwind CSS utilities with custom animations and font configurations

### Technology Stack

- **React 19.2.0**: Component framework
- **Vite**: Build tool and development server with asset optimization
- **Tailwind CSS 3.4.17**: Utility-first CSS framework
- **React Router DOM 7.9.6**: Client-side routing (optional integration)

## Components and Interfaces

### LoadingPage Component

**File**: `frontend/src/components/LoadingPage.jsx`

**Purpose**: Renders the branded loading screen with logo, title, and tagline

**Props**: None (stateless component)

**Structure**:
```jsx
export const LoadingPage = () => {
  return (
    <div className="...gradient-background...">
      <div className="flex flex-col items-center justify-center">
        <img src={logo} alt="..." />
        <h1>HYDRA</h1>
        <p>Anti - Corruption Intelligence Platform</p>
      </div>
    </div>
  );
};
```

**Key Features**:
- Centered flexbox layout for vertical and horizontal centering
- Responsive viewport sizing using `w-screen h-screen` instead of fixed dimensions
- Semantic HTML with proper heading hierarchy
- Descriptive alt text for accessibility

### Router Integration (Optional)

**File**: `frontend/src/App.jsx`

**Modification**: Add route for loading page

```jsx
import { LoadingPage } from './components/LoadingPage.jsx';

// Inside Routes component:
<Route path="/loading" element={<LoadingPage />} />
```

This allows the loading page to be accessed directly for testing or as a dedicated loading state route.

## Data Models

### Asset Structure

**Logo Image**:
- **File**: `LOGO-2.png`
- **Location**: `frontend/src/assets/`
- **Dimensions**: 258px × 273px (as specified in design)
- **Format**: PNG with transparency support
- **Import**: ES module import processed by Vite

```javascript
import LOGO2 from '../assets/LOGO-2.png';
```

### Style Configuration

**Tailwind Config Extension**:
```javascript
theme: {
  extend: {
    fontFamily: {
      inter: ['Inter', 'Helvetica', 'sans-serif'],
      play: ['Play', 'Helvetica', 'sans-serif'],
    },
  },
}
```

**Custom CSS Variables**:
```css
:root {
  --inter-font-family: "Inter", Helvetica;
  --animate-spin: spin 1s linear infinite;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Acceptance Criteria Testing Prework

1.1 WHEN the application loads THEN the Loading Page Component SHALL display the HYDRA logo centered on screen
Thoughts: This is about the visual rendering of a specific UI element. We can test that the component renders and contains an img element with the correct src attribute and that it's within a centered container.
Testable: yes - example

1.2 WHEN the Loading Page Component renders THEN the system SHALL display the text "HYDRA" with proper typography and spacing
Thoughts: This tests that specific text content is present in the rendered output. We can verify the text exists and has the correct styling classes.
Testable: yes - example

1.3 WHEN the Loading Page Component renders THEN the system SHALL display the tagline "Anti - Corruption Intelligence Platform" below the logo and title
Thoughts: This verifies specific text content and its position in the DOM hierarchy. We can test that the tagline text exists and appears after the title.
Testable: yes - example

1.4 WHEN the Loading Page Component is visible THEN the system SHALL apply a red gradient background matching the design specifications
Thoughts: This tests that the component has the correct background styling. We can verify the presence of the gradient class.
Testable: yes - example

1.5 THE Loading Page Component SHALL maintain visual hierarchy with logo at top, title in middle, and tagline at bottom
Thoughts: This tests the DOM structure and ordering. We can verify the order of elements in the component tree.
Testable: yes - example

2.1 THE system SHALL place the Loading Page Component in the `frontend/src/components/` directory
Thoughts: This is about file system organization, not runtime behavior. This is a manual verification step.
Testable: no

2.2 THE system SHALL store the HYDRA logo image in the `frontend/src/assets/` directory
Thoughts: This is about file system organization, not runtime behavior. This is a manual verification step.
Testable: no

2.3 WHEN importing the logo THEN the Loading Page Component SHALL use relative path imports compatible with Vite
Thoughts: This tests that the import statement works correctly. We can verify the component imports without errors and the image resolves.
Testable: yes - example

2.4 THE Loading Page Component SHALL export a named component following project naming conventions
Thoughts: This tests the export structure of the module. We can verify the component is exported and can be imported.
Testable: yes - example

2.5 THE Loading Page Component SHALL use JSX syntax consistent with other components in the project
Thoughts: This is about code style consistency, which is better handled by linting than testing.
Testable: no

3.1 THE system SHALL merge custom Tailwind utilities from the Anima export into the existing `index.css` file
Thoughts: This is about file content, not runtime behavior. Manual verification.
Testable: no

3.2 THE system SHALL preserve existing Tailwind configuration while adding new custom styles
Thoughts: This tests that existing styles still work after modifications. We can verify existing components still render correctly.
Testable: yes - example

3.3 WHEN custom font families are specified THEN the system SHALL add them to the Tailwind configuration
Thoughts: This is about configuration file content. Manual verification.
Testable: no

3.4 THE system SHALL include custom animation keyframes for fade-in, fade-up, shimmer, and marquee effects
Thoughts: This tests that CSS animations are defined. We can verify the animations exist in the stylesheet.
Testable: yes - example

3.5 THE Tailwind configuration SHALL maintain ES module syntax consistent with the existing setup
Thoughts: This is about code syntax, better handled by build tools and linting.
Testable: no

4.1 WHEN the viewport is smaller than 1920px THEN the Loading Page Component SHALL scale content appropriately without horizontal scrolling
Thoughts: This is a responsive design property that should hold across different viewport sizes. We can test rendering at various widths.
Testable: yes - property

4.2 THE Loading Page Component SHALL use responsive units that adapt to different screen sizes
Thoughts: This is about implementation details (using rem, %, vw instead of px). Better verified through code review.
Testable: no

4.3 WHEN the logo image loads THEN the system SHALL provide descriptive alt text for screen readers
Thoughts: This tests that the img element has an alt attribute with meaningful content.
Testable: yes - example

4.4 THE Loading Page Component SHALL maintain aspect ratios for the logo across different viewport sizes
Thoughts: This is a visual property about how the logo scales. We can test that the logo dimensions maintain their ratio.
Testable: yes - property

4.5 WHEN text is rendered THEN the system SHALL ensure sufficient color contrast for readability
Thoughts: This tests WCAG compliance for color contrast. We can verify contrast ratios meet accessibility standards.
Testable: yes - example

5.1 THE Loading Page Component SHALL be importable as a standalone component
Thoughts: This tests that the module exports correctly and can be imported elsewhere.
Testable: yes - example

5.2 WHEN a route is configured THEN the system SHALL make the loading page accessible at `/loading` path
Thoughts: This tests routing configuration. We can verify navigation to /loading renders the component.
Testable: yes - example

5.3 THE Loading Page Component SHALL integrate with React Router without conflicts
Thoughts: This tests that the component works within the Router context without errors.
Testable: yes - example

5.4 WHEN used as a splash screen THEN the Loading Page Component SHALL render before other application routes
Thoughts: This is about application initialization order and timing, which depends on implementation strategy.
Testable: no

5.5 THE system SHALL allow conditional rendering of the Loading Page Component based on application state
Thoughts: This is about the flexibility of the component to be used conditionally. We can test it renders based on props or state.
Testable: yes - example

6.1 WHEN the logo image is imported THEN the system SHALL process it through Vite's asset pipeline
Thoughts: This tests build tool behavior. We can verify the import resolves to a valid URL.
Testable: yes - example

6.2 THE system SHALL optimize the logo image for web delivery
Thoughts: This is about build output optimization, which is handled by Vite automatically.
Testable: no

6.3 WHEN the application builds for production THEN the system SHALL include the logo in the output bundle
Thoughts: This tests the production build process. We can verify the asset exists in dist folder.
Testable: yes - example

6.4 THE logo image SHALL load without CORS or path resolution errors
Thoughts: This tests that the image loads successfully in the browser.
Testable: yes - example

6.5 WHEN the logo fails to load THEN the system SHALL display the alt text gracefully
Thoughts: This tests error handling for broken images. We can simulate a failed image load.
Testable: yes - example

### Property Reflection

After reviewing all testable criteria, most are specific examples testing concrete implementation details rather than universal properties. The two genuine properties identified are:

- **4.1**: Responsive behavior across viewport sizes (tests a range of widths)
- **4.4**: Aspect ratio maintenance across viewport sizes (tests a range of sizes)

These can be combined into a single comprehensive responsive design property. All other testable criteria are examples testing specific cases (component renders, text exists, imports work, etc.) rather than properties that hold across a range of inputs.

### Correctness Properties

Property 1: Responsive layout without horizontal scroll
*For any* viewport width between 320px and 3840px, the Loading Page Component should render without causing horizontal scrolling and all content should remain visible and properly centered
**Validates: Requirements 4.1, 4.4**

## Error Handling

### Image Loading Failures

**Scenario**: Logo image fails to load due to network issues or incorrect path

**Handling**:
- Descriptive alt text displays in place of image
- Component layout remains intact without broken image icon
- Console warning logged for debugging

**Implementation**:
```jsx
<img
  src={LOGO2}
  alt="Hydra Logo - Three-headed dragon representing the anti-corruption intelligence platform"
  onError={(e) => {
    console.warn('Failed to load HYDRA logo');
    e.target.style.display = 'none';
  }}
/>
```

### Missing Font Fallbacks

**Scenario**: Custom fonts (Play, Inter) fail to load

**Handling**:
- Tailwind configuration includes fallback fonts: `['Play', 'Helvetica', 'sans-serif']`
- System fonts provide graceful degradation
- Visual hierarchy maintained with fallback typography

### Route Conflicts

**Scenario**: `/loading` route conflicts with existing routes

**Handling**:
- Route is optional and can be omitted
- Component usable without routing integration
- Clear documentation of route configuration

### Build Failures

**Scenario**: Asset import fails during build process

**Handling**:
- Vite provides clear error messages for missing assets
- Development server hot-reloads on asset changes
- Production build fails fast with actionable error messages

## Testing Strategy

### Unit Testing Approach

Unit tests will verify specific implementation details and component behavior using React Testing Library and Vitest (or Jest). Tests will focus on:

1. **Component Rendering**: Verify the component renders without errors
2. **Content Presence**: Check that logo, title, and tagline are present in the DOM
3. **Accessibility**: Verify alt text, semantic HTML, and ARIA attributes
4. **Import Resolution**: Test that asset imports resolve correctly
5. **Router Integration**: Verify the component works within React Router context

**Example Unit Tests**:
- Loading page renders with logo image
- Title text "HYDRA" is displayed
- Tagline text is present and correctly positioned
- Alt text is descriptive and meaningful
- Component exports correctly as named export
- Image import resolves to valid URL
- Component renders at `/loading` route
- Conditional rendering based on state works

### Property-Based Testing Approach

Property-based tests will verify universal behaviors that should hold across a range of inputs using `@fast-check/vitest` (fast-check integration for Vitest).

**Property Testing Library**: `@fast-check/vitest` for React/Vitest projects

**Configuration**: Each property test will run a minimum of 100 iterations to ensure thorough coverage of the input space.

**Property Tests**:

1. **Responsive Layout Property**: Test that the component renders correctly across a wide range of viewport widths without horizontal scrolling

**Test Strategy**:
- Generate random viewport widths between 320px (mobile) and 3840px (4K)
- Render component in a container with each generated width
- Verify no horizontal overflow occurs
- Verify content remains centered and visible
- Verify logo maintains aspect ratio

### Testing Tools

- **React Testing Library**: Component rendering and DOM queries
- **Vitest**: Test runner and assertion library
- **@fast-check/vitest**: Property-based testing framework
- **@testing-library/user-event**: User interaction simulation
- **jsdom**: DOM environment for Node.js testing

### Test File Structure

```
frontend/src/components/
├── LoadingPage.jsx
└── LoadingPage.test.jsx          # Unit and property tests
```

### Coverage Goals

- **Component Coverage**: 100% of LoadingPage component code
- **Integration Coverage**: Router integration and asset loading
- **Property Coverage**: All identified correctness properties tested
- **Accessibility Coverage**: WCAG 2.1 Level AA compliance verified

## Implementation Notes

### Responsive Design Adjustments

The original Figma export uses fixed dimensions (`min-w-[1920px] min-h-[1080px]`), which would cause horizontal scrolling on smaller devices. The implementation will use responsive units:

**Original**:
```jsx
className="... min-w-[1920px] min-h-[1080px] ..."
```

**Responsive**:
```jsx
className="... w-screen h-screen ..."
```

This ensures the loading page fills the viewport on all devices without scrolling.

### Gradient Background Preservation

The complex red gradient from Figma will be preserved exactly as specified:

```jsx
className="bg-[linear-gradient(108deg,rgba(61,8,8,1)_0%,rgba(65,11,11,1)_24%,rgba(84,8,8,1)_41%,rgba(89,11,11,1)_51%,rgba(82,10,11,1)_62%,rgba(53,14,15,1)_81%,rgba(50,14,14,1)_91%,rgba(38,16,17,1)_100%)]"
```

### Font Configuration

The design specifies custom fonts that need to be added to Tailwind configuration:

**Play Font** (for "HYDRA" title):
- Bold weight
- Large size (80px)
- Wide letter spacing (8px)

**Inter Font** (for tagline):
- Bold weight
- Medium size (23px)
- Letter spacing (2.3px)

### Tailwind CSS Customizations

The Anima export includes custom animations and utilities that will be merged into `index.css`:

1. **Custom Animations**: fade-in, fade-up, shimmer, marquee, marquee-vertical
2. **Custom Utilities**: `.all-[unset]` for resetting all properties
3. **CSS Variables**: Font family definitions and animation configurations
4. **Base Layer Resets**: Form element appearance resets

These will be added to the existing `index.css` without removing current styles (dark background, text color).

### Component Naming

The Figma export uses `LoadingPageAfter` as the component name. This will be renamed to simply `LoadingPage` for clarity and consistency with project conventions.

### Asset Management

The logo image (`LOGO-2.png`) will be:
1. Placed in `frontend/src/assets/` directory
2. Imported using ES module syntax: `import LOGO2 from '../assets/LOGO-2.png'`
3. Processed by Vite's asset pipeline for optimization
4. Included in production bundle with content-based hashing for cache busting

### Integration with Existing Styles

The loading page uses Tailwind utilities that may not be present in the current configuration. The implementation will:

1. Preserve existing Tailwind config (ES module export format)
2. Add font family extensions without removing existing configuration
3. Merge custom CSS into `index.css` after existing Tailwind directives
4. Ensure no conflicts with existing component styles

### Performance Considerations

- **Image Optimization**: Vite automatically optimizes images during build
- **CSS Purging**: Tailwind purges unused utilities in production
- **Code Splitting**: Component can be lazy-loaded if used as splash screen
- **Bundle Size**: Minimal impact (~1-2KB for component code, image size depends on PNG optimization)

## Future Enhancements

1. **Animation**: Add fade-in animation when loading page appears
2. **Progress Indicator**: Optional loading spinner or progress bar
3. **Timeout Handling**: Automatic transition after specified duration
4. **Theme Support**: Light mode variant of gradient background
5. **Internationalization**: Multi-language support for tagline text
6. **Logo Variants**: Support for different logo sizes or formats (SVG)
