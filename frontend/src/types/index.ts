export interface LLMProvider {
  id: number;
  name: string;
  type: LLMProviderType;
  apiKey?: string;
  endpoint?: string;
  deploymentName?: string;
  modelName?: string;
  isActive: boolean;
  createdAt: string;
}

export enum LLMProviderType {
  OpenAI = 1,
  AzureOpenAI = 2,
  LMStudio = 3,
  Ollama = 4
}

export interface Participant {
  id: number;
  name: string;
  persona: string;
  llmProviderId: number;
  voiceName?: string;
  isHost: boolean;
}

export interface ParticipantRequest {
  name: string;
  persona: string;
  llmProviderId: number;
  voiceName?: string;
  isHost: boolean;
}

export interface CreatePodcastRequest {
  topic: string;
  participants: ParticipantRequest[];
  rounds: number;
}

export interface CreateLLMProviderRequest {
  name: string;
  type: LLMProviderType;
  apiKey?: string;
  endpoint?: string;
  deploymentName?: string;
  modelName?: string;
}

export interface PodcastSession {
  id: number;
  topic: string;
  rounds: number;
  participants: ParticipantResponse[];
  messages: PodcastMessage[];
  createdAt: string;
  completedAt?: string;
  status: PodcastStatus;
}

export interface ParticipantResponse {
  id: number;
  name: string;
  persona: string;
  llmProviderName: string;
  voiceName?: string;
  isHost: boolean;
}

export interface PodcastMessage {
  id: number;
  participantName: string;
  content: string;
  audioUrl?: string;
  order: number;
  createdAt: string;
}

export enum PodcastStatus {
  Created = 1,
  InProgress = 2,
  Completed = 3,
  Failed = 4
}

export interface VoiceOption {
  name: string;
  displayName: string;
  locale: string;
  gender: string;
}

export interface PromptTemplate {
  template: string;
  execution_settings: ExecutionSettings;
  metadata: PromptMetadata;
}

export interface ExecutionSettings {
  max_tokens: number;
  temperature: number;
  top_k?: number;
  top_p?: number;
  frequency_penalty: number;
  presence_penalty: number;
  stop_sequences?: string;
}

export interface PromptMetadata {
  name: string;
  description: string;
  version: string;
  variables: string[];
}

export interface PreviewTemplateRequest {
  variables: Record<string, string>;
}

export interface TemplateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  detectedVariables: string[];
}
