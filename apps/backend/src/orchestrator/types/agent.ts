export interface AgentCapabilities {
  codeGeneration: boolean;

  review: boolean;

  debugging: boolean;

  planning: boolean;

  terminal: boolean;

  filesystem: boolean;

  git: boolean;
}

export interface AgentConfig {
  id: string;

  name: string;

  provider: string;

  model: string;

  systemPrompt: string;

  temperature: number;

  maxTokens: number;

  capabilities: AgentCapabilities;
}
