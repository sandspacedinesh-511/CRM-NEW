import { format, isValid, parseISO } from 'date-fns';

export const formatDate = (dateString) => {
  if (!dateString) return 'Not available';
  const date = parseISO(dateString);
  return isValid(date) ? format(date, 'MMM d, yyyy') : 'Invalid date';
};

export const formatDateTime = (dateString) => {
  if (!dateString) return 'Not available';
  const date = parseISO(dateString);
  return isValid(date) ? format(date, 'MMM d, yyyy h:mm a') : 'Invalid date';
};

export const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = parseISO(dateString);
  return isValid(date) ? format(date, 'yyyy-MM-dd') : '';
};

export const formatTimeForInput = (dateString) => {
  if (!dateString) return '';
  const date = parseISO(dateString);
  return isValid(date) ? format(date, 'HH:mm') : '';
};

export const getCurrentDate = () => {
  return format(new Date(), 'yyyy-MM-dd');
};

export const getLastMonthDate = () => {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return format(date, 'yyyy-MM-dd');
}; 