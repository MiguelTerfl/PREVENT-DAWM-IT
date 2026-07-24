import axios from 'axios';
import { supabase } from '@/lib/supabase';

const apiClient = axios.create({
  baseURL: '',
  headers: { 'Content-Type': 'application/json' },
});

// Attach the Supabase JWT to every request when a session is active
apiClient.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export { apiClient };

export const api = {
  chat: async (userId: string, userInput: string) => {
    const response = await apiClient.post('/api/chat', { user_id: userId, user_input: userInput });
    return response.data;
  },
  admin: {
    getAgents: async () => {
      const response = await apiClient.get('/api/admin/agents');
      return response.data;
    },
    getConversations: async () => {
      const response = await apiClient.get('/api/admin/conversations');
      return response.data;
    },
    getUsers: async () => {
      const response = await apiClient.get('/api/admin/users');
      return response.data;
    },
    updateUserRole: async (userId: string, role: string) => {
      const response = await apiClient.post(`/api/admin/users/${userId}/role`, { role });
      return response.data;
    },
  },
  profile: {
    getOnboardingStatus: async () => {
      const response = await apiClient.get('/api/profile/onboarding-status');
      return response.data as { onboarding_completed: boolean };
    },
    completeOnboarding: async (name: string) => {
      const response = await apiClient.post('/api/profile/complete-onboarding', { name });
      return response.data;
    },
    getMe: async () => {
      const response = await apiClient.get('/api/profile/me');
      return response.data;
    },
  },
  coach: {
    getMe: async () => {
      const response = await apiClient.post('/api/coach/me');
      return response.data;
    },
    getPatients: async () => {
      const response = await apiClient.get('/api/coach/patients');
      return response.data;
    },
    getAllPatients: async () => {
      const response = await apiClient.get('/api/coach/patients/all');
      return response.data;
    },
    assignPatient: async (patientId: string, physicianId?: string) => {
      const response = await apiClient.post('/api/coach/assign', { patient_id: patientId, physician_id: physicianId });
      return response.data;
    },
    getPatientHistory: async (patientId: string) => {
      const response = await apiClient.get(`/api/coach/patient/${patientId}/history`);
      return response.data;
    },
    getPatientVitals: async (patientId: string) => {
      const response = await apiClient.get(`/api/coach/patient/${patientId}/vitals`);
      return response.data;
    },
  },
};

