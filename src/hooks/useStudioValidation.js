import { useState, useEffect } from 'react';
import useDebounce from './useDebounce';
import { checkStudioNameAvailability, checkSubdomainAvailability } from '../services/studioService';

/**
 * Custom hook for validating studio name and subdomain
 * Handles debouncing and API calls for real-time validation
 * 
 * @param {string} type - Either 'name' or 'subdomain'
 * @returns {object} Validation state and helpers
 */
const useStudioValidation = (type = 'name') => {
  const [value, setValue] = useState('');
  const [isValid, setIsValid] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  
  const debouncedValue = useDebounce(value, 500);

  useEffect(() => {
    // Don't validate empty values
    if (!debouncedValue || debouncedValue.trim() === '') {
      setIsValid(null);
      setError('');
      setSuggestions([]);
      return;
    }

    // Validate based on type
    if (type === 'name') {
      validateStudioName(debouncedValue);
    } else if (type === 'subdomain') {
      validateSubdomain(debouncedValue);
    }
  }, [debouncedValue, type]);

  const validateStudioName = async (name) => {
    // Validate format
    if (name.length < 3) {
      setIsValid(false);
      setError('Studio name must be at least 3 characters long');
      setIsChecking(false);
      return;
    }

    if (name.length > 50) {
      setIsValid(false);
      setError('Studio name must not exceed 50 characters');
      setIsChecking(false);
      return;
    }

    setIsChecking(true);
    setError('');
    
    try {
      const response = await checkStudioNameAvailability(name);
      
      if (response.data?.data?.available) {
        setIsValid(true);
        setError('');
      } else {
        setIsValid(false);
        setError(response.data?.data?.message || 'Studio name is already taken');
      }
    } catch (err) {
      setIsValid(false);
      setError(err.response?.data?.message || 'Unable to verify studio name availability');
      console.error('Studio name validation error:', err);
    } finally {
      setIsChecking(false);
    }
  };

  const validateSubdomain = async (subdomain) => {
    // Validate format
    if (subdomain.length < 3) {
      setIsValid(false);
      setError('Subdomain must be at least 3 characters long');
      setIsChecking(false);
      return;
    }

    if (subdomain.length > 63) {
      setIsValid(false);
      setError('Subdomain must not exceed 63 characters');
      setIsChecking(false);
      return;
    }

    // Check format: only alphanumeric and hyphens
    if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(subdomain.toLowerCase())) {
      setIsValid(false);
      setError('Subdomain can only contain lowercase letters, numbers, and hyphens (cannot start or end with hyphen)');
      setIsChecking(false);
      return;
    }

    setIsChecking(true);
    setError('');
    
    try {
      const response = await checkSubdomainAvailability(subdomain);
      
      if (response.data?.data?.available) {
        setIsValid(true);
        setError('');
        setSuggestions([]);
      } else {
        setIsValid(false);
        setError(response.data?.data?.message || 'Subdomain is already taken');
        setSuggestions(response.data?.data?.suggestions || []);
      }
    } catch (err) {
      setIsValid(false);
      setError(err.response?.data?.message || 'Unable to verify subdomain availability');
      console.error('Subdomain validation error:', err);
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
    suggestions,
    debouncedValue
  };
};

export default useStudioValidation;
