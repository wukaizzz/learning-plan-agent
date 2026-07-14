import React, { useRef, useState } from 'react';
import './select.css';

interface SelectProps {
  value?: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({
  value = '',
  onChange,
  options,
  placeholder = '请选择',
  disabled = false,
  error,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const displayValue = options.find(opt => opt === value) || '';

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div
      ref={selectRef}
      className={`select-container ${error ? 'select-error' : ''} ${disabled ? 'select-disabled' : ''} ${className}`}
    >
      <div
        className={`select-trigger ${isOpen ? 'select-open' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={`select-value ${!displayValue ? 'select-placeholder' : ''}`}>
          {displayValue || placeholder}
        </span>
        <svg
          className={`select-arrow ${isOpen ? 'select-arrow-up' : ''}`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {isOpen && !disabled && (
        <div className="select-dropdown">
          {options.map((option) => (
            <div
              key={option}
              className={`select-option ${option === value ? 'select-option-selected' : ''}`}
              onClick={() => handleSelect(option)}
            >
              {option}
            </div>
          ))}
        </div>
      )}

      {error && <div className="select-error-text">{error}</div>}
    </div>
  );
};
