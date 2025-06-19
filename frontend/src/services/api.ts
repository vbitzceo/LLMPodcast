import axios from 'axios';
import { 
  LLMProvider, 
  CreateLLMProviderRequest, 
  CreatePodcastRequest, 
  PodcastSession, 
  VoiceOption,
  PromptTemplate,
  TemplateValidationResult
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
  delete: (id: number) => api.delete(`/podcast/${id}`),
};

// Speech API
export const speechService = {
  getVoices: () => api.get<VoiceOption[]>('/speech/voices'),
};

// Template Management API
export const templateApi = {
  getAllTemplates: async (): Promise<Record<string, PromptTemplate>> => {
    const response = await fetch('/api/templates');
    if (!response.ok) throw new Error('Failed to fetch templates');
    return response.json();
  },

  getTemplate: async (templateName: string): Promise<PromptTemplate> => {
    const response = await fetch(`/api/templates/${templateName}`);
    if (!response.ok) throw new Error(`Failed to fetch template: ${templateName}`);
    return response.json();
  },

  updateTemplate: async (templateName: string, template: PromptTemplate): Promise<void> => {
    const response = await fetch(`/api/templates/${templateName}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(template)
    });
    if (!response.ok) throw new Error(`Failed to update template: ${templateName}`);
  },

  previewTemplate: async (templateName: string, variables: Record<string, string>): Promise<string> => {
    const response = await fetch(`/api/templates/${templateName}/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variables })
    });
    if (!response.ok) throw new Error('Failed to preview template');
    const result = await response.json();
    return result.preview;
  },

  validateTemplate: async (template: PromptTemplate): Promise<TemplateValidationResult> => {
    const response = await fetch('/api/templates/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(template)
    });
    if (!response.ok) throw new Error('Failed to validate template');
    return response.json();
  }
};

export default api;
