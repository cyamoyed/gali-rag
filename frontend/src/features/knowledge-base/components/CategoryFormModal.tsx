import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Input, Textarea, Button, Modal, Select } from '../../../shared/components/ui';
import type { CategoryTree } from '../../../shared/types';

interface CategoryFormData {
  name: string;
  description: string;
  parent_id: number | null;
}

interface CategoryFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  initialData: CategoryTree | null;
  defaultParentId: number | null;
  categories: CategoryTree[];
}

export function CategoryFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  defaultParentId,
  categories,
}: CategoryFormModalProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormData>({
    defaultValues: {
      name: '',
      description: '',
      parent_id: null,
    },
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          name: initialData.name,
          description: initialData.description,
          parent_id: initialData.parent_id,
        });
      } else {
        reset({
          name: '',
          description: '',
          parent_id: defaultParentId,
        });
      }
    }
  }, [open, initialData, defaultParentId, reset]);

  const handleFormSubmit = async (data: CategoryFormData) => {
    try {
      await onSubmit(data);
      reset();
      onClose();
    } catch {
      // Error handled by caller
    }
  };

  const getDescendantIds = (cat: CategoryTree): number[] => {
    const ids: number[] = [cat.id];
    if (cat.children) {
      for (const child of cat.children) {
        ids.push(...getDescendantIds(child));
      }
    }
    return ids;
  };

  const excludeIds = new Set(
    initialData ? [initialData.id, ...getDescendantIds(initialData)] : []
  );

  const flattenCategories = (
    cats: CategoryTree[],
    depth = 0,
  ): { label: string; value: string }[] => {
    const result: { label: string; value: string }[] = [];
    for (const cat of cats) {
      if (!excludeIds.has(cat.id)) {
        result.push({
          label: `${'  '.repeat(depth)}${cat.name}`,
          value: String(cat.id),
        });
        if (cat.children) {
          result.push(...flattenCategories(cat.children, depth + 1));
        }
      }
    }
    return result;
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialData ? '编辑目录' : '创建目录'}
      size="md"
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
          label="目录名称"
          placeholder="请输入目录名称"
          {...register('name', { required: '请输入目录名称' })}
          error={errors.name?.message}
        />

        <Textarea
          label="描述"
          placeholder="请输入目录描述"
          {...register('description')}
        />

        {!initialData && categories.length > 0 && (
          <Controller
            name="parent_id"
            control={control}
            render={({ field }) => (
              <Select
                label="父目录"
                options={flattenCategories(categories)}
                placeholder="无（顶级目录）"
                value={field.value != null ? String(field.value) : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  field.onChange(val ? Number(val) : null);
                }}
              />
            )}
          />
        )}
      </form>
    </Modal>
  );
}
