import { useState, useEffect } from 'react';
import useDebounce from './useDebounce';
import { checkExperienceNameAvailability } from '../services/experienceService';

/**
 * Custom hook for validating experience name/title
 * Handles debouncing and API calls for real-time validation
 * 
 * @returns {object} Validation state and helpers
 */
const useExperienceValidation = () => {
  const [value, setValue] = useState('');
  const [isValid, setIsValid] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState('');
  
  const debouncedValue = useDebounce(value, 500);

  useEffect(() => {
    // Don't validate empty values
    if (!debouncedValue || debouncedValue.trim() === '') {
      setIsValid(null);
      setError('');
      return;
    }

    validateExperienceName(debouncedValue);
  }, [debouncedValue]);

  const validateExperienceName = async (name) => {
    // Validate format
    if (name.length < 3) {
      setIsValid(false);
      setError('Experience name must be at least 3 characters long');
      setIsChecking(false);
      return;
    }

    if (name.length > 200) {
      setIsValid(false);
      setError('Experience name must not exceed 200 characters');
      setIsChecking(false);
      return;
    }

    setIsChecking(true);
    setError('');
    
    try {
      const response = await checkExperienceNameAvailability(name);
      
      if (response.data?.data?.available) {
        setIsValid(true);
        setError('');
      } else {
        setIsValid(false);
        setError(response.data?.data?.message || 'Experience name is already taken');
      }
    } catch (err) {
      setIsValid(false);
      setError(err.response?.data?.message || 'Unable to verify experience name availability');
      console.error('Experience name validation error:', err);
    } finally {
      setIsChecking(false);
    }
  };

  return {
    value,
    setValue,
    isValid,
    isChecking,
    error,
    debouncedValue
  };
};

export default useExperienceValidation;
