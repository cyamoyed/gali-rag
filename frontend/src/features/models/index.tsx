import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Cpu, Pencil, Trash2, Star, Zap, CheckCircle, XCircle } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { PageHeader } from '../../app/layout/PageHeader';
import { Button, Input, Select, Textarea, Modal, Spinner, EmptyState, Badge, ConfirmModal } from '../../shared/components/ui';
import { useModelStore, useUIStore } from '../../shared/stores';
import type { AIModel, AIModelCreate } from '../../shared/types';

const MODEL_TYPES = [
  { label: 'LLM', value: 'llm' },
  { label: 'Embedding', value: 'embedding' },
  { label: 'Reranking', value: 'reranking' },
  { label: 'Speech', value: 'speech' },
  { label: 'Vision', value: 'vision' },
];

const TYPE_BADGE: Record<string, 'primary' | 'info' | 'warning' | 'success' | 'default'> = {
  llm: 'primary',
  embedding: 'info',
  reranking: 'warning',
  speech: 'success',
  vision: 'default',
};

export default function ModelPage() {
  const { models, loading, fetchModels, createModel, updateModel, deleteModel, setDefaultModel, testModel } =
    useModelStore();
  const addNotification = useUIStore((s) => s.addNotification);
  const [showForm, setShowForm] = useState(false);
  const [editingModel, setEditingModel] = useState<AIModel | null>(null);
  const [filterType, setFilterType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [testingId, setTestingId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingModel, setDeletingModel] = useState<AIModel | null>(null);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const filteredModels = useMemo(
    () =>
      models.filter((m) => {
        if (filterType && m.model_type !== filterType) return false;
        if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      }),
    [models, filterType, searchQuery],
  );

  const handleCreate = async (data: AIModelCreate) => {
    await createModel(data);
    addNotification({ type: 'success', message: '模型创建成功' });
  };

  const handleEdit = (model: AIModel) => {
    setEditingModel(model);
    setShowForm(true);
  };

  const handleUpdate = async (data: AIModelCreate) => {
    if (!editingModel) return;
    await updateModel(editingModel.id, data);
    addNotification({ type: 'success', message: '模型已更新' });
  };

  const handleDelete = async (model: AIModel) => {
    if (model.is_builtin) {
      addNotification({ type: 'warning', message: '内置模型不可删除' });
      return;
    }
    setDeletingModel(model);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDeleteModel = async () => {
    if (!deletingModel) return;
    try {
      await deleteModel(deletingModel.id);
      addNotification({ type: 'success', message: '模型已删除' });
    } catch {
      addNotification({ type: 'error', message: '删除模型失败' });
    }
  };

  const handleSetDefault = async (modelId: number) => {
    try {
      await setDefaultModel(modelId);
      addNotification({ type: 'success', message: '已设为默认模型' });
    } catch {
      addNotification({ type: 'error', message: '设置默认模型失败' });
    }
  };

  const handleTest = async (modelId: number) => {
    setTestingId(modelId);
    try {
      const result = await testModel(modelId);
      if (result.success) {
        addNotification({ type: 'success', message: '模型连接测试成功' });
      } else {
        addNotification({ type: 'error', message: `模型连接测试失败: ${result.error || '未知错误'}` });
      }
    } catch {
      addNotification({ type: 'error', message: '模型连接测试失败' });
    } finally {
      setTestingId(null);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingModel(null);
  };

  if (loading && models.length === 0) {
    return <div className="flex items-center justify-center h-64"><Spinner /></div>;
  }

  return (
    <div>
      <PageHeader
        title="模型管理"
        subtitle="管理 AI 模型配置"
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowForm(true)}
          >
            创建模型
          </Button>
        }
      />

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 max-w-xs">
          <Input
            placeholder="搜索模型..."
            prefix={<Search className="w-4 h-4" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select
          options={[{ label: '全部类型', value: '' }, ...MODEL_TYPES]}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        />
      </div>

      {filteredModels.length === 0 ? (
        <EmptyState
          icon={<Cpu className="w-8 h-8" />}
          title="暂无模型"
          description="添加你的第一个 AI 模型"
          action={
            <Button variant="primary" onClick={() => setShowForm(true)}>
              创建模型
            </Button>
          }
        />
      ) : (
        <div className="bg-canvas rounded-lg border border-hairline overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-hairline bg-canvas-soft">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase">名称</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase">提供商</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase">类型</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase">模型</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase">状态</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted uppercase">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredModels.map((model) => (
                <tr key={model.id} className="border-b border-hairline last:border-0 hover:bg-canvas-soft/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-ink">{model.name}</span>
                      {model.is_default && (
                        <Badge variant="primary">默认</Badge>
                      )}
                      {model.is_builtin && (
                        <Badge variant="default">内置</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-body">{model.provider}</td>
                  <td className="px-4 py-3">
                    <Badge variant={TYPE_BADGE[model.model_type] || 'default'}>
                      {model.model_type.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-body font-mono">{model.model_name}</td>
                  <td className="px-4 py-3">
                    {model.status === 'active' ? (
                      <span className="inline-flex items-center gap-1 text-xs text-success">
                        <CheckCircle className="w-3.5 h-3.5" /> 活跃
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-muted">
                        <XCircle className="w-3.5 h-3.5" /> 停用
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className="p-1.5 text-muted hover:text-accent rounded transition-colors"
                        title="测试连接"
                        onClick={() => handleTest(model.id)}
                        disabled={testingId === model.id}
                      >
                        <Zap className={`w-4 h-4 ${testingId === model.id ? 'animate-pulse' : ''}`} />
                      </button>
                      {!model.is_default && (
                        <button
                          className="p-1.5 text-muted hover:text-warning rounded transition-colors"
                          title="设为默认"
                          onClick={() => handleSetDefault(model.id)}
                        >
                          <Star className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        className="p-1.5 text-muted hover:text-accent rounded transition-colors"
                        title="编辑"
                        onClick={() => handleEdit(model)}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {!model.is_builtin && (
                        <button
                          className="p-1.5 text-muted hover:text-error rounded transition-colors"
                          title="删除"
                          onClick={() => handleDelete(model)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ModelFormModal
        open={showForm}
        onClose={handleCloseForm}
        onSubmit={editingModel ? handleUpdate : handleCreate}
        initialData={editingModel}
      />

      <ConfirmModal
        open={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingModel(null);
        }}
        onConfirm={handleConfirmDeleteModel}
        title="删除模型"
        description={`确定删除模型"${deletingModel?.name}"？`}
        confirmText="删除"
        variant="danger"
      />
    </div>
  );
}

function ModelFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AIModelCreate) => Promise<void>;
  initialData: AIModel | null;
}) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AIModelCreate>({
    defaultValues: {
      name: '',
      provider: '',
      model_type: 'llm',
      model_name: '',
      api_key: '',
      base_url: '',
      config: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          name: initialData.name,
          provider: initialData.provider,
          model_type: initialData.model_type,
          model_name: initialData.model_name,
          api_key: initialData.api_key,
          base_url: initialData.base_url,
          config: initialData.config,
        });
      } else {
        reset({
          name: '',
          provider: '',
          model_type: 'llm',
          model_name: '',
          api_key: '',
          base_url: '',
          config: '',
        });
      }
    }
  }, [open, initialData, reset]);

  const handleFormSubmit = async (data: AIModelCreate) => {
    try {
      await onSubmit(data);
      reset();
      onClose();
    } catch {
      // Error handled by store
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialData ? '编辑模型' : '创建模型'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit(handleFormSubmit)}
            loading={isSubmitting}
          >
            {initialData ? '保存' : '创建'}
          </Button>
        </>
      }
    >
      <form className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="模型名称"
            placeholder="如：GPT-4o"
            {...register('name', { required: '请输入模型名称' })}
            error={errors.name?.message}
          />
          <Input
            label="提供商"
            placeholder="如：OpenAI"
            {...register('provider', { required: '请输入提供商' })}
            error={errors.provider?.message}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="model_type"
            control={control}
            render={({ field }) => (
              <Select
                label="模型类型"
                options={MODEL_TYPES}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />
          <Input
            label="模型标识"
            placeholder="如：gpt-4o"
            {...register('model_name', { required: '请输入模型标识' })}
            error={errors.model_name?.message}
          />
        </div>

        <Input
          label="API Key"
          type="password"
          placeholder="请输入 API Key"
          {...register('api_key')}
        />

        <Input
          label="Base URL"
          placeholder="如：https://api.openai.com/v1"
          {...register('base_url')}
        />

        <Textarea
          label="配置（JSON）"
          placeholder='{"temperature": 0.7}'
          rows={3}
          {...register('config')}
        />
      </form>
    </Modal>
  );
}
