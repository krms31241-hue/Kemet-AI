export type ProviderCapability =
  | "chat"
  | "completion"
  | "streaming"
  | "tool-calling"
  | "structured-output"
  | "vision"
  | "embeddings"
  | "image-generation"
  | "audio-input"
  | "audio-output";

export interface ProviderConfig {
  id: string;
  name: string;
  endpoint?: string;
  apiKey?: string;
  enabled: boolean;
  priority: number;
  timeout: number;
}

export interface ProviderUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost?: number;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface ChatResponse {
  id: string;
  model: string;
  message: ChatMessage;
  usage?: ProviderUsage;
}

