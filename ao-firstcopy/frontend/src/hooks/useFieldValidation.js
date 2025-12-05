import { useState, useCallback, useRef } from 'react';
import axiosInstance from '../utils/axios';

export const useFieldValidation = () => {
  const [validationStates, setValidationStates] = useState({});
  const validationTimeouts = useRef({});

  const validateField = useCallback(async (fieldType, value, fieldName) => {
    // Clear previous timeout
    if (validationTimeouts.current[fieldName]) {
      clearTimeout(validationTimeouts.current[fieldName]);
    }

    // Set loading state
    setValidationStates(prev => ({
      ...prev,
      [fieldName]: { loading: true, exists: false, message: '' }
    }));

    // Debounce validation (wait 500ms after user stops typing)
    validationTimeouts.current[fieldName] = setTimeout(async () => {
      if (!value || value.trim().length < 3) {
        setValidationStates(prev => ({
          ...prev,
          [fieldName]: { loading: false, exists: false, message: '' }
        }));
        return;
      }

      try {
        let endpoint = '';
        let payload = {};

        switch (fieldType) {
          case 'email':
            endpoint = '/validation/email';
            payload = { email: value.toLowerCase().trim() };
            break;
          case 'phone':
            endpoint = '/validation/phone';
            payload = { phone: value };
            break;
          case 'passport':
            endpoint = '/validation/passport';
            payload = { passportNumber: value.toUpperCase().trim() };
            break;
          default:
            return;
        }

        const response = await axiosInstance.post(endpoint, payload);
        
        setValidationStates(prev => ({
          ...prev,
          [fieldName]: {
            loading: false,
            exists: response.data.exists,
            message: response.data.message,
            student: response.data.student
          }
        }));

      } catch (error) {
        console.error(`Error validating ${fieldName}:`, error);
        setValidationStates(prev => ({
          ...prev,
          [fieldName]: { 
            loading: false, 
            exists: false, 
            message: 'Validation error - please try again' 
          }
        }));
      }
    }, 500);
  }, []);

  const clearValidation = useCallback((fieldName) => {
    setValidationStates(prev => {
      const newState = { ...prev };
      delete newState[fieldName];
      return newState;
    });
    
    if (validationTimeouts.current[fieldName]) {
      clearTimeout(validationTimeouts.current[fieldName]);
      delete validationTimeouts.current[fieldName];
    }
  }, []);

  const clearAllValidations = useCallback(() => {
    setValidationStates({});
    Object.values(validationTimeouts.current).forEach(timeout => clearTimeout(timeout));
    validationTimeouts.current = {};
  }, []);

  return {
    validationStates,
    validateField,
    clearValidation,
    clearAllValidations
  };
};
