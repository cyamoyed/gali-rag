import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Settings,
  Trash2,
  BrushCleaning,
  FileSearch,
  Pencil,
  Globe,
  MoreVertical,
  Eraser,
} from 'lucide-react';
import { PageHeader } from '../../app/layout/PageHeader';
import { Button, Modal, Input, Spinner, ConfirmModal, DropdownMenu } from '../../shared/components/ui';
import { DocumentList } from './components/DocumentList';
import { HitTest } from './components/HitTest';
import { KBForm } from './components/KBForm';
import { ChunkDetail } from './components/ChunkDetail';
import { FilePreviewModal } from './components/FilePreviewModal';
import { useKBStore, useModelStore, useUIStore } from '../../shared/stores';
import type { ChunkConfig, KBCreate } from '../../shared/types';
import { downloadDocument } from '../../shared/services/kbService';

type TabKey = 'documents' | 'hitTest';

export default function KBDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const kbId = Number(id);

  const {
    selectedKB,
    documents,
    documentTotal,
    documentPage,
    documentTotalPages,
    hitTestResult,
    loading,
    categories,
    fetchKnowledgeBase,
    fetchDocuments,
    fetchCategories,
    uploadDocuments,
    deleteDocument,
    batchDeleteDocuments,
    batchReprocessDocuments,
    batchGenerateSummaries,
    reprocessDocument,
    generateSummary,
    cleanVectors,
    clearVectors,
    updateChunkConfig,
    updateKnowledgeBase,
    deleteKnowledgeBase,
    crawlWebContent,
    hitTest,
  } = useKBStore();

  const { models, fetchModels } = useModelStore();
  const addNotification = useUIStore((s) => s.addNotification);

  const [activeTab, setActiveTab] = useState<TabKey>('documents');
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteKBConfirm, setShowDeleteKBConfirm] = useState(false);
  const [showChunkConfig, setShowChunkConfig] = useState(false);
  const [chunkConfig, setChunkConfig] = useState<ChunkConfig>({
    chunk_size: 500,
    chunk_overlap: 100,
    semantic_chunk_enabled: false,
  });
  const [showDeleteDocConfirm, setShowDeleteDocConfirm] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState<number | null>(null);
  const [showCleanVectorsConfirm, setShowCleanVectorsConfirm] = useState(false);
  const [showClearVectorsConfirm, setShowClearVectorsConfirm] = useState(false);
  const [viewingChunks, setViewingChunks] = useState<{ docId: number; docName: string } | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ id: number; filename: string; fileType: string } | null>(null);

  useEffect(() => {
    if (kbId) {
      fetchKnowledgeBase(kbId);
      fetchDocuments(kbId, { page: 1, page_size: 20 });
      fetchModels({ model_type: 'embedding' });
      fetchCategories();
    }
  }, [kbId, fetchKnowledgeBase, fetchDocuments, fetchModels, fetchCategories]);

  const documentPageRef = useRef(documentPage);
  documentPageRef.current = documentPage;

  const hasPendingDocs = documents.some(
    (doc) => doc.status === 'pending' || doc.status === 'processing'
  );

  useEffect(() => {
    if (!hasPendingDocs) return;

    const timer = setInterval(() => {
      fetchDocuments(kbId, { page: documentPageRef.current, page_size: 20 });
    }, 3000);

    return () => clearInterval(timer);
  }, [hasPendingDocs, kbId, fetchDocuments]);

  const handleUpload = useCallback(
    async (files: File[]) => {
      try {
        await uploadDocuments(kbId, files);
        addNotification({ type: 'success', message: `成功上传 ${files.length} 个文档` });
      } catch {
        addNotification({ type: 'error', message: '上传文档失败' });
      }
    },
    [kbId, uploadDocuments, addNotification],
  );

  const handleDelete = useCallback(
    async (docId: number) => {
      setDeletingDocId(docId);
      setShowDeleteDocConfirm(true);
    },
    [],
  );

  const handleConfirmDeleteDocument = useCallback(async () => {
    if (!deletingDocId) return;
    try {
      await deleteDocument(deletingDocId);
      addNotification({ type: 'success', message: '文档已删除' });
    } catch {
      addNotification({ type: 'error', message: '删除文档失败' });
    }
  }, [deletingDocId, deleteDocument, addNotification]);

  const handleReprocess = useCallback(
    async (docId: number) => {
      try {
        await reprocessDocument(docId);
        addNotification({ type: 'success', message: '文档已提交重新处理' });
        fetchDocuments(kbId);
      } catch {
        addNotification({ type: 'error', message: '重新处理失败' });
      }
    },
    [kbId, reprocessDocument, fetchDocuments, addNotification],
  );

  const handleGenerateSummary = useCallback(
    async (docId: number) => {
      const summary = await generateSummary(docId);
      fetchDocuments(kbId);
      return summary;
    },
    [kbId, generateSummary, fetchDocuments],
  );

  const handlePreview = useCallback((docId: number, filename: string, fileType: string) => {
    setPreviewDoc({ id: docId, filename, fileType });
  }, []);

  const handleDownload = useCallback(async (docId: number, filename: string) => {
    try {
      await downloadDocument(docId, filename);
    } catch {
      addNotification({ type: 'error', message: '下载失败' });
    }
  }, [addNotification]);

  const handleCleanVectors = useCallback(async () => {
    setShowCleanVectorsConfirm(true);
  }, []);

  const handleConfirmCleanVectors = useCallback(async () => {
    try {
      const message = await cleanVectors(kbId);
      addNotification({ type: 'success', message });
    } catch {
      addNotification({ type: 'error', message: '清理失败' });
    }
  }, [kbId, cleanVectors, addNotification]);

  const handleClearVectors = useCallback(async () => {
    setShowClearVectorsConfirm(true);
  }, []);

  const handleConfirmClearVectors = useCallback(async () => {
    try {
      const message = await clearVectors(kbId);
      addNotification({ type: 'success', message });
    } catch {
      addNotification({ type: 'error', message: '清空失败' });
    }
  }, [kbId, clearVectors, addNotification]);

  const handleSaveChunkConfig = useCallback(async () => {
    try {
      await updateChunkConfig(kbId, chunkConfig);
      addNotification({ type: 'success', message: '切片配置已保存' });
      setShowChunkConfig(false);
      fetchKnowledgeBase(kbId);
    } catch {
      addNotification({ type: 'error', message: '保存配置失败' });
    }
  }, [kbId, chunkConfig, updateChunkConfig, addNotification, fetchKnowledgeBase]);

  const handleHitTest = useCallback(
    async (params: { query: string; top_k?: number; similarity_threshold?: number }) => {
      try {
        await hitTest(kbId, params);
      } catch {
        addNotification({ type: 'error', message: '检索测试失败' });
      }
    },
    [kbId, hitTest, addNotification],
  );

  const handleEditKB = useCallback(
    async (data: KBCreate) => {
      try {
        await updateKnowledgeBase(kbId, data);
        addNotification({ type: 'success', message: '知识库已更新' });
        fetchKnowledgeBase(kbId);
      } catch {
        addNotification({ type: 'error', message: '更新知识库失败' });
      }
    },
    [kbId, updateKnowledgeBase, addNotification, fetchKnowledgeBase],
  );

  const handleCrawl = useCallback(async () => {
    try {
      await crawlWebContent(kbId);
      addNotification({ type: 'success', message: '网页抓取完成' });
      fetchDocuments(kbId);
    } catch {
      addNotification({ type: 'error', message: '网页抓取失败' });
    }
  }, [kbId, crawlWebContent, addNotification, fetchDocuments]);

  const handleBatchDelete = useCallback(
    async (docIds: number[]) => {
      try {
        await batchDeleteDocuments(docIds);
        addNotification({ type: 'success', message: `已删除 ${docIds.length} 个文档` });
        fetchDocuments(kbId);
      } catch {
        addNotification({ type: 'error', message: '批量删除失败' });
      }
    },
    [kbId, batchDeleteDocuments, addNotification, fetchDocuments],
  );

  const handleBatchReprocess = useCallback(
    async (docIds: number[]) => {
      try {
        await batchReprocessDocuments(docIds);
        addNotification({ type: 'success', message: `已提交 ${docIds.length} 个文档重新处理` });
        fetchDocuments(kbId);
      } catch {
        addNotification({ type: 'error', message: '批量重处理失败' });
      }
    },
    [kbId, batchReprocessDocuments, addNotification, fetchDocuments],
  );

  const handleBatchGenerateSummary = useCallback(
    async (docIds: number[]) => {
      try {
        await batchGenerateSummaries(docIds);
        addNotification({ type: 'success', message: `已为 ${docIds.length} 个文档生成摘要` });
        fetchDocuments(kbId);
      } catch (err) {
        addNotification({ type: 'error', message: (err as Error).message || '批量生成摘要失败' });
      }
    },
    [kbId, batchGenerateSummaries, addNotification, fetchDocuments],
  );

  const handleDeleteKB = useCallback(async () => {
    try {
      await deleteKnowledgeBase(kbId);
      addNotification({ type: 'success', message: '知识库已删除' });
      navigate('/knowledge-bases');
    } catch {
      addNotification({ type: 'error', message: '删除知识库失败' });
    }
  }, [kbId, deleteKnowledgeBase, addNotification, navigate]);

  if (loading && !selectedKB) {
    return <div className="flex items-center justify-center h-64"><Spinner /></div>;
  }

  if (!selectedKB) {
    return (
      <div className="text-center py-12 text-muted">
        知识库不存在或已删除
      </div>
    );
  }

  const tabs: { key: TabKey; label: string; icon: typeof FileSearch }[] = [
    { key: 'documents', label: '文档列表', icon: FileSearch },
    { key: 'hitTest', label: '命中测试', icon: FileSearch },
  ];

  return (
    <div>
      <PageHeader
        title={selectedKB.name}
        subtitle={selectedKB.description || `${selectedKB.document_count} 个文档`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => navigate('/knowledge-bases')}
            >
              返回
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Pencil className="w-4 h-4" />}
              onClick={() => setShowEditForm(true)}
            >
              编辑
            </Button>
            <DropdownMenu
              trigger={
                <Button variant="secondary" size="sm" icon={<MoreVertical className="w-4 h-4" />}>
                  更多
                </Button>
              }
              items={[
                ...(selectedKB.kb_type === 'web'
                  ? [{ label: '抓取网页', icon: <Globe className="w-4 h-4" />, onClick: handleCrawl }]
                  : []),
                {
                  label: '切片配置',
                  icon: <Settings className="w-4 h-4" />,
                  onClick: () => {
                    if (selectedKB) {
                      setChunkConfig({
                        chunk_size: selectedKB.chunk_size,
                        chunk_overlap: selectedKB.chunk_overlap,
                        semantic_chunk_enabled: selectedKB.semantic_chunk_enabled,
                      });
                    }
                    setShowChunkConfig(true);
                  },
                },
                {
                  label: '清理孤立向量',
                  description: '清理已删除文档的残留向量数据',
                  icon: <BrushCleaning className="w-4 h-4" />,
                  onClick: handleCleanVectors,
                },
                {
                  label: '清空向量',
                  description: '清空该知识库的所有向量数据',
                  icon: <Eraser className="w-4 h-4" />,
                  variant: 'danger' as const,
                  onClick: handleClearVectors,
                },
                {
                  label: '删除知识库',
                  icon: <Trash2 className="w-4 h-4" />,
                  variant: 'danger' as const,
                  onClick: () => setShowDeleteKBConfirm(true),
                },
              ]}
            />
          </div>
        }
      />

      <div className="flex gap-1 mb-6 border-b border-hairline">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.key
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-ink'
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'documents' && (
        <DocumentList
          documents={documents}
          loading={loading}
          total={documentTotal}
          page={documentPage}
          totalPages={documentTotalPages}
          onPageChange={(p) => fetchDocuments(kbId, { page: p, page_size: 20 })}
          onUpload={handleUpload}
          onDelete={handleDelete}
          onReprocess={handleReprocess}
          onGenerateSummary={handleGenerateSummary}
          onViewChunks={(docId, docName) => setViewingChunks({ docId, docName })}
          onBatchDelete={handleBatchDelete}
          onBatchReprocess={handleBatchReprocess}
          onBatchGenerateSummary={handleBatchGenerateSummary}
          onPreview={handlePreview}
          onDownload={handleDownload}
        />
      )}

      {activeTab === 'hitTest' && (
        <HitTest
          onTest={handleHitTest}
          result={hitTestResult}
          loading={loading}
          onViewChunks={(docId, docName) => setViewingChunks({ docId, docName })}
        />
      )}

      <Modal
        open={showChunkConfig}
        onClose={() => setShowChunkConfig(false)}
        title="切片配置"
        description="配置文档切片参数，修改后需重新处理文档生效"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowChunkConfig(false)}>
              取消
            </Button>
            <Button variant="primary" onClick={handleSaveChunkConfig} loading={loading}>
              保存
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="切片大小"
              type="number"
              min={100}
              max={5000}
              value={chunkConfig.chunk_size}
              onChange={(e) =>
                setChunkConfig((c) => ({ ...c, chunk_size: Number(e.target.value) }))
              }
            />
            <Input
              label="切片重叠"
              type="number"
              min={0}
              max={1000}
              value={chunkConfig.chunk_overlap}
              onChange={(e) =>
                setChunkConfig((c) => ({ ...c, chunk_overlap: Number(e.target.value) }))
              }
            />
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={chunkConfig.semantic_chunk_enabled}
                onChange={(e) =>
                  setChunkConfig((c) => ({ ...c, semantic_chunk_enabled: e.target.checked }))
                }
                className="w-4 h-4 rounded border-hairline text-accent focus:ring-accent"
              />
              <div>
                <p className="text-sm font-medium text-ink">语义切片</p>
                <p className="text-xs text-muted">基于标题、段落等语义边界切片，并自动合并过短切片</p>
              </div>
            </label>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={showDeleteDocConfirm}
        onClose={() => {
          setShowDeleteDocConfirm(false);
          setDeletingDocId(null);
        }}
        onConfirm={handleConfirmDeleteDocument}
        title="删除文档"
        description="确定删除该文档？此操作不可恢复。"
        confirmText="删除"
        variant="danger"
      />

      <ConfirmModal
        open={showCleanVectorsConfirm}
        onClose={() => setShowCleanVectorsConfirm(false)}
        onConfirm={handleConfirmCleanVectors}
        title="清理孤立向量"
        description="确定清理孤立向量？"
        confirmText="清理"
        variant="warning"
      />

      <ConfirmModal
        open={showClearVectorsConfirm}
        onClose={() => setShowClearVectorsConfirm(false)}
        onConfirm={handleConfirmClearVectors}
        title="清空所有向量"
        description="确定清空所有向量？此操作不可恢复。"
        confirmText="清空"
        variant="danger"
      />

      <ConfirmModal
        open={showDeleteKBConfirm}
        onClose={() => setShowDeleteKBConfirm(false)}
        onConfirm={handleDeleteKB}
        title="删除知识库"
        description={`确定删除知识库"${selectedKB?.name}"？所有文档和向量数据将被永久删除，此操作不可恢复。`}
        confirmText="删除"
        variant="danger"
      />

      <KBForm
        open={showEditForm}
        onClose={() => setShowEditForm(false)}
        onSubmit={handleEditKB}
        initialData={selectedKB || undefined}
        categories={categories.map((c) => ({ label: c.name, value: String(c.id) }))}
        models={models.map((m) => ({ label: m.name, value: String(m.id) }))}
      />

      {viewingChunks && (
        <ChunkDetail
          docId={viewingChunks.docId}
          docName={viewingChunks.docName}
          onClose={() => setViewingChunks(null)}
        />
      )}

      <FilePreviewModal
        open={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        docId={previewDoc?.id ?? null}
        filename={previewDoc?.filename ?? ''}
        fileType={previewDoc?.fileType ?? ''}
      />
    </div>
  );
}
