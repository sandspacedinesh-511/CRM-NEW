import axiosInstance from '../utils/axios';

export const fetchMarketingDashboard = async () => {
  const response = await axiosInstance.get('/marketing/dashboard');
  return response.data;
};

export const fetchMarketingLeads = async (params = {}) => {
  const response = await axiosInstance.get('/marketing/leads', { params });
  return response.data;
};

export const exportMarketingLeads = async (params = {}) => {
  const response = await axiosInstance.get('/marketing/leads/export', {
    params,
    responseType: 'blob'
  });
  return response.data;
};

export const fetchMarketingActivities = async (params = {}) => {
  const response = await axiosInstance.get('/marketing/activities', { params });
  return response.data;
};

