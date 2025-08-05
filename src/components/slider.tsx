import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/PolygonContext';
import { hourIndexToDate, getHourOfDay } from '../utils/Weather';

const HOURS_IN_30_DAYS = 24 * 30;
const TODAY_HOUR_INDEX = 360;

const SliderThumb = ({ style, children, ...props }) => (
  <div
    {...props}
    className="h-6 w-6 bg-orange-500 rounded-full cursor-grab flex justify-center items-center text-white text-xs font-bold shadow-md absolute -top-2"
    style={{
      ...style,
      transform: `translateX(-50%)`,
    }}
  >
    {children}
  </div>
);

const SliderTrack = ({ startPercent, endPercent }) => (
  <div
    className="absolute top-0 h-full bg-orange-500 rounded-full"
    style={{
      left: `${startPercent}%`,
      width: `${endPercent - startPercent}%`,
    }}
  />
);

const CustomSlider = ({ min, max, value, onChange, range = false }) => {
  const [isDragging, setIsDragging] = useState(null);
  const sliderRef = React.useRef(null);

  const getPercentage = (val) => ((val - min) / (max - min)) * 100;

  const handleMouseDown = (e, thumbIndex) => {
    e.preventDefault();
    setIsDragging(thumbIndex);
  };

  const handleMouseMove = (e) => {
    if (isDragging === null || !sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const newValue = min + (percentage / 100) * (max - min);
    const roundedValue = Math.round(newValue);

    if (range) {
      const newRange = [...value];
      newRange[isDragging] = roundedValue;

      if (isDragging === 0 && newRange[0] >= newRange[1]) newRange[0] = newRange[1] - 1;
      if (isDragging === 1 && newRange[1] <= newRange[0]) newRange[1] = newRange[0] + 1;

      onChange(newRange);
    } else {
      onChange(roundedValue);
    }
  };

  const handleMouseUp = () => setIsDragging(null);

  useEffect(() => {
    if (isDragging !== null) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  if (range) {
    const startPercent = getPercentage(value[0]);
    const endPercent = getPercentage(value[1]);

    return (
      <div ref={sliderRef} className="relative w-full h-6 bg-gray-300 rounded-full">
        <SliderTrack startPercent={startPercent} endPercent={endPercent} />
        <SliderThumb
          style={{ left: `${startPercent}%` }}
          onMouseDown={(e) => handleMouseDown(e, 0)}
        >
          {value[0]}
        </SliderThumb>
        <SliderThumb
          style={{ left: `${endPercent}%` }}
          onMouseDown={(e) => handleMouseDown(e, 1)}
        >
          {value[1]}
        </SliderThumb>
      </div>
    );
  }

  const percent = getPercentage(value);
  return (
    <div ref={sliderRef} className="relative w-full h-6 bg-gray-300 rounded-full">
      <div
        className="absolute top-1/2 transform -translate-y-1/2 h-1.5 bg-orange-500 rounded-full"
        style={{ width: `${percent}%` }}
      />
      <SliderThumb style={{ left: `${percent}%` }} onMouseDown={(e) => handleMouseDown(e, 0)}>
        {value}
      </SliderThumb>
    </div>
  );
};

const formatDateTime = (hourIndex: number) => {
  const date = hourIndexToDate(hourIndex);
  const hour = getHourOfDay(hourIndex);
  const dateObj = new Date(date);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  return `${formattedDate} ${hour}:00`;
};

const formatDuration = (hours: number): string => {
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return `${days}d ${remHours}h`;
};

function TimelineSlider({ range = true }) {
  const context = useContext(AppContext);
  const [value, setValue] = useState(
    range ? [TODAY_HOUR_INDEX - 50, TODAY_HOUR_INDEX + 50] : TODAY_HOUR_INDEX
  );

  if (!context) {
    throw new Error('TimelineSlider must be used within AppProvider');
  }

  const { setTimeRange } = context;

  useEffect(() => {
    if (range && Array.isArray(value)) {
      setTimeRange({ 
        startDate: hourIndexToDate(value[0]), 
        endDate: hourIndexToDate(value[1]) 
      });
    } else if (!range && typeof value === 'number') {
      setTimeRange({ 
        startDate: hourIndexToDate(value), 
        endDate: hourIndexToDate(value) 
      });
    }
  }, [value, range, setTimeRange]);

  return (
    <div className="w-full px-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Time Range Selector</h3>
        <p className="text-sm text-gray-600 mb-4">Select the time period for weather data analysis</p>
      </div>

      <CustomSlider
        min={0}
        max={HOURS_IN_30_DAYS}
        value={value}
        onChange={setValue}
        range={range}
      />

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        {range ? (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Start Time:</span>
              <span className="font-semibold text-orange-600">{formatDateTime(parseInt(value[0]))}</span>
            </div>
            <div className="flex justify-between">
              <span>End Time:</span>
              <span className="font-semibold text-orange-600">{formatDateTime(value[1])}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span>Duration:</span>
              <span className="font-bold text-blue-600">{formatDuration(value[1] - value[0])}</span>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <span>Selected Time: </span>
            <span className="font-bold text-orange-600">{formatDateTime(value as number)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default TimelineSlider;
