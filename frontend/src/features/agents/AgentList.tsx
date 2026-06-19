import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Bot, Globe, XCircle, Trash2 } from 'lucide-react';
import { PageHeader } from '../../app/layout/PageHeader';
import { Button, Input, Select, Spinner, EmptyState, ConfirmModal } from '../../shared/components/ui';
import { AgentCard } from '../../shared/components/cards/AgentCard';
import { AgentForm } from './components/AgentForm';
import { useAgentStore, useModelStore, useKBStore, useUIStore } from '../../shared/stores';
import type { AgentCreate, Agent } from '../../shared/types';

export default function AgentList() {
  const navigate = useNavigate();
  const { agents, loading, fetchAgents, createAgent, publishAgent, unpublishAgent, deleteAgent } =
    useAgentStore();
  const { models, fetchModels } = useModelStore();
  const { knowledgeBases, fetchKnowledgeBases } = useKBStore();
  const addNotification = useUIStore((s) => s.addNotification);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAgent, setDeletingAgent] = useState<Agent | null>(null);

  useEffect(() => {
    fetchAgents();
    fetchModels({ model_type: 'llm' });
    fetchKnowledgeBases();
  }, [fetchAgents, fetchModels, fetchKnowledgeBases]);

  const filteredAgents = useMemo(
    () =>
      agents.filter((agent) => {
        if (filterStatus && agent.status !== filterStatus) return false;
        if (
          searchQuery &&
          !agent.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
          return false;
        return true;
      }),
    [agents, filterStatus, searchQuery],
  );

  const handleCreate = async (data: AgentCreate) => {
    try {
      await createAgent(data);
      addNotification({ type: 'success', message: '智能体创建成功' });
    } catch {
      addNotification({ type: 'error', message: '创建智能体失败' });
    }
  };

  const handlePublish = async (agentId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await publishAgent(agentId);
      addNotification({ type: 'success', message: '智能体已发布' });
    } catch {
      addNotification({ type: 'error', message: '发布智能体失败' });
    }
  };

  const handleUnpublish = async (agentId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await unpublishAgent(agentId);
      addNotification({ type: 'success', message: '智能体已取消发布' });
    } catch {
      addNotification({ type: 'error', message: '取消发布失败' });
    }
  };

  const handleDelete = async (agentId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const agent = agents.find((a) => a.id === agentId);
    if (agent) {
      setDeletingAgent(agent);
      setShowDeleteConfirm(true);
    }
  };

  const handleConfirmDeleteAgent = async () => {
    if (!deletingAgent) return;
    try {
      await deleteAgent(deletingAgent.id);
      addNotification({ type: 'success', message: '智能体已删除' });
    } catch {
      addNotification({ type: 'error', message: '删除智能体失败' });
    }
  };

  const modelOptions = models.map((m) => ({
    label: m.name,
    value: String(m.id),
  }));

  const kbOptions = knowledgeBases.map((kb) => ({
    label: kb.name,
    value: String(kb.id),
  }));

  if (loading && agents.length === 0) {
    return <div className="flex items-center justify-center h-64"><Spinner /></div>;
  }

  return (
    <div>
      <PageHeader
        title="智能体"
        subtitle="创建和管理你的 AI 智能体"
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowForm(true)}
          >
            创建智能体
          </Button>
        }
      />

      <div className="flex items-center gap-4 mb-8">
        <div className="flex-1 max-w-xs">
          <Input
            placeholder="搜索智能体..."
            prefix={<Search className="w-4 h-4" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select
          options={[
            { label: '全部状态', value: '' },
            { label: '草稿', value: 'draft' },
            { label: '已发布', value: 'published' },
          ]}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        />
      </div>

      {filteredAgents.length === 0 ? (
        <EmptyState
          icon={<Bot className="w-8 h-8" />}
          title="暂无智能体"
          description="创建你的第一个智能体，开始构建智能问答系统"
          action={
            <Button variant="primary" onClick={() => setShowForm(true)}>
              创建智能体
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAgents.map((agent) => (
            <AgentCardWithActions
              key={agent.id}
              agent={agent}
              modelName={models.find((m) => m.id === agent.llm_model_id)?.name}
              onPublish={handlePublish}
              onUnpublish={handleUnpublish}
              onDelete={handleDelete}
              onClick={() => navigate(`/agents/${agent.id}`)}
            />
          ))}
        </div>
      )}

      <AgentForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreate}
        models={modelOptions}
        knowledgeBases={kbOptions}
      />

      <ConfirmModal
        open={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingAgent(null);
        }}
        onConfirm={handleConfirmDeleteAgent}
        title="删除智能体"
        description={`确定删除智能体"${deletingAgent?.name}"？此操作不可恢复。`}
        confirmText="删除"
        variant="danger"
      />
    </div>
  );
}

function AgentCardWithActions({
  agent,
  modelName,
  onPublish,
  onUnpublish,
  onDelete,
  onClick,
}: {
  agent: Agent;
  modelName?: string;
  onPublish: (id: number, e: React.MouseEvent) => void;
  onUnpublish: (id: number, e: React.MouseEvent) => void;
  onDelete: (id: number, e: React.MouseEvent) => void;
  onClick: () => void;
}) {
  return (
    <div className="group relative">
      <AgentCard
        id={agent.id}
        name={agent.name}
        description={agent.description}
        status={agent.status}
        modelName={modelName}
        kbCount={agent.knowledge_base_ids?.length || 0}
        onClick={onClick}
      />
      {agent.status === 'draft' ? (
        <button
          className="absolute top-3 right-10 p-1.5 text-muted hover:text-accent rounded-md opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-sm border border-hairline"
          title="发布"
          onClick={(e) => onPublish(agent.id, e)}
        >
          <Globe className="w-3.5 h-3.5" />
        </button>
      ) : (
        <button
          className="absolute top-3 right-10 p-1.5 text-muted hover:text-warning rounded-md opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-sm border border-hairline"
          title="取消发布"
          onClick={(e) => onUnpublish(agent.id, e)}
        >
          <XCircle className="w-3.5 h-3.5" />
        </button>
      )}
      <button
        className="absolute top-3 right-3 p-1.5 text-muted hover:text-error rounded-md opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-sm border border-hairline"
        title="删除"
        onClick={(e) => onDelete(agent.id, e)}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
