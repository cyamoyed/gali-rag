import { useEffect, useState, useMemo } from 'react';
import { Plus, FileText, Pencil, RotateCcw, Star, Layers, Settings } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { PageHeader } from '../../app/layout/PageHeader';
import { Button, Input, Textarea, Select, Modal, Spinner, EmptyState, Badge, ConfirmModal } from '../../shared/components/ui';
import { useModelStore, useUIStore } from '../../shared/stores';
import type { PromptTemplate, PromptCreate, PresetBrief, PresetCreate } from '../../shared/types';

const CATEGORY_LABELS: Record<string, string> = {
  qa_main: '问答主提示词',
  query_rewrite: 'Query改写',
  doc_chunk: '文档切片',
  doc_summary: '文档摘要',
  conflict_detect: '冲突检测',
};

export default function PromptPage() {
  const {
    prompts, presets, loading,
    fetchPrompts, fetchPresets, activatePreset, duplicatePreset, deletePreset,
    resetPrompt, setDefaultPrompt,
  } = useModelStore();
  const addNotification = useUIStore((s) => s.addNotification);

  const [activePresetId, setActivePresetId] = useState<number | null>(null);
  const [showCreatePreset, setShowCreatePreset] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptTemplate | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resettingPromptId, setResettingPromptId] = useState<number | null>(null);

  useEffect(() => {
    fetchPresets();
    fetchPrompts();
  }, [fetchPresets, fetchPrompts]);

  const activePreset = useMemo(
    () => presets.find((p) => p.is_active) || presets[0] || null,
    [presets],
  );

  useEffect(() => {
    if (activePreset && activePresetId === null) {
      setActivePresetId(activePreset.id);
    }
  }, [activePreset, activePresetId]);

  const selectedPresetId = activePresetId ?? activePreset?.id;

  const presetPrompts = useMemo(
    () => prompts.filter((p) => p.preset_id === selectedPresetId),
    [prompts, selectedPresetId],
  );

  const handleActivate = async (presetId: number) => {
    try {
      await activatePreset(presetId);
      addNotification({ type: 'success', message: '已切换模板套' });
    } catch {
      addNotification({ type: 'error', message: '切换失败' });
    }
  };

  const handleDuplicate = async (presetId: number) => {
    const name = prompt('请输入新模板套名称:');
    if (!name) return;
    try {
      await duplicatePreset(presetId, name);
      addNotification({ type: 'success', message: '已复制模板套' });
    } catch {
      addNotification({ type: 'error', message: '复制失败' });
    }
  };

  const handleDeletePreset = async (preset: PresetBrief) => {
    if (preset.is_system) {
      addNotification({ type: 'warning', message: '系统内置模板套不可删除' });
      return;
    }
    if (!confirm(`确定删除模板套"${preset.name}"？`)) return;
    try {
      await deletePreset(preset.id);
      if (activePresetId === preset.id) setActivePresetId(null);
      addNotification({ type: 'success', message: '已删除模板套' });
    } catch {
      addNotification({ type: 'error', message: '删除失败' });
    }
  };

  const handleEditPrompt = (prompt: PromptTemplate) => {
    setEditingPrompt(prompt);
    setShowEditModal(true);
  };

  const handleReset = (promptId: number) => {
    setResettingPromptId(promptId);
    setShowResetConfirm(true);
  };

  const handleConfirmReset = async () => {
    if (!resettingPromptId) return;
    try {
      await resetPrompt(resettingPromptId);
      addNotification({ type: 'success', message: '已重置为系统默认' });
    } catch {
      addNotification({ type: 'error', message: '重置失败' });
    }
  };

  const handleSetDefault = async (promptId: number) => {
    try {
      await setDefaultPrompt(promptId);
      addNotification({ type: 'success', message: '已设为默认' });
    } catch {
      addNotification({ type: 'error', message: '设置失败' });
    }
  };

  if (loading && presets.length === 0) {
    return <div className="flex items-center justify-center h-64"><Spinner /></div>;
  }

  return (
    <div>
      <PageHeader
        title="Prompt 模板"
        subtitle="管理模板套，一键切换整套提示词"
        actions={
          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreatePreset(true)}>
            新建模板套
          </Button>
        }
      />

      {/* Preset Selector */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-muted" />
          <span className="text-sm font-medium text-ink">模板套</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className={`relative flex flex-col gap-1 px-4 py-3 rounded-lg border cursor-pointer transition-all min-w-[180px] ${
                selectedPresetId === preset.id
                  ? 'border-accent bg-accent/5 shadow-sm'
                  : 'border-hairline hover:border-accent/50 bg-canvas'
              }`}
              onClick={() => setActivePresetId(preset.id)}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-ink">{preset.name}</span>
                {preset.is_active && <Badge variant="primary">激活</Badge>}
                {preset.is_system && <Badge variant="info">系统</Badge>}
              </div>
              {preset.description && (
                <span className="text-xs text-muted truncate max-w-[200px]">{preset.description}</span>
              )}
              <div className="flex items-center gap-1 mt-1">
                {!preset.is_active && (
                  <button
                    className="text-xs text-accent hover:underline"
                    onClick={(e) => { e.stopPropagation(); handleActivate(preset.id); }}
                  >
                    激活
                  </button>
                )}
                <button
                  className="text-xs text-muted hover:text-accent hover:underline"
                  onClick={(e) => { e.stopPropagation(); handleDuplicate(preset.id); }}
                >
                  复制
                </button>
                {!preset.is_system && (
                  <button
                    className="text-xs text-muted hover:text-error hover:underline"
                    onClick={(e) => { e.stopPropagation(); handleDeletePreset(preset); }}
                  >
                    删除
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Templates Table */}
      {selectedPresetId ? (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-4 h-4 text-muted" />
            <span className="text-sm font-medium text-ink">
              {presets.find((p) => p.id === selectedPresetId)?.name || ''} - 模板内容
            </span>
          </div>
          {presetPrompts.length === 0 ? (
            <EmptyState icon={<FileText className="w-8 h-8" />} title="暂无模板" description="该模板套下没有模板" />
          ) : (
            <div className="bg-canvas rounded-lg border border-hairline overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-hairline bg-canvas-soft">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase">类别</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase">名称</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase">描述</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase">状态</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted uppercase">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {presetPrompts.map((prompt) => (
                    <tr key={prompt.id} className="border-b border-hairline last:border-0 hover:bg-canvas-soft/50 transition-colors">
                      <td className="px-4 py-3">
                        <Badge variant="default">{CATEGORY_LABELS[prompt.category] || prompt.category}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-ink">{prompt.name}</span>
                          {prompt.is_default && <Badge variant="primary">默认</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-body max-w-[200px] truncate">
                        {prompt.description || '-'}
                      </td>
                      <td className="px-4 py-3">
                        {prompt.is_system ? <Badge variant="info">系统</Badge> : <Badge variant="default">自定义</Badge>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {!prompt.is_default && (
                            <button className="p-1.5 text-muted hover:text-warning rounded transition-colors" title="设为默认" onClick={() => handleSetDefault(prompt.id)}>
                              <Star className="w-4 h-4" />
                            </button>
                          )}
                          {prompt.is_system && (
                            <button className="p-1.5 text-muted hover:text-accent rounded transition-colors" title="重置" onClick={() => handleReset(prompt.id)}>
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                          <button className="p-1.5 text-muted hover:text-accent rounded transition-colors" title="编辑" onClick={() => handleEditPrompt(prompt)}>
                            <Pencil className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon={<Layers className="w-8 h-8" />}
          title="暂无模板套"
          description="创建一套模板开始使用"
          action={
            <Button variant="primary" onClick={() => setShowCreatePreset(true)}>
              新建模板套
            </Button>
          }
        />
      )}

      {/* Create Preset Modal */}
      <CreatePresetModal
        open={showCreatePreset}
        onClose={() => setShowCreatePreset(false)}
      />

      {/* Edit Prompt Modal */}
      <PromptEditModal
        open={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingPrompt(null); }}
        prompt={editingPrompt}
      />

      {/* Reset Confirm */}
      <ConfirmModal
        open={showResetConfirm}
        onClose={() => { setShowResetConfirm(false); setResettingPromptId(null); }}
        onConfirm={handleConfirmReset}
        title="重置模板"
        description="确定重置为系统默认？当前修改将丢失。"
        confirmText="重置"
        variant="warning"
      />
    </div>
  );
}

function CreatePresetModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { createPreset, presets } = useModelStore();
  const addNotification = useUIStore((s) => s.addNotification);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<{
    name: string;
    description: string;
    source_preset_id: string;
  }>({
    defaultValues: { name: '', description: '', source_preset_id: '' },
  });

  useEffect(() => {
    if (open) reset({ name: '', description: '', source_preset_id: '' });
  }, [open, reset]);

  const onSubmit = async (data: { name: string; description: string; source_preset_id: string }) => {
    try {
      if (data.source_preset_id) {
        await duplicatePreset(Number(data.source_preset_id), data.name);
      } else {
        const templates: PresetCreate['templates'] = ['qa_main', 'query_rewrite', 'doc_chunk', 'doc_summary', 'conflict_detect'].map(
          (cat) => ({
            name: CATEGORY_LABELS[cat] || cat,
            category: cat,
            content: `[${data.name}] ${CATEGORY_LABELS[cat] || cat} 模板内容`,
            description: '',
          }),
        );
        await createPreset({ name: data.name, description: data.description, templates });
      }
      addNotification({ type: 'success', message: '模板套创建成功' });
      onClose();
    } catch {
      addNotification({ type: 'error', message: '创建失败' });
    }
  };

  const { duplicatePreset } = useModelStore();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="新建模板套"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>取消</Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isSubmitting}>创建</Button>
        </>
      }
    >
      <form className="space-y-4">
        <Input
          label="名称"
          placeholder="如：我的客服模板"
          {...register('name', { required: '请输入名称' })}
          error={errors.name?.message}
        />
        <Textarea
          label="描述"
          placeholder="模板套用途说明"
          {...register('description')}
        />
        <Select
          label="从现有模板套复制（可选）"
          options={[
            { label: '不复制，使用空白模板', value: '' },
            ...presets.map((p) => ({ label: p.name, value: String(p.id) })),
          ]}
          {...register('source_preset_id')}
        />
      </form>
    </Modal>
  );
}

function PromptEditModal({
  open,
  onClose,
  prompt,
}: {
  open: boolean;
  onClose: () => void;
  prompt: PromptTemplate | null;
}) {
  const { updatePrompt } = useModelStore();
  const addNotification = useUIStore((s) => s.addNotification);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PromptCreate>({
    defaultValues: { name: '', category: '', content: '', description: '' },
  });

  useEffect(() => {
    if (open && prompt) {
      reset({ name: prompt.name, category: prompt.category, content: prompt.content, description: prompt.description });
    }
  }, [open, prompt, reset]);

  const onSubmit = async (data: PromptCreate) => {
    if (!prompt) return;
    try {
      await updatePrompt(prompt.id, { name: data.name, content: data.content, description: data.description });
      addNotification({ type: 'success', message: '模板已更新' });
      onClose();
    } catch {
      addNotification({ type: 'error', message: '更新失败' });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="编辑模板"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>取消</Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isSubmitting}>保存</Button>
        </>
      }
    >
      <form className="space-y-4">
        <Input
          label="模板名称"
          {...register('name', { required: '请输入名称' })}
          error={errors.name?.message}
        />
        <Input
          label="分类"
          {...register('category')}
          disabled
        />
        <Textarea
          label="描述"
          {...register('description')}
        />
        <Textarea
          label="模板内容"
          rows={10}
          {...register('content', { required: '请输入模板内容' })}
          error={errors.content?.message}
        />
      </form>
    </Modal>
  );
}
