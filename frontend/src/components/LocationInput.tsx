import React from 'react';
import { useLocationAutocomplete } from '../hooks/useLocationAutocomplete';
import type { LocationOption } from '../utils/locations';
import styles from './LocationInput.module.css';

interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

export const LocationInput: React.FC<LocationInputProps> = ({
  value,
  onChange,
  placeholder = 'Ketik lokasi...',
  label = 'Location',
  required = false,
  disabled = false,
}) => {
  const {
    inputValue,
    setInputValue,
    suggestions,
    isOpen,
    setIsOpen,
    selectedIndex,
    selectSuggestion,
    handleKeyDown,
    inputRef,
    containerRef,
  } = useLocationAutocomplete(value);

  // Update parent when suggestion is selected
  const handleSelectSuggestion = (option: LocationOption) => {
    selectSuggestion(option);
    onChange(option.value);
  };

  // Update parent when input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
  };

  return (
    <div ref={containerRef} className={styles.locationContainer}>
      <label className={styles.label}>
        {label} {required && <span className={styles.required}>*</span>}
      </label>
      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue.trim().length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={styles.input}
          autoComplete="off"
        />
        {isOpen && suggestions.length > 0 && (
          <div className={styles.dropdown}>
            <ul className={styles.suggestionsList}>
              {suggestions.map((suggestion, index) => (
                <li
                  key={suggestion.value}
                  className={`${styles.suggestionItem} ${
                    index === selectedIndex ? styles.selected : ''
                  }`}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  onMouseEnter={() => {}}
                >
                  📍 {suggestion.label}
                </li>
              ))}
            </ul>
          </div>
        )}
        {isOpen && suggestions.length === 0 && inputValue.trim().length > 0 && (
          <div className={styles.dropdown}>
            <div className={styles.noResults}>
              Tidak ada lokasi yang cocok. Anda bisa mengetikkan lokasi custom.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationInput;
