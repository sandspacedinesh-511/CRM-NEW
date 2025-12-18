import axiosInstance from '../utils/axios';

export const fetchTelecallerDashboard = async () => {
  const response = await axiosInstance.get('/telecaller/dashboard');
  return response.data;
};

export const fetchTelecallerTasks = async (params = {}) => {
  const response = await axiosInstance.get('/telecaller/tasks', { params });
  return response.data;
};

export const completeTelecallerTask = async (taskId, payload) => {
  const response = await axiosInstance.patch(`/telecaller/tasks/${taskId}/complete`, payload);
  return response.data;
};

export const rescheduleTelecallerTask = async (taskId, payload) => {
  const response = await axiosInstance.patch(`/telecaller/tasks/${taskId}/reschedule`, payload);
  return response.data;
};

export const exportTelecallerTasks = async (params = {}) => {
  const response = await axiosInstance.get('/telecaller/tasks/export', {
    params,
    responseType: 'blob'
  });
  return response.data;
};

export const importTelecallerTasks = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axiosInstance.post('/telecaller/tasks/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const fetchImportedTelecallerTasks = async () => {
  const response = await axiosInstance.get('/telecaller/tasks/imported');
  return response.data;
};

export const updateImportedTelecallerTask = async (id, payload) => {
  const response = await axiosInstance.patch(`/telecaller/tasks/imported/${id}`, payload);
  return response.data;
};

export const logTelecallerCallInitiated = async (payload) => {
  const response = await axiosInstance.post('/telecaller/calls/start', payload);
  return response.data;
};


