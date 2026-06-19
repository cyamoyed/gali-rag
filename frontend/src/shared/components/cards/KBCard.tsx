import { Database, Globe, FileText, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface KBCardProps {
  id: number;
  name: string;
  description: string;
  kb_type: 'general' | 'web';
  status?: 'ready' | 'pending' | 'error';
  documentCount: number;
  chunkCount: number;
  categoryName?: string;
  createdAt?: string;
  onClick?: () => void;
  onEdit?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
}

const typeIcons = {
  general: Database,
  web: Globe,
};

const statusConfig = {
  ready: { label: '已就绪', variant: 'success' as const },
  pending: { label: '处理中', variant: 'warning' as const },
  error: { label: '错误', variant: 'error' as const },
};

const typeColors = {
  general: 'bg-violet-soft text-violet-600',
  web: 'bg-accent-soft text-accent',
};

export function KBCard({
  name,
  description,
  kb_type,
  status,
  documentCount,
  chunkCount,
  categoryName,
  createdAt,
  onClick,
  onEdit,
  onDelete,
}: KBCardProps) {
  const TypeIcon = typeIcons[kb_type];
  const statusInfo = status ? statusConfig[status] : null;

  return (
    <div
      className="bg-white border border-hairline rounded-lg p-5 shadow-sm hover:border-accent hover:shadow-md transition-all duration-200 cursor-pointer relative group"
      onClick={onClick}
    >
      {onEdit && (
        <button
          className="absolute top-3 right-10 p-1.5 text-muted hover:text-accent rounded-md opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-sm border border-hairline"
          title="编辑知识库"
          onClick={onEdit}
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
      {onDelete && (
        <button
          className="absolute top-3 right-3 p-1.5 text-muted hover:text-error rounded-md opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-sm border border-hairline"
          title="删除知识库"
          onClick={onDelete}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}

      <div className="flex items-start gap-3 mb-2">
        <div className={`w-10 h-10 rounded-md flex-shrink-0 flex items-center justify-center ${typeColors[kb_type]}`}>
          <TypeIcon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-ink truncate">{name}</h3>
          <p className="text-xs text-muted line-clamp-2 mt-0.5">{description}</p>
        </div>
        {statusInfo && <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>}
      </div>

      {(categoryName || createdAt) && (
        <div className="flex flex-col gap-0.5 mb-3 pl-13">
          {categoryName && (
            <span className="text-xs text-muted">{categoryName}</span>
          )}
          {createdAt && (
            <span className="text-xs text-muted">{createdAt}</span>
          )}
        </div>
      )}

      <div className="flex items-center gap-4 pt-3 border-t border-hairline">
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <FileText className="w-3.5 h-3.5" />
          {documentCount} 篇文档
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <Database className="w-3.5 h-3.5" />
          {chunkCount} 切片
        </span>
      </div>
    </div>
  );
}
