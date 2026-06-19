import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Settings,
  Trash2,
  Key,
  Globe,
  XCircle,
  Copy,
  Check,
} from 'lucide-react';
import { PageHeader } from '../../app/layout/PageHeader';
import { Button, Modal, Spinner, ConfirmModal } from '../../shared/components/ui';
import { AgentForm } from './components/AgentForm';
import { ChatPanel } from './components/ChatPanel';
import { useAgentStore, useModelStore, useKBStore, useUIStore } from '../../shared/stores';
import type { AgentCreate } from '../../shared/types';

type TabKey = 'config' | 'chat';

export default function AgentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const agentId = Number(id);

  const {
    selectedAgent,
    loading,
    fetchAgent,
    updateAgent,
    deleteAgent,
    publishAgent,
    unpublishAgent,
    regenerateApiKey,
  } = useAgentStore();

  const { models, fetchModels } = useModelStore();
  const { knowledgeBases, fetchKnowledgeBases } = useKBStore();
  const addNotification = useUIStore((s) => s.addNotification);

  const [activeTab, setActiveTab] = useState<TabKey>('config');
  const [showEditForm, setShowEditForm] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRegenerateKeyConfirm, setShowRegenerateKeyConfirm] = useState(false);

  useEffect(() => {
    if (agentId) {
      fetchAgent(agentId);
    }
    fetchModels({ model_type: 'llm' });
    fetchKnowledgeBases();
  }, [agentId, fetchAgent, fetchModels, fetchKnowledgeBases]);

  const handleUpdate = useCallback(
    async (data: AgentCreate) => {
      try {
        await updateAgent(agentId, data);
        addNotification({ type: 'success', message: '智能体已更新' });
      } catch {
        addNotification({ type: 'error', message: '更新智能体失败' });
      }
    },
    [agentId, updateAgent, addNotification],
  );

  const handleDelete = useCallback(async () => {
    setShowDeleteConfirm(true);
  }, []);

  const handleConfirmDeleteAgent = useCallback(async () => {
    try {
      await deleteAgent(agentId);
      addNotification({ type: 'success', message: '智能体已删除' });
      navigate('/agents');
    } catch {
      addNotification({ type: 'error', message: '删除智能体失败' });
    }
  }, [agentId, deleteAgent, addNotification, navigate]);

  const handlePublish = useCallback(async () => {
    try {
      await publishAgent(agentId);
      addNotification({ type: 'success', message: '智能体已发布' });
    } catch {
      addNotification({ type: 'error', message: '发布智能体失败' });
    }
  }, [agentId, publishAgent, addNotification]);

  const handleUnpublish = useCallback(async () => {
    try {
      await unpublishAgent(agentId);
      addNotification({ type: 'success', message: '智能体已取消发布' });
    } catch {
      addNotification({ type: 'error', message: '取消发布失败' });
    }
  }, [agentId, unpublishAgent, addNotification]);

  const handleRegenerateKey = useCallback(async () => {
    setShowRegenerateKeyConfirm(true);
  }, []);

  const handleConfirmRegenerateKey = useCallback(async () => {
    try {
      await regenerateApiKey(agentId);
      addNotification({ type: 'success', message: 'API Key 已重新生成' });
    } catch {
      addNotification({ type: 'error', message: '重新生成 API Key 失败' });
    }
  }, [agentId, regenerateApiKey, addNotification]);

  const handleCopyKey = useCallback(() => {
    if (selectedAgent?.api_key) {
      navigator.clipboard.writeText(selectedAgent.api_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [selectedAgent]);

  if (loading && !selectedAgent) {
    return <Spinner className="h-64" />;
  }

  if (!selectedAgent) {
    return (
      <div className="text-center py-12 text-muted">
        智能体不存在或已删除
      </div>
    );
  }

  const modelOptions = models.map((m) => ({
    label: m.name,
    value: String(m.id),
  }));

  const kbOptions = knowledgeBases.map((kb) => ({
    label: kb.name,
    value: String(kb.id),
  }));

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'config', label: '配置' },
    { key: 'chat', label: '对话测试' },
  ];

  return (
    <div>
      <PageHeader
        title={selectedAgent.name}
        subtitle={selectedAgent.description || '暂无描述'}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => navigate('/agents')}
            >
              返回
            </Button>
            {selectedAgent.status === 'draft' ? (
              <Button
                variant="primary"
                size="sm"
                icon={<Globe className="w-4 h-4" />}
                onClick={handlePublish}
              >
                发布
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                icon={<XCircle className="w-4 h-4" />}
                onClick={handleUnpublish}
              >
                取消发布
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              icon={<Key className="w-4 h-4" />}
              onClick={() => setShowApiKey(true)}
            >
              API Key
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={handleDelete}
            >
              删除
            </Button>
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

      {activeTab === 'config' && (
        <div className="max-w-2xl">
          <div className="bg-white border border-hairline rounded-lg p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-ink">基本配置</h3>
              <Button
                variant="secondary"
                size="sm"
                icon={<Settings className="w-4 h-4" />}
                onClick={() => setShowEditForm(true)}
              >
                编辑
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <ConfigItem label="LLM 模型" value={
                models.find((m) => m.id === selectedAgent.llm_model_id)?.name || '未配置'
              } />
              <ConfigItem label="状态" value={selectedAgent.status === 'published' ? '已发布' : '草稿'} />
              <ConfigItem label="Temperature" value={String(selectedAgent.temperature)} />
              <ConfigItem label="最大 Token" value={String(selectedAgent.max_tokens)} />
              <ConfigItem label="Top K" value={String(selectedAgent.top_k)} />
              <ConfigItem label="相似度阈值" value={String(selectedAgent.similarity_threshold)} />
            </div>

            <div>
              <p className="text-sm font-medium text-ink mb-1">关联知识库</p>
              <p className="text-sm text-muted">
                {selectedAgent.knowledge_base_ids?.length
                  ? selectedAgent.knowledge_base_ids
                      .map((id) => knowledgeBases.find((kb) => kb.id === id)?.name)
                      .filter(Boolean)
                      .join('、')
                  : '未关联知识库'}
              </p>
            </div>

            {selectedAgent.system_prompt && (
              <div>
                <p className="text-sm font-medium text-ink mb-1">系统提示词</p>
                <p className="text-sm text-muted whitespace-pre-wrap bg-canvas-soft rounded p-3">
                  {selectedAgent.system_prompt}
                </p>
              </div>
            )}

            {selectedAgent.opening_message && (
              <div>
                <p className="text-sm font-medium text-ink mb-1">开场白</p>
                <p className="text-sm text-muted">{selectedAgent.opening_message}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'chat' && <ChatPanel agentId={agentId} />}

      <AgentForm
        open={showEditForm}
        onClose={() => setShowEditForm(false)}
        onSubmit={handleUpdate}
        initialData={selectedAgent}
        models={modelOptions}
        knowledgeBases={kbOptions}
      />

      <Modal
        open={showApiKey}
        onClose={() => setShowApiKey(false)}
        title="API Key"
        description="通过 API 调用此智能体时使用的密钥"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowApiKey(false)}>
              关闭
            </Button>
            <Button
              variant="primary"
              icon={<Key className="w-4 h-4" />}
              onClick={handleRegenerateKey}
            >
              重新生成
            </Button>
          </>
        }
      >
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-canvas-soft rounded px-3 py-2 text-sm font-mono break-all">
            {selectedAgent.api_key || '未发布，无 API Key'}
          </code>
          {selectedAgent.api_key && (
            <Button
              variant="ghost"
              size="sm"
              icon={copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              onClick={handleCopyKey}
            />
          )}
        </div>
      </Modal>

      <ConfirmModal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDeleteAgent}
        title="删除智能体"
        description="确定删除该智能体？此操作不可恢复。"
        confirmText="删除"
        variant="danger"
      />

      <ConfirmModal
        open={showRegenerateKeyConfirm}
        onClose={() => setShowRegenerateKeyConfirm(false)}
        onConfirm={handleConfirmRegenerateKey}
        title="重新生成 API Key"
        description="确定重新生成 API Key？旧的 Key 将立即失效。"
        confirmText="重新生成"
        variant="warning"
      />
    </div>
  );
}

function ConfigItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted mb-0.5">{label}</p>
      <p className="text-sm text-ink font-medium">{value}</p>
    </div>
  );
}
