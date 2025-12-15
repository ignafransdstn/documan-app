import { useState, useCallback, useRef, useEffect } from 'react';
import { getLocationSuggestions } from '../utils/locations';
import type { LocationOption } from '../utils/locations';

export const useLocationAutocomplete = (initialValue: string = '') => {
  const [inputValue, setInputValue] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<LocationOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update suggestions when input changes
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
    if (value.trim().length > 0) {
      const newSuggestions = getLocationSuggestions(value);
      setSuggestions(newSuggestions);
      setIsOpen(true);
      setSelectedIndex(-1);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, []);

  // Select a suggestion
  const selectSuggestion = useCallback((option: LocationOption) => {
    setInputValue(option.value);
    setIsOpen(false);
    setSuggestions([]);
    setSelectedIndex(-1);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          selectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  }, [isOpen, suggestions, selectedIndex, selectSuggestion]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return {
    inputValue,
    setInputValue: handleInputChange,
    suggestions,
    isOpen,
    setIsOpen,
    selectedIndex,
    selectSuggestion,
    handleKeyDown,
    inputRef,
    containerRef,
  };
};
