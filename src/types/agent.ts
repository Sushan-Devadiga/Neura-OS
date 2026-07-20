export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  system_prompt: string;
  specialization: string[];
  available_tools: string[];
  enabled: boolean;
  temperature: number;
  model: string;
}
