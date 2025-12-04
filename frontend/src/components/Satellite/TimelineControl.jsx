import { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar, Clock } from 'lucide-react';

/**
 * TimelineControl Component
 * Provides a date range slider for selecting historical satellite imagery dates
 * 
 * @param {Object} props
 * @param {Date} props.startDate - Project start date (beginning of timeline)
 * @param {Date} props.endDate - End date (typically current date)
 * @param {Date} props.selectedDate - Currently selected date
 * @param {function} props.onDateChange - Callback when date selection changes
 * @param {Date[]} [props.availableDates] - Optional array of dates with available imagery
 */
const TimelineControl = ({
  startDate,
  endDate,
  selectedDate,
  onDateChange,
  availableDates = [],
}) => {
  const sliderRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);

  // Normalize dates to start of day for consistent comparison
  const normalizeDate = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const normalizedStart = normalizeDate(startDate);
  const normalizedEnd = normalizeDate(endDate);
  const normalizedSelected = normalizeDate(selectedDate);

  // Calculate total days in range
  const totalDays = Math.max(1, Math.floor((normalizedEnd - normalizedStart) / (1000 * 60 * 60 * 24)));

  // Convert date to slider value (0-100)
  const dateToSliderValue = useCallback((date) => {
    const normalized = normalizeDate(date);
    const daysDiff = Math.floor((normalized - normalizedStart) / (1000 * 60 * 60 * 24));
    return Math.min(100, Math.max(0, (daysDiff / totalDays) * 100));
  }, [normalizedStart, totalDays]);

  // Convert slider value to date
  const sliderValueToDate = useCallback((value) => {
    const days = Math.round((value / 100) * totalDays);
    const date = new Date(normalizedStart);
    date.setDate(date.getDate() + days);
    return date;
  }, [normalizedStart, totalDays]);

  // Initialize slider value from selected date
  useEffect(() => {
    setSliderValue(dateToSliderValue(selectedDate));
  }, [selectedDate, dateToSliderValue]);

  // Handle slider change
  const handleSliderChange = (e) => {
    const newValue = parseFloat(e.target.value);
    setSliderValue(newValue);
    
    const newDate = sliderValueToDate(newValue);
    onDateChange(newDate);
  };

  // Handle touch/mouse drag for smoother interaction
  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Format date for display
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format date for short display
  const formatShortDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  };

  // Check if a date has available imagery
  const hasAvailableImagery = (date) => {
    if (availableDates.length === 0) return true;
    const normalized = normalizeDate(date);
    return availableDates.some(d => normalizeDate(d).getTime() === normalized.getTime());
  };

  // Calculate marker positions for available dates
  const getAvailableDateMarkers = () => {
    if (availableDates.length === 0) return [];
    return availableDates.map(date => ({
      date,
      position: dateToSliderValue(date),
    }));
  };

  const availableMarkers = getAvailableDateMarkers();
  const isSelectedDateAvailable = hasAvailableImagery(selectedDate);

  return (
    <div className="bg-[#161616] border border-gray-800 rounded-lg p-3 sm:p-4 md:p-6">
      {/* Header - Stacks on very small screens */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-red-500" />
          <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
            Historical Timeline
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Calendar size={14} />
          <span>{formatDate(normalizedSelected)}</span>
        </div>
      </div>

      {/* Selected Date Display - Responsive padding */}
      <div className="mb-4 p-2 sm:p-3 bg-[#0d1117] rounded-lg border border-gray-800">
        <div className="text-center">
          <span className="text-xs text-gray-500 uppercase tracking-wide">Selected Date</span>
          <p className="text-base sm:text-lg font-bold text-white mt-1">{formatDate(normalizedSelected)}</p>
          {!isSelectedDateAvailable && availableDates.length > 0 && (
            <p className="text-xs text-yellow-500 mt-1">
              Imagery may not be available for this date
            </p>
          )}
        </div>
      </div>

      {/* Timeline Slider */}
      <div className="relative pt-2 pb-6">
        {/* Reference Markers */}
        <div className="absolute top-0 left-0 right-0 flex justify-between text-xs text-gray-500 mb-2">
          <div className="flex flex-col items-start" data-testid="start-date-marker">
            <span className="text-red-500 font-medium">Start</span>
            <span>{formatShortDate(normalizedStart)}</span>
          </div>
          <div className="flex flex-col items-end" data-testid="current-date-marker">
            <span className="text-green-500 font-medium">Current</span>
            <span>{formatShortDate(normalizedEnd)}</span>
          </div>
        </div>

        {/* Slider Track */}
        <div className="relative mt-8">
          {/* Background Track */}
          <div className="absolute inset-0 h-2 bg-gray-800 rounded-full top-1/2 -translate-y-1/2" />
          
          {/* Progress Track */}
          <div 
            className="absolute h-2 bg-gradient-to-r from-red-600 to-red-500 rounded-full top-1/2 -translate-y-1/2"
            style={{ width: `${sliderValue}%` }}
          />

          {/* Available Date Markers */}
          {availableMarkers.map((marker, index) => (
            <div
              key={index}
              className="absolute w-1 h-4 bg-green-500/50 rounded-full top-1/2 -translate-y-1/2 -translate-x-1/2"
              style={{ left: `${marker.position}%` }}
              title={formatDate(marker.date)}
            />
          ))}

          {/* Range Input - Touch-friendly with larger thumb on mobile (Requirements 5.2) */}
          <input
            ref={sliderRef}
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={sliderValue}
            onChange={handleSliderChange}
            onMouseDown={handleDragStart}
            onMouseUp={handleDragEnd}
            onTouchStart={handleDragStart}
            onTouchEnd={handleDragEnd}
            className="relative w-full h-3 sm:h-2 appearance-none bg-transparent cursor-pointer z-10 touch-pan-x
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-7
              [&::-webkit-slider-thumb]:h-7
              [&::-webkit-slider-thumb]:sm:w-5
              [&::-webkit-slider-thumb]:sm:h-5
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-red-500
              [&::-webkit-slider-thumb]:border-2
              [&::-webkit-slider-thumb]:border-white
              [&::-webkit-slider-thumb]:shadow-lg
              [&::-webkit-slider-thumb]:cursor-grab
              [&::-webkit-slider-thumb]:active:cursor-grabbing
              [&::-webkit-slider-thumb]:transition-transform
              [&::-webkit-slider-thumb]:hover:scale-110
              [&::-webkit-slider-thumb]:active:scale-125
              [&::-moz-range-thumb]:w-7
              [&::-moz-range-thumb]:h-7
              [&::-moz-range-thumb]:sm:w-5
              [&::-moz-range-thumb]:sm:h-5
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-red-500
              [&::-moz-range-thumb]:border-2
              [&::-moz-range-thumb]:border-white
              [&::-moz-range-thumb]:shadow-lg
              [&::-moz-range-thumb]:cursor-grab
              [&::-moz-range-thumb]:active:cursor-grabbing"
            aria-label="Timeline date selector"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={sliderValue}
            aria-valuetext={formatDate(normalizedSelected)}
          />
        </div>

        {/* Timeline Ticks */}
        <div className="flex justify-between mt-2 px-1">
          {[0, 25, 50, 75, 100].map((tick) => (
            <div key={tick} className="flex flex-col items-center">
              <div className="w-px h-2 bg-gray-700" />
            </div>
          ))}
        </div>
      </div>

      {/* Quick Navigation Buttons - Touch-friendly with larger targets on mobile (Requirements 5.2) */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 mt-3 sm:mt-2">
        <QuickNavButton
          label="Start"
          onClick={() => onDateChange(new Date(normalizedStart))}
          isActive={sliderValue === 0}
        />
        <QuickNavButton
          label="6 months ago"
          onClick={() => {
            const date = new Date(normalizedEnd);
            date.setMonth(date.getMonth() - 6);
            if (date >= normalizedStart) {
              onDateChange(date);
            } else {
              onDateChange(new Date(normalizedStart));
            }
          }}
          isActive={false}
        />
        <QuickNavButton
          label="3 months ago"
          onClick={() => {
            const date = new Date(normalizedEnd);
            date.setMonth(date.getMonth() - 3);
            if (date >= normalizedStart) {
              onDateChange(date);
            } else {
              onDateChange(new Date(normalizedStart));
            }
          }}
          isActive={false}
        />
        <QuickNavButton
          label="Current"
          onClick={() => onDateChange(new Date(normalizedEnd))}
          isActive={sliderValue === 100}
        />
      </div>
    </div>
  );
};

/**
 * Quick navigation button component - Touch-friendly with min 44px touch target (Requirements 5.2)
 */
const QuickNavButton = ({ label, onClick, isActive }) => (
  <button
    onClick={onClick}
    className={`px-3 py-2.5 sm:py-1.5 text-xs sm:text-xs font-medium rounded-lg transition-colors min-h-[44px] sm:min-h-0
      ${isActive 
        ? 'bg-red-600 text-white' 
        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white active:bg-gray-600'
      }`}
  >
    {label}
  </button>
);

export default TimelineControl;
