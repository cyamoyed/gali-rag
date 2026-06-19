import { create } from 'zustand';
import type {
  AIModel,
  AIModelCreate,
  AIModelUpdate,
  PromptTemplate,
  PromptCreate,
  PromptUpdate,
  PresetBrief,
  PresetCreate,
  SystemResource,
} from '../types';
import {
  modelService,
  promptService,
  systemService,
} from '../services';

interface ModelState {
  models: AIModel[];
  prompts: PromptTemplate[];
  presets: PresetBrief[];
  resources: SystemResource | null;
  loading: boolean;
  error: string | null;

  fetchModels: (params?: { model_type?: string }) => Promise<void>;
  fetchModel: (modelId: number) => Promise<AIModel>;
  createModel: (payload: AIModelCreate) => Promise<AIModel>;
  updateModel: (modelId: number, payload: AIModelUpdate) => Promise<AIModel>;
  deleteModel: (modelId: number) => Promise<void>;
  setDefaultModel: (modelId: number) => Promise<void>;
  testModel: (modelId: number) => Promise<{ success: boolean; error?: string }>;

  fetchPresets: () => Promise<void>;
  createPreset: (payload: PresetCreate) => Promise<void>;
  activatePreset: (presetId: number) => Promise<void>;
  duplicatePreset: (presetId: number, newName: string) => Promise<void>;
  deletePreset: (presetId: number) => Promise<void>;

  fetchPrompts: (params?: { category?: string; preset_id?: number }) => Promise<void>;
  fetchPrompt: (promptId: number) => Promise<PromptTemplate>;
  createPrompt: (payload: PromptCreate) => Promise<PromptTemplate>;
  updatePrompt: (promptId: number, payload: PromptUpdate) => Promise<PromptTemplate>;
  deletePrompt: (promptId: number) => Promise<void>;
  resetPrompt: (promptId: number) => Promise<void>;
  setDefaultPrompt: (promptId: number) => Promise<void>;

  fetchResources: () => Promise<void>;

  clearError: () => void;
}

export const useModelStore = create<ModelState>((set) => ({
  models: [],
  prompts: [],
  presets: [],
  resources: null,
  loading: false,
  error: null,

  fetchModels: async (params) => {
    set({ loading: true, error: null });
    try {
      const models = await modelService.listModels(params);
      set({ models, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchModel: async (modelId) => {
    set({ loading: true, error: null });
    try {
      const model = await modelService.getModel(modelId);
      set({ loading: false });
      return model;
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  createModel: async (payload) => {
    set({ loading: true, error: null });
    try {
      const model = await modelService.createModel(payload);
      set((state) => ({
        models: [...state.models, model],
        loading: false,
      }));
      return model;
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  updateModel: async (modelId, payload) => {
    set({ loading: true, error: null });
    try {
      const updated = await modelService.updateModel(modelId, payload);
      set((state) => ({
        models: state.models.map((m) => (m.id === modelId ? updated : m)),
        loading: false,
      }));
      return updated;
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  deleteModel: async (modelId) => {
    set({ loading: true, error: null });
    try {
      await modelService.deleteModel(modelId);
      set((state) => ({
        models: state.models.filter((m) => m.id !== modelId),
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  setDefaultModel: async (modelId) => {
    set({ loading: true, error: null });
    try {
      await modelService.setDefaultModel(modelId);
      set((state) => ({
        models: state.models.map((m) => ({
          ...m,
          is_default: m.id === modelId,
        })),
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  testModel: async (modelId) => {
    set({ loading: true, error: null });
    try {
      const result = await modelService.testModel(modelId);
      set({ loading: false });
      return result.data;
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  // ── Preset Actions ──

  fetchPresets: async () => {
    try {
      const presets = await promptService.listPresets();
      set({ presets });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  createPreset: async (payload) => {
    set({ loading: true, error: null });
    try {
      await promptService.createPreset(payload);
      const presets = await promptService.listPresets();
      set({ presets, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  activatePreset: async (presetId) => {
    set({ loading: true, error: null });
    try {
      await promptService.activatePreset(presetId);
      const [presets, prompts] = await Promise.all([
        promptService.listPresets(),
        promptService.listPrompts(),
      ]);
      set({ presets, prompts, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  duplicatePreset: async (presetId, newName) => {
    set({ loading: true, error: null });
    try {
      await promptService.duplicatePreset(presetId, newName);
      const presets = await promptService.listPresets();
      set({ presets, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  deletePreset: async (presetId) => {
    set({ loading: true, error: null });
    try {
      await promptService.deletePreset(presetId);
      const presets = await promptService.listPresets();
      set({ presets, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  // ── Prompt Actions ──

  fetchPrompts: async (params) => {
    set({ loading: true, error: null });
    try {
      const prompts = await promptService.listPrompts(params);
      set({ prompts, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchPrompt: async (promptId) => {
    set({ loading: true, error: null });
    try {
      const prompt = await promptService.getPrompt(promptId);
      set({ loading: false });
      return prompt;
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  createPrompt: async (payload) => {
    set({ loading: true, error: null });
    try {
      const prompt = await promptService.createPrompt(payload);
      set((state) => ({
        prompts: [...state.prompts, prompt],
        loading: false,
      }));
      return prompt;
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  updatePrompt: async (promptId, payload) => {
    set({ loading: true, error: null });
    try {
      const updated = await promptService.updatePrompt(promptId, payload);
      set((state) => ({
        prompts: state.prompts.map((p) => (p.id === promptId ? updated : p)),
        loading: false,
      }));
      return updated;
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  deletePrompt: async (promptId) => {
    set({ loading: true, error: null });
    try {
      await promptService.deletePrompt(promptId);
      set((state) => ({
        prompts: state.prompts.filter((p) => p.id !== promptId),
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  resetPrompt: async (promptId) => {
    set({ loading: true, error: null });
    try {
      await promptService.resetPrompt(promptId);
      const prompt = await promptService.getPrompt(promptId);
      set((state) => ({
        prompts: state.prompts.map((p) => (p.id === promptId ? prompt : p)),
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  setDefaultPrompt: async (promptId) => {
    set({ loading: true, error: null });
    try {
      await promptService.setDefaultPrompt(promptId);
      set((state) => {
        const target = state.prompts.find((p) => p.id === promptId);
        const category = target?.category;
        return {
          prompts: state.prompts.map((p) => ({
            ...p,
            is_default: p.id === promptId ? true : (p.category === category ? false : p.is_default),
          })),
          loading: false,
        };
      });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  fetchResources: async () => {
    try {
      const resources = await systemService.getResources();
      set({ resources });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  clearError: () => set({ error: null }),
}));
