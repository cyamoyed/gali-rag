import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Database,
  FolderTree,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Pencil,
  Trash2,
  FolderPlus,
  X,
  MoreHorizontal,
} from 'lucide-react';
import { PageHeader } from '../../app/layout/PageHeader';
import { Button, Input, Select, Spinner, EmptyState, Badge, ConfirmModal } from '../../shared/components/ui';
import { KBCard } from '../../shared/components/cards/KBCard';
import { KBForm } from './components/KBForm';
import { CategoryFormModal } from './components/CategoryFormModal';
import { useKBStore, useModelStore, useUIStore } from '../../shared/stores';
import { categoryService } from '../../shared/services';
import { formatTime } from '../../shared/utils/format';
import type { KBCreate, CategoryTree, KnowledgeBase } from '../../shared/types';

export default function KBList() {
  const navigate = useNavigate();
  const {
    knowledgeBases,
    loading,
    fetchKnowledgeBases,
    createKnowledgeBase,
    updateKnowledgeBase,
    deleteKnowledgeBase,
    categories,
    categoryTree,
    fetchCategories,
    fetchCategoryTree,
  } = useKBStore();
  const { models, fetchModels } = useModelStore();
  const addNotification = useUIStore((s) => s.addNotification);
  const [showForm, setShowForm] = useState(false);
  const [editingKB, setEditingKB] = useState<KnowledgeBase | null>(null);
  const [showDeleteKBConfirm, setShowDeleteKBConfirm] = useState(false);
  const [deletingKB, setDeletingKB] = useState<{ id: number; name: string } | null>(null);
  const [filterType, setFilterType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryTree | null>(null);
  const [parentCategoryId, setParentCategoryId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<{ id: number; name: string } | null>(null);

  useEffect(() => {
    fetchKnowledgeBases();
    fetchCategories();
    fetchCategoryTree();
    fetchModels({ model_type: 'embedding' });
  }, [fetchKnowledgeBases, fetchCategories, fetchCategoryTree, fetchModels]);

  const filteredKBs = useMemo(() => {
    let kbs = knowledgeBases;
    if (selectedCategoryId !== null) {
      kbs = kbs.filter((kb) => kb.category_id === selectedCategoryId);
    }
    if (filterType) {
      kbs = kbs.filter((kb) => kb.kb_type === filterType);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      kbs = kbs.filter((kb) =>
        kb.name.toLowerCase().includes(q) ||
        kb.description.toLowerCase().includes(q)
      );
    }
    return [...kbs].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  }, [knowledgeBases, selectedCategoryId, filterType, searchQuery]);

  const handleCreate = async (data: KBCreate) => {
    if (editingKB) {
      await updateKnowledgeBase(editingKB.id, data);
      addNotification({ type: 'success', message: '知识库已更新' });
    } else {
      await createKnowledgeBase(data);
      addNotification({ type: 'success', message: '知识库已创建' });
    }
  };

  const handleEditKB = (e: React.MouseEvent, kb: KnowledgeBase) => {
    e.stopPropagation();
    setEditingKB(kb);
    setShowForm(true);
  };

  const handleDeleteKB = (e: React.MouseEvent, kb: KnowledgeBase) => {
    e.stopPropagation();
    setDeletingKB({ id: kb.id, name: kb.name });
    setShowDeleteKBConfirm(true);
  };

  const handleConfirmDeleteKB = useCallback(async () => {
    if (!deletingKB) return;
    try {
      await deleteKnowledgeBase(deletingKB.id);
      addNotification({ type: 'success', message: '知识库已删除' });
    } catch {
      addNotification({ type: 'error', message: '删除知识库失败' });
    }
  }, [deletingKB, deleteKnowledgeBase, addNotification]);

  const categoryOptions = categories.map((c) => ({
    label: c.name,
    value: String(c.id),
  }));
  const modelOptions = models.map((m) => ({
    label: m.name,
    value: String(m.id),
  }));

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setParentCategoryId(selectedCategoryId);
    setShowCategoryForm(true);
  };

  const handleCreateSubCategory = (parentId: number) => {
    setEditingCategory(null);
    setParentCategoryId(parentId);
    setShowCategoryForm(true);
  };

  const handleEditCategory = (cat: CategoryTree) => {
    setEditingCategory(cat);
    setParentCategoryId(null);
    setShowCategoryForm(true);
  };

  const handleDeleteCategory = useCallback(
    async (catId: number, catName: string) => {
      setDeletingCategory({ id: catId, name: catName });
      setShowDeleteConfirm(true);
    },
    [],
  );

  const handleConfirmDeleteCategory = useCallback(async () => {
    if (!deletingCategory) return;
    try {
      await categoryService.deleteCategory(deletingCategory.id);
      addNotification({ type: 'success', message: '目录已删除' });
      fetchCategoryTree();
      fetchCategories();
      fetchKnowledgeBases();
      if (selectedCategoryId === deletingCategory.id) {
        setSelectedCategoryId(null);
      }
    } catch {
      addNotification({ type: 'error', message: '删除目录失败' });
    }
  }, [deletingCategory, addNotification, fetchCategoryTree, fetchKnowledgeBases, selectedCategoryId]);

  const handleCategoryFormSubmit = async (data: { name: string; description: string; parent_id: number | null }) => {
    try {
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, {
          name: data.name,
          description: data.description,
        });
        addNotification({ type: 'success', message: '目录已更新' });
      } else {
        await categoryService.createCategory({
          name: data.name,
          description: data.description,
          parent_id: data.parent_id,
        });
        addNotification({ type: 'success', message: '目录已创建' });
      }
      fetchCategoryTree();
      fetchCategories();
    } catch (err) {
      addNotification({ type: 'error', message: editingCategory ? '更新目录失败' : '创建目录失败' });
      throw err;
    }
  };

  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);

  if (loading && knowledgeBases.length === 0) {
    return <div className="flex items-center justify-center h-64"><Spinner /></div>;
  }

  return (
    <div className="flex min-h-0">
      {mobileCategoryOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileCategoryOpen(false)}
        />
      )}
      <div className={`
        w-64 flex-shrink-0 border-r border-hairline bg-white overflow-y-auto
        fixed inset-y-0 left-0 z-40 lg:relative lg:z-auto lg:translate-x-0
        ${mobileCategoryOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        transition-transform duration-300
      `}>
        <div className="p-4 border-b border-hairline">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-ink">知识库</h3>
            <button
              className="lg:hidden p-1 text-muted hover:text-ink rounded transition-colors"
              onClick={() => setMobileCategoryOpen(false)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <button
            className="w-full flex items-center justify-center gap-2 px-3 py-2 mb-3 bg-accent text-white text-sm font-medium rounded-md hover:bg-accent/90 transition-colors"
            onClick={handleCreateCategory}
          >
            <FolderPlus className="w-4 h-4" />
            新建目录
          </button>
          <button
            className={`w-full text-left px-3 py-2 rounded-sm text-sm transition-colors ${
              selectedCategoryId === null
                ? 'bg-accent-soft text-accent font-medium'
                : 'text-body hover:bg-canvas-soft hover:text-ink'
            }`}
            onClick={() => setSelectedCategoryId(null)}
          >
            全部知识库
          </button>
        </div>
        <div className="py-2">
          {categoryTree.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <FolderTree className="w-8 h-8 mx-auto text-muted mb-2" />
              <p className="text-xs text-muted">暂无目录</p>
              <button
                className="mt-2 text-xs text-accent hover:underline"
                onClick={handleCreateCategory}
              >
                创建目录
              </button>
            </div>
          ) : (
            categoryTree.map((cat) => (
              <CategoryTreeNode
                key={cat.id}
                category={cat}
                depth={0}
                selectedCategoryId={selectedCategoryId}
                onSelect={setSelectedCategoryId}
                onCreateSub={handleCreateSubCategory}
                onEdit={handleEditCategory}
                onDelete={handleDeleteCategory}
              />
            ))
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-w-0">
        <div className="p-4 lg:p-6">
          <PageHeader
            title="知识库"
            subtitle={
              selectedCategoryId !== null
                ? `当前目录: ${categories.find((c) => c.id === selectedCategoryId)?.name || '未知'}`
                : '管理和组织你的知识库文档'
            }
            actions={
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setShowForm(true)}
              >
                创建知识库
              </Button>
            }
          />

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
            <button
              onClick={() => setMobileCategoryOpen(true)}
              className="lg:hidden flex items-center gap-2 px-3 py-2 text-sm text-body border border-hairline rounded-sm hover:bg-canvas-soft transition-colors"
            >
              <FolderTree className="w-4 h-4" />
              目录
            </button>
            <div className="flex-1 max-w-xs w-full sm:w-auto">
              <Input
                placeholder="搜索知识库..."
                prefix={<Search className="w-4 h-4" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select
              options={[
                { label: '全部类型', value: '' },
                { label: '通用文档', value: 'general' },
                { label: '网站链接', value: 'web' },
              ]}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            />
          </div>

          {filteredKBs.length === 0 ? (
            knowledgeBases.length === 0 ? (
              <EmptyState
                icon={<Database className="w-8 h-8" />}
                title="暂无知识库"
                description="创建你的第一个知识库，开始构建智能问答系统"
                action={
                  <Button variant="primary" onClick={() => setShowForm(true)}>
                    创建知识库
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={<Search className="w-8 h-8" />}
                title="无匹配结果"
                description="没有找到符合条件的知识库，请调整搜索或筛选条件"
              />
            )
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredKBs.map((kb) => (
                <KBCard
                  key={kb.id}
                  id={kb.id}
                  name={kb.name}
                  description={kb.description}
                  kb_type={kb.kb_type}
                  documentCount={kb.document_count}
                  chunkCount={kb.chunk_count}
                  categoryName={kb.category_id ? categories.find(c => c.id === kb.category_id)?.name : '根目录'}
                  createdAt={formatTime(kb.created_at)}
                  onClick={() => navigate(`/knowledge-bases/${kb.id}`)}
                  onEdit={(e) => handleEditKB(e, kb)}
                  onDelete={(e) => handleDeleteKB(e, kb)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <KBForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditingKB(null); }}
        onSubmit={handleCreate}
        initialData={editingKB || undefined}
        defaultCategoryId={selectedCategoryId}
        categories={categoryOptions}
        models={modelOptions}
      />

      <CategoryFormModal
        open={showCategoryForm}
        onClose={() => setShowCategoryForm(false)}
        onSubmit={handleCategoryFormSubmit}
        initialData={editingCategory}
        defaultParentId={parentCategoryId}
        categories={categoryTree}
      />

      <ConfirmModal
        open={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingCategory(null);
        }}
        onConfirm={handleConfirmDeleteCategory}
        title="删除目录"
        description={`确定删除目录"${deletingCategory?.name}"？子目录和知识库将移至未分类。`}
        confirmText="删除"
        variant="danger"
      />

      <ConfirmModal
        open={showDeleteKBConfirm}
        onClose={() => {
          setShowDeleteKBConfirm(false);
          setDeletingKB(null);
        }}
        onConfirm={handleConfirmDeleteKB}
        title="删除知识库"
        description={`确定删除知识库"${deletingKB?.name}"？所有文档和向量数据将被永久删除，此操作不可恢复。`}
        confirmText="删除"
        variant="danger"
      />
    </div>
  );
}

function CategoryTreeNode({
  category,
  depth,
  selectedCategoryId,
  onSelect,
  onCreateSub,
  onEdit,
  onDelete,
}: {
  category: CategoryTree;
  depth: number;
  selectedCategoryId: number | null;
  onSelect: (id: number | null) => void;
  onCreateSub: (parentId: number) => void;
  onEdit: (cat: CategoryTree) => void;
  onDelete: (catId: number, name: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const hasChildren = category.children && category.children.length > 0;
  const isSelected = selectedCategoryId === category.id;

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1.5 transition-colors group cursor-pointer ${
          isSelected ? 'bg-accent-soft' : 'hover:bg-canvas-soft'
        }`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        <button
          className="w-4 h-4 flex items-center justify-center text-muted hover:text-ink transition-colors flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) setExpanded(!expanded);
          }}
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )
          ) : (
            <span className="w-3 h-3" />
          )}
        </button>

        <div
          className="flex items-center gap-1.5 flex-1 min-w-0"
          onClick={() => onSelect(category.id)}
        >
          {hasChildren && expanded ? (
            <FolderOpen className="w-4 h-4 text-accent flex-shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-accent flex-shrink-0" />
          )}
          <span
            className={`text-sm truncate flex-1 ${
              isSelected ? 'text-accent font-medium' : 'text-ink'
            }`}
          >
            {category.name}
          </span>
          <Badge variant="default" className="text-xs">
            {category.kb_count}
          </Badge>
        </div>

        <div className="relative flex-shrink-0">
          <button
            className="p-1 text-muted hover:text-ink rounded transition-colors opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                }}
              />
              <div className="absolute right-0 top-full mt-1 z-20 w-36 bg-white rounded-md shadow-lg border border-hairline py-1">
                <button
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-ink hover:bg-canvas-soft transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onCreateSub(category.id);
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  添加子目录
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-ink hover:bg-canvas-soft transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onEdit(category);
                  }}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  编辑
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-error hover:bg-canvas-soft transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onDelete(category.id, category.name);
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  删除
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {expanded && hasChildren && (
        <div>
          {category.children.map((child) => (
            <CategoryTreeNode
              key={child.id}
              category={child}
              depth={depth + 1}
              selectedCategoryId={selectedCategoryId}
              onSelect={onSelect}
              onCreateSub={onCreateSub}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
