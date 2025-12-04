# Requirements Document

## Introduction

This document specifies the requirements for the Satellite Project Viewer feature in the HYDRA Anti-Corruption Intelligence Platform. The feature enhances the ProjectModal component to display dynamic satellite imagery based on the project's geographic location and provides a dedicated satellite evidence page with historical imagery rewind capabilities. This enables investigators to visually verify construction progress over time and detect potential discrepancies between reported and actual project status.

## Glossary

- **ProjectModal**: The modal dialog component that displays detailed information about a selected infrastructure project
- **Project Preview Image**: The thumbnail image displayed within the ProjectModal showing a visual representation of the project location
- **Satellite Evidence Page**: A dedicated page for viewing satellite imagery with historical timeline controls
- **Historical Imagery Rewind**: The ability to view satellite images from different dates to track construction progress over time
- **Satellite Imagery API**: External service providing real-time and historical satellite imagery (e.g., Mapbox, Google Maps Static API, Sentinel Hub)
- **Project Coordinates**: The latitude and longitude values associated with each infrastructure project
- **Timeline Slider**: UI control allowing users to select different dates for historical satellite imagery

## Requirements

### Requirement 1

**User Story:** As an investigator, I want the project preview image to show the actual satellite view of the project location, so that I can see the real geographic context of the infrastructure project.

#### Acceptance Criteria

1. WHEN the ProjectModal renders with a project containing valid coordinates THEN the Project Preview Image SHALL display a satellite image centered on the project's latitude and longitude
2. WHEN the ProjectModal renders with a project missing coordinates THEN the Project Preview Image SHALL display a placeholder image with an appropriate message
3. WHEN the satellite image is loading THEN the Project Preview Image SHALL display a loading indicator
4. WHEN the satellite image fails to load THEN the Project Preview Image SHALL display a fallback placeholder with an error message
5. WHEN the satellite image loads successfully THEN the Project Preview Image SHALL display the project name as an overlay label

### Requirement 2

**User Story:** As an investigator, I want to access a dedicated satellite evidence page, so that I can examine the project location in greater detail.

#### Acceptance Criteria

1. WHEN a user clicks the "View Satellite Evidence" button THEN the System SHALL navigate to the Satellite Evidence Page for that specific project
2. WHEN the Satellite Evidence Page loads THEN the Page SHALL display the project name and basic information in a header section
3. WHEN the Satellite Evidence Page loads THEN the Page SHALL display a full-screen satellite map view centered on the project coordinates
4. WHEN the Satellite Evidence Page loads THEN the Page SHALL include a back navigation button to return to the previous view

### Requirement 3

**User Story:** As an investigator, I want to view historical satellite imagery of a project location, so that I can verify construction progress over time.

#### Acceptance Criteria

1. WHEN the Satellite Evidence Page renders THEN the Page SHALL display a timeline control for selecting historical dates
2. WHEN a user selects a date on the timeline THEN the Satellite View SHALL update to show imagery from that date or the nearest available date
3. WHEN historical imagery is unavailable for a selected date THEN the System SHALL display the nearest available imagery with a notification of the actual date shown
4. WHEN the timeline renders THEN the Timeline Control SHALL indicate the project's start date and current date as reference points
5. WHEN a user drags the timeline slider THEN the Satellite View SHALL update in near real-time to show the corresponding historical imagery

### Requirement 4

**User Story:** As an investigator, I want clear visual feedback during satellite image operations, so that I understand the system state at all times.

#### Acceptance Criteria

1. WHEN satellite imagery is being fetched THEN the System SHALL display a loading spinner with descriptive text
2. WHEN an API error occurs THEN the System SHALL display a user-friendly error message with retry option
3. WHEN the user hovers over the satellite image THEN the System SHALL display zoom controls
4. WHEN the satellite view is in full-screen mode THEN the System SHALL provide an exit full-screen button

### Requirement 5

**User Story:** As a user on a mobile device, I want the satellite viewer to work on smaller screens, so that I can investigate projects from any device.

#### Acceptance Criteria

1. WHEN the Satellite Evidence Page renders on mobile THEN the Layout SHALL adapt to a single-column vertical arrangement
2. WHEN the timeline control renders on mobile THEN the Timeline Control SHALL remain usable with touch gestures
3. WHEN the satellite map renders on mobile THEN the Map SHALL support pinch-to-zoom and pan gestures

