import React from 'react';
import './date-picker.css';

interface DatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  min?: string;
  max?: string;
  className?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value = '',
  onChange,
  placeholder = '请选择日期',
  disabled = false,
  error,
  min,
  max,
  className = ''
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={`date-picker-container ${error ? 'date-picker-error' : ''} ${className}`}>
      <input
        type="date"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        min={min}
        max={max}
        placeholder={placeholder}
        className={`date-picker-input ${error ? 'date-picker-input-error' : ''} ${disabled ? 'date-picker-disabled' : ''}`}
      />
      {error && <div className="date-picker-error-text">{error}</div>}
    </div>
  );
};
