import { useForm, Controller } from 'react-hook-form';
import { Input, Select, Textarea, Button, Modal, MultiSelect } from '../../../shared/components/ui';
import type { Agent, AgentCreate } from '../../../shared/types';

interface AgentFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AgentCreate) => Promise<void>;
  initialData?: Agent;
  models: { label: string; value: string }[];
  knowledgeBases: { label: string; value: string }[];
}

export function AgentForm({
  open,
  onClose,
  onSubmit,
  initialData,
  models,
  knowledgeBases,
}: AgentFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AgentCreate>({
    defaultValues: initialData
      ? {
          name: initialData.name,
          description: initialData.description,
          system_prompt: initialData.system_prompt,
          opening_message: initialData.opening_message,
          suggested_questions: initialData.suggested_questions,
          temperature: initialData.temperature,
          max_tokens: initialData.max_tokens,
          top_k: initialData.top_k,
          similarity_threshold: initialData.similarity_threshold,
          llm_model_id: initialData.llm_model_id,
          knowledge_base_ids: initialData.knowledge_base_ids,
        }
      : {
          name: '',
          description: '',
          system_prompt: '',
          opening_message: '',
          suggested_questions: '',
          temperature: 0.7,
          max_tokens: 2048,
          top_k: 3,
          similarity_threshold: 0.5,
          llm_model_id: null,
          knowledge_base_ids: [],
        },
  });

  const handleFormSubmit = async (data: AgentCreate) => {
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
      title={initialData ? '编辑智能体' : '创建智能体'}
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
          label="智能体名称"
          placeholder="请输入智能体名称"
          {...register('name', { required: '请输入智能体名称' })}
          error={errors.name?.message}
        />

        <Textarea
          label="描述"
          placeholder="请输入智能体描述"
          {...register('description')}
        />

        <Controller
          name="llm_model_id"
          control={control}
          render={({ field }) => (
            <Select
              label="LLM 模型"
              options={models}
              placeholder="请选择 LLM 模型"
              value={field.value != null ? String(field.value) : ''}
              onChange={(e) => {
                const val = e.target.value;
                field.onChange(val ? Number(val) : null);
              }}
            />
          )}
        />

        <Controller
          name="knowledge_base_ids"
          control={control}
          render={({ field }) => (
            <MultiSelect
              label="关联知识库"
              options={knowledgeBases}
              value={field.value?.map(String) || []}
              onChange={(vals) => field.onChange(vals.map(Number))}
              placeholder="选择关联的知识库（可多选）"
            />
          )}
        />

        <Textarea
          label="系统提示词"
          placeholder="设定智能体的角色和行为..."
          rows={4}
          {...register('system_prompt')}
        />

        <Input
          label="开场白"
          placeholder="智能体的第一句话"
          {...register('opening_message')}
        />

        <Textarea
          label="建议问题"
          placeholder="每行一个问题"
          rows={3}
          {...register('suggested_questions')}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Temperature"
            type="number"
            step="0.1"
            min={0}
            max={2}
            {...register('temperature', { valueAsNumber: true })}
          />
          <Input
            label="最大 Token"
            type="number"
            min={1}
            {...register('max_tokens', { valueAsNumber: true })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Top K"
            type="number"
            min={1}
            max={20}
            {...register('top_k', { valueAsNumber: true })}
          />
          <Input
            label="相似度阈值"
            type="number"
            step="0.05"
            min={0}
            max={1}
            {...register('similarity_threshold', { valueAsNumber: true })}
          />
        </div>
      </form>
    </Modal>
  );
}
