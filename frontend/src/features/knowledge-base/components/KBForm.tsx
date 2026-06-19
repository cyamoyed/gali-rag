import { useForm, Controller } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { Input, Select, Textarea, Button, Modal } from '../../../shared/components/ui';
import type { KBCreate, KnowledgeBase } from '../../../shared/types';

interface KBFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: KBCreate) => Promise<void>;
  initialData?: KnowledgeBase;
  defaultCategoryId?: number | null;
  categories: { label: string; value: string }[];
  models: { label: string; value: string }[];
}

export function KBForm({ open, onClose, onSubmit, initialData, defaultCategoryId, categories, models }: KBFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<KBCreate>({
    defaultValues: {
      name: '',
      description: '',
      kb_type: 'general',
      chunk_size: 500,
      chunk_overlap: 100,
      semantic_chunk_enabled: false,
    },
  });

  const kbType = watch('kb_type');

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          name: initialData.name,
          description: initialData.description,
          kb_type: initialData.kb_type,
          category_id: initialData.category_id,
          embedding_model_id: initialData.embedding_model_id,
          chunk_size: initialData.chunk_size,
          chunk_overlap: initialData.chunk_overlap,
          semantic_chunk_enabled: initialData.semantic_chunk_enabled,
        });
      } else {
        reset({
          name: '',
          description: '',
          kb_type: 'general',
          category_id: defaultCategoryId ?? null,
          embedding_model_id: null,
          chunk_size: 500,
          chunk_overlap: 100,
          semantic_chunk_enabled: false,
        });
      }
      setUrls([]);
      setUrlInput('');
    }
  }, [open, initialData, defaultCategoryId, reset]);

  const [urls, setUrls] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');

  useEffect(() => {
    if (open) {
      if (initialData?.web_config) {
        try {
          const config = JSON.parse(initialData.web_config);
          setUrls(config.urls || []);
        } catch { setUrls([]); }
      } else {
        setUrls([]);
      }
      setUrlInput('');
    }
  }, [open, initialData]);

  const addUrl = () => {
    const trimmed = urlInput.trim();
    if (trimmed && !urls.includes(trimmed)) {
      setUrls([...urls, trimmed]);
      setUrlInput('');
    }
  };

  const removeUrl = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index));
  };

  const handleFormSubmit = async (data: KBCreate) => {
    try {
      const submitData = data.kb_type === 'web'
        ? { ...data, web_config: JSON.stringify({ urls }) }
        : data;
      await onSubmit(submitData);
      onClose();
    } catch {
      // Error handled by store
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialData ? '编辑知识库' : '创建知识库'}
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
        <Input
          label="知识库名称"
          placeholder="请输入知识库名称"
          required
          {...register('name', { required: '请输入知识库名称' })}
          error={errors.name?.message}
        />

        <Textarea
          label="描述"
          placeholder="请输入知识库描述"
          {...register('description')}
        />

        <Select
          label="知识库类型"
          options={[
            { label: '通用文档', value: 'general' },
            { label: '网站链接', value: 'web' },
          ]}
          disabled={!!initialData}
          required
          {...register('kb_type', { required: '请选择知识库类型' })}
          error={errors.kb_type?.message}
        />

        {kbType === 'web' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-ink">网站 URL 列表</label>
            <div className="flex gap-2">
              <Input
                placeholder="输入 URL，如 https://example.com"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }}
              />
              <Button variant="secondary" size="sm" onClick={addUrl} type="button">
                添加
              </Button>
            </div>
            {urls.length > 0 && (
              <div className="border border-hairline rounded-sm divide-y divide-hairline max-h-40 overflow-y-auto">
                {urls.map((url, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="text-ink truncate flex-1 mr-2">{url}</span>
                    <button
                      type="button"
                      className="text-muted hover:text-error text-xs flex-shrink-0"
                      onClick={() => removeUrl(i)}
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <Controller
          name="category_id"
          control={control}
          render={({ field }) => (
            <Select
              label="目录"
              options={[{ label: '根目录', value: '/' }, ...categories]}
              value={field.value != null ? String(field.value) : '/'}
              onChange={(e) => {
                const val = e.target.value;
                field.onChange(val === '/' ? null : Number(val));
              }}
              error={errors.category_id?.message}
            />
          )}
        />

        <Controller
          name="embedding_model_id"
          control={control}
          rules={{ required: '请选择 Embedding 模型' }}
          render={({ field }) => (
            <Select
              label="Embedding 模型"
              options={models}
              placeholder="请选择 Embedding 模型"
              required
              value={field.value != null ? String(field.value) : ''}
              onChange={(e) => {
                const val = e.target.value;
                field.onChange(val ? Number(val) : null);
              }}
              error={errors.embedding_model_id?.message}
            />
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="切片大小"
            type="number"
            {...register('chunk_size', { valueAsNumber: true })}
          />
          <Input
            label="切片重叠"
            type="number"
            {...register('chunk_overlap', { valueAsNumber: true })}
          />
        </div>
      </form>
    </Modal>
  );
}
