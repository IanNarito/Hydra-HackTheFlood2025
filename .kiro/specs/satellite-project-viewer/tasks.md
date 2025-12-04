# Implementation Plan

- [x] 1. Set up satellite utilities and configuration

  - [x] 1.1 Create satellite utility functions
    - Create `frontend/src/utils/satelliteUtils.js` with URL generation functions
    - Implement `generateStaticMapUrl(lat, lng, zoom, width, height)` function
    - Implement `generateTileLayerUrl()` for interactive maps
    - Add coordinate validation helper functions
    - _Requirements: 1.1, 1.2_

  - [ ]* 1.2 Write property test for URL generation
    - **Property 1: Satellite URL Generation Correctness**
    - **Validates: Requirements 1.1**

  - [x] 1.3 Add environment configuration
    - Add `VITE_MAPBOX_ACCESS_TOKEN` to `.env.example`
    - Update `vite.config.js` if needed for environment variables
    - _Requirements: 1.1_

- [x] 2. Implement SatellitePreviewImage component

  - [x] 2.1 Create SatellitePreviewImage component
    - Create `frontend/src/components/Dashboard/SatellitePreviewImage.jsx`
    - Implement loading state with spinner
    - Implement error state with placeholder
    - Display project name overlay on successful load
    - Handle missing coordinates gracefully
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 2.2 Write property test for project name overlay
    - **Property 2: Project Name Overlay Rendering**
    - **Validates: Requirements 1.5**

  - [x] 2.3 Update ProjectModal to use SatellitePreviewImage
    - Replace static placeholder image with SatellitePreviewImage component
    - Pass project coordinates and name as props
    - _Requirements: 1.1, 1.5_

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement Satellite Evidence Page

  - [x] 4.1 Create SatelliteEvidence page component
    - Create `frontend/src/pages/SatelliteEvidence.jsx`
    - Fetch project details using project ID from route params
    - Display project header with name and contractor
    - Implement loading and error states
    - Add back navigation button
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ]* 4.2 Write property test for header information display
    - **Property 4: Project Header Information Display**
    - **Validates: Requirements 2.2**

  - [x] 4.3 Add route configuration
    - Add `/satellite/:projectId` route to App.jsx
    - _Requirements: 2.1_

  - [x] 4.4 Update ProjectModal navigation
    - Modify "View Satellite Evidence" button to navigate to satellite page
    - Pass project ID in navigation
    - _Requirements: 2.1_

  - [ ]* 4.5 Write property test for navigation route
    - **Property 3: Navigation Route Correctness**
    - **Validates: Requirements 2.1**

- [x] 5. Implement SatelliteMapView component

  - [x] 5.1 Create SatelliteMapView component
    - Create `frontend/src/components/Satellite/SatelliteMapView.jsx`
    - Integrate Leaflet with Mapbox satellite tile layer
    - Center map on project coordinates
    - Implement zoom controls
    - Support full-screen mode toggle
    - _Requirements: 2.3, 4.3, 4.4, 5.3_

  - [ ]* 5.2 Write property test for map center coordinates
    - **Property 5: Map Center Coordinates**
    - **Validates: Requirements 2.3**

  - [x] 5.3 Integrate SatelliteMapView into SatelliteEvidence page
    - Add SatelliteMapView to page layout
    - Pass project coordinates as props
    - _Requirements: 2.3_

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement TimelineControl component

  - [x] 7.1 Create TimelineControl component





    - Create `frontend/src/components/Satellite/TimelineControl.jsx`
    - Implement date range slider using project start date to current date
    - Display reference markers for start and current dates
    - Emit date change events on slider interaction
    - Style for dark theme consistency
    - _Requirements: 3.1, 3.4, 3.5_

  - [ ]* 7.2 Write property test for timeline reference markers
    - **Property 7: Timeline Reference Markers**
    - **Validates: Requirements 3.4**

  - [x] 7.3 Integrate TimelineControl with SatelliteEvidence page





    - Add TimelineControl to page layout
    - Connect date selection to satellite view updates
    - Handle unavailable dates with fallback notification
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ]* 7.4 Write property test for date selection
    - **Property 6: Timeline Date Selection Updates View**
    - **Validates: Requirements 3.2**

- [x] 8. Implement mobile responsiveness




  - [x] 8.1 Add responsive styles to SatelliteEvidence page



    - Implement single-column layout for mobile viewports
    - Ensure timeline control is touch-friendly
    - Test on various screen sizes
    - _Requirements: 5.1, 5.2_

- [x] 9. Final Checkpoint - Ensure all tests pass



  - Ensure all tests pass, ask the user if questions arise.
