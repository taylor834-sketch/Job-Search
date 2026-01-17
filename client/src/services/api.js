import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const searchJobs = async (searchParams) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/jobs/search`, searchParams);
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw new Error(
      error.response?.data?.error ||
      'Failed to search for jobs. Please check your connection and try again.'
    );
  }
};
