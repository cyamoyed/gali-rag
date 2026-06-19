import { create } from 'zustand';
import type {
  KnowledgeBase,
  KBCreate,
  KBUpdate,
  Category,
  CategoryTree,
  Document,
  ChunkConfig,
  HitTestResult,
} from '../types';
import {
  kbService,
  categoryService,
} from '../services';

interface KBState {
  knowledgeBases: KnowledgeBase[];
  categories: Category[];
  categoryTree: CategoryTree[];
  selectedKB: KnowledgeBase | null;
  documents: Document[];
  documentTotal: number;
  documentPage: number;
  documentTotalPages: number;
  hitTestResult: HitTestResult | null;
  loading: boolean;
  error: string | null;

  fetchKnowledgeBases: (params?: { category_id?: number; kb_type?: string }) => Promise<void>;
  fetchKnowledgeBase: (kbId: number) => Promise<void>;
  createKnowledgeBase: (payload: KBCreate) => Promise<KnowledgeBase>;
  updateKnowledgeBase: (kbId: number, payload: KBUpdate) => Promise<KnowledgeBase>;
  deleteKnowledgeBase: (kbId: number) => Promise<void>;
  setSelectedKB: (kb: KnowledgeBase | null) => void;

  fetchCategories: () => Promise<void>;
  fetchCategoryTree: () => Promise<void>;

  fetchDocuments: (kbId: number, params?: { page?: number; page_size?: number }) => Promise<void>;
  uploadDocuments: (kbId: number, files: File[]) => Promise<void>;
  deleteDocument: (docId: number) => Promise<void>;
  batchDeleteDocuments: (docIds: number[]) => Promise<void>;
  batchReprocessDocuments: (docIds: number[]) => Promise<void>;
  batchGenerateSummaries: (docIds: number[]) => Promise<void>;
  reprocessDocument: (docId: number) => Promise<void>;
  generateSummary: (docId: number) => Promise<string>;

  cleanVectors: (kbId: number) => Promise<string>;
  clearVectors: (kbId: number) => Promise<string>;
  updateChunkConfig: (kbId: number, config: ChunkConfig) => Promise<void>;
  crawlWebContent: (kbId: number) => Promise<void>;
  hitTest: (kbId: number, params: { query: string; top_k?: number; similarity_threshold?: number }) => Promise<void>;

  clearError: () => void;
}

export const useKBStore = create<KBState>((set) => ({
  knowledgeBases: [],
  categories: [],
  categoryTree: [],
  selectedKB: null,
  documents: [],
  documentTotal: 0,
  documentPage: 1,
  documentTotalPages: 1,
  hitTestResult: null,
  loading: false,
  error: null,

  fetchKnowledgeBases: async (params) => {
    set({ loading: true, error: null });
    try {
      const result = await kbService.listKnowledgeBases(params);
      set({ knowledgeBases: result.items, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchKnowledgeBase: async (kbId) => {
    set({ loading: true, error: null });
    try {
      const selectedKB = await kbService.getKnowledgeBase(kbId);
      set({ selectedKB, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  createKnowledgeBase: async (payload) => {
    set({ loading: true, error: null });
    try {
      const kb = await kbService.createKnowledgeBase(payload);
      set((state) => ({
        knowledgeBases: [...state.knowledgeBases, kb],
        loading: false,
      }));
      return kb;
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  updateKnowledgeBase: async (kbId, payload) => {
    set({ loading: true, error: null });
    try {
      const updated = await kbService.updateKnowledgeBase(kbId, payload);
      set((state) => ({
        knowledgeBases: state.knowledgeBases.map((kb) => (kb.id === kbId ? updated : kb)),
        selectedKB: state.selectedKB?.id === kbId ? updated : state.selectedKB,
        loading: false,
      }));
      return updated;
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  deleteKnowledgeBase: async (kbId) => {
    set({ loading: true, error: null });
    try {
      await kbService.deleteKnowledgeBase(kbId);
      set((state) => ({
        knowledgeBases: state.knowledgeBases.filter((kb) => kb.id !== kbId),
        selectedKB: state.selectedKB?.id === kbId ? null : state.selectedKB,
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  setSelectedKB: (kb) => set({ selectedKB: kb }),

  fetchCategories: async () => {
    try {
      const categories = await categoryService.listCategories();
      set({ categories });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  fetchCategoryTree: async () => {
    try {
      const categoryTree = await categoryService.getCategoryTree();
      set({ categoryTree });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  fetchDocuments: async (kbId, params) => {
    set({ loading: true, error: null });
    try {
      const result = await kbService.listDocuments(kbId, params);
      set({
        documents: result.items,
        documentTotal: result.total,
        documentPage: result.page,
        documentTotalPages: result.total_pages,
        loading: false,
      });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  uploadDocuments: async (kbId, files) => {
    set({ loading: true, error: null });
    try {
      await kbService.uploadDocuments(kbId, files);
      const result = await kbService.listDocuments(kbId, { page: 1, page_size: 20 });
      set({
        documents: result.items,
        documentTotal: result.total,
        documentPage: result.page,
        documentTotalPages: result.total_pages,
        loading: false,
      });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  deleteDocument: async (docId) => {
    set({ loading: true, error: null });
    try {
      await kbService.deleteDocument(docId);
      set((state) => ({
        documents: state.documents.filter((doc) => doc.id !== docId),
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  batchDeleteDocuments: async (docIds) => {
    set({ loading: true, error: null });
    try {
      await kbService.batchDeleteDocuments(docIds);
      set((state) => ({
        documents: state.documents.filter((doc) => !docIds.includes(doc.id)),
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  batchReprocessDocuments: async (docIds) => {
    set({ loading: true, error: null });
    try {
      // 乐观更新：立即将状态设为 processing
      set((state) => ({
        documents: state.documents.map((doc) =>
          docIds.includes(doc.id) ? { ...doc, status: 'processing' as const } : doc
        ),
      }));
      await Promise.all(docIds.map((id) => kbService.reprocessDocument(id)));
      set({ loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  batchGenerateSummaries: async (docIds) => {
    set({ loading: true, error: null });
    try {
      await Promise.all(docIds.map((id) => kbService.generateSummary(id)));
      set({ loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  reprocessDocument: async (docId) => {
    set({ loading: true, error: null });
    try {
      // 乐观更新：立即将状态设为 processing
      set((state) => ({
        documents: state.documents.map((doc) =>
          doc.id === docId ? { ...doc, status: 'processing' as const } : doc
        ),
      }));
      await kbService.reprocessDocument(docId);
      set({ loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  generateSummary: async (docId) => {
    set({ loading: true, error: null });
    try {
      const result = await kbService.generateSummary(docId);
      set({ loading: false });
      return result.data.summary;
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  cleanVectors: async (kbId) => {
    set({ loading: true, error: null });
    try {
      const result = await kbService.cleanVectors(kbId);
      set({ loading: false });
      return result.message;
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  clearVectors: async (kbId) => {
    set({ loading: true, error: null });
    try {
      const result = await kbService.clearVectors(kbId);
      set({ loading: false });
      return result.message;
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  updateChunkConfig: async (kbId, config) => {
    set({ loading: true, error: null });
    try {
      await kbService.updateChunkConfig(kbId, config);
      set({ loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  crawlWebContent: async (kbId) => {
    set({ loading: true, error: null });
    try {
      await kbService.crawlWebContent(kbId);
      set({ loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  hitTest: async (kbId, params) => {
    set({ loading: true, error: null });
    try {
      const result = await kbService.hitTest(kbId, params);
      set({ hitTestResult: result.data, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
