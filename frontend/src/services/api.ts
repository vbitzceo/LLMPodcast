import axios from 'axios';
import { 
  LLMProvider, 
  CreateLLMProviderRequest, 
  CreatePodcastRequest, 
  PodcastSession, 
  VoiceOption 
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
});

// LLM Providers API
export const llmProviderService = {
  getAll: () => api.get<LLMProvider[]>('/llmproviders'),
  getById: (id: number) => api.get<LLMProvider>(`/llmproviders/${id}`),
  create: (data: CreateLLMProviderRequest) => api.post<LLMProvider>('/llmproviders', data),
  update: (id: number, data: Partial<CreateLLMProviderRequest>) => 
    api.put(`/llmproviders/${id}`, data),
  delete: (id: number) => api.delete(`/llmproviders/${id}`),
};

// Podcast API
export const podcastService = {
  getAll: () => api.get<PodcastSession[]>('/podcast'),
  getById: (id: number) => api.get<PodcastSession>(`/podcast/${id}`),
  create: (data: CreatePodcastRequest) => api.post<PodcastSession>('/podcast', data),
  generate: (id: number) => api.post<PodcastSession>(`/podcast/${id}/generate`),
};

// Speech API
export const speechService = {
  getVoices: () => api.get<VoiceOption[]>('/speech/voices'),
};

export default api;
