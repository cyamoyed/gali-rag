export interface ProviderModel {
  label: string;
  value: string;
}

export interface ProviderPreset {
  id: string;
  name: string;
  baseUrl: string;
  models: ProviderModel[];
  supportedTypes: string[];
  requiresKey: boolean;
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: [
      { label: 'GPT-4o', value: 'gpt-4o' },
      { label: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
      { label: 'GPT-4', value: 'gpt-4' },
      { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
      { label: 'O3 Mini', value: 'o3-mini' },
    ],
    supportedTypes: ['llm', 'embedding', 'speech', 'vision'],
    requiresKey: true,
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    models: [
      { label: 'DeepSeek V4 Flash', value: 'deepseek-v4-flash' },
      { label: 'DeepSeek V4 Pro', value: 'deepseek-v4-pro' },
    ],
    supportedTypes: ['llm'],
    requiresKey: true,
  },
  {
    id: 'ollama',
    name: 'Ollama',
    baseUrl: 'http://localhost:11434',
    models: [
      { label: 'Qwen2.5 7B', value: 'qwen2.5:7b' },
      { label: 'Qwen2.5 14B', value: 'qwen2.5:14b' },
      { label: 'LLaMA 3.2', value: 'llama3.2' },
      { label: 'Gemma 3', value: 'gemma3' },
      { label: 'DeepSeek R1', value: 'deepseek-r1' },
    ],
    supportedTypes: ['llm', 'embedding', 'vision'],
    requiresKey: false,
  },
  {
    id: 'zhipu',
    name: '智谱AI',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    models: [
      { label: 'GLM-4 Plus', value: 'glm-4-plus' },
      { label: 'GLM-4 Flash', value: 'glm-4-flash' },
      { label: 'GLM-4 Air', value: 'glm-4-air' },
      { label: 'GLM-4 Long', value: 'glm-4-long' },
    ],
    supportedTypes: ['llm', 'embedding', 'vision'],
    requiresKey: true,
  },
  {
    id: 'qwen',
    name: '通义千问',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: [
      { label: 'Qwen Max', value: 'qwen-max' },
      { label: 'Qwen Plus', value: 'qwen-plus' },
      { label: 'Qwen Turbo', value: 'qwen-turbo' },
      { label: 'Qwen3 235B A22B', value: 'qwen3-235b-a22b' },
      { label: 'QwQ 32B', value: 'qwq-32b' },
    ],
    supportedTypes: ['llm', 'embedding', 'speech', 'vision'],
    requiresKey: true,
  },
  {
    id: 'baidu',
    name: '文心一言',
    baseUrl: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop',
    models: [
      { label: 'ERNIE 4.5', value: 'ernie-4.5' },
      { label: 'ERNIE 4.0 Turbo', value: 'ernie-4.0-turbo' },
      { label: 'ERNIE Speed', value: 'ernie-speed' },
      { label: 'ERNIE Lite', value: 'ernie-lite' },
    ],
    supportedTypes: ['llm', 'embedding'],
    requiresKey: true,
  },
  {
    id: 'moonshot',
    name: 'Moonshot',
    baseUrl: 'https://api.moonshot.cn/v1',
    models: [
      { label: 'Moonshot V1 8K', value: 'moonshot-v1-8k' },
      { label: 'Moonshot V1 32K', value: 'moonshot-v1-32k' },
      { label: 'Moonshot V1 128K', value: 'moonshot-v1-128k' },
    ],
    supportedTypes: ['llm'],
    requiresKey: true,
  },
  {
    id: 'siliconflow',
    name: '硅基流动',
    baseUrl: 'https://api.siliconflow.cn/v1',
    models: [
      { label: 'Qwen3 235B A22B', value: 'Qwen/Qwen3-235B-A22B' },
      { label: 'DeepSeek V3', value: 'deepseek-ai/DeepSeek-V3' },
      { label: 'QwQ 32B', value: 'Qwen/QwQ-32B' },
    ],
    supportedTypes: ['llm', 'embedding', 'speech', 'vision'],
    requiresKey: true,
  },
];

export const MODEL_TYPE_LABELS: Record<string, string> = {
  llm: 'LLM',
  embedding: 'Embedding',
  reranking: 'Reranking',
  speech: 'Speech',
  vision: 'Vision',
};

export const ALL_MODEL_TYPES = [
  { label: 'LLM', value: 'llm' },
  { label: 'Embedding', value: 'embedding' },
  { label: 'Reranking', value: 'reranking' },
  { label: 'Speech', value: 'speech' },
  { label: 'Vision', value: 'vision' },
];
