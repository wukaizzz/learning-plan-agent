import React from 'react';
import './CircularProgress.css';

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: React.ReactNode;
  className?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  size = 72,
  strokeWidth = 8,
  color = '#6d5dfc',
  trackColor = '#ede9fe',
  label,
  className = ''
}) => {
  const clampedValue = Math.max(0, Math.min(100, Math.round(value)));
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (clampedValue / 100) * circumference;

  return (
    <div
      className={`circular-progress ${className}`}
      style={{ width: size, height: size }}
      aria-label={`进度 ${clampedValue}%`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="circular-progress-track"
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          className="circular-progress-value"
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeOffset}
        />
      </svg>
      <div className="circular-progress-label">
        {label ?? `${clampedValue}%`}
      </div>
    </div>
  );
};
