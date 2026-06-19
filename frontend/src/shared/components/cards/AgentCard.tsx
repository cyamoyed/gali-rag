import { Bot, Database, Cpu } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface AgentCardProps {
  id: number;
  name: string;
  description: string;
  status: 'draft' | 'published';
  modelName?: string;
  kbCount: number;
  onClick?: () => void;
}

const statusConfig = {
  draft: { label: '草稿', variant: 'default' as const },
  published: { label: '已发布', variant: 'success' as const },
};

export function AgentCard({
  name,
  description,
  status,
  modelName,
  kbCount,
  onClick,
}: AgentCardProps) {
  const statusInfo = statusConfig[status];

  return (
    <div
      className="bg-white border border-hairline rounded-lg p-5 shadow-sm hover:border-accent hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 rounded-md bg-accent-soft text-accent flex items-center justify-center">
          <Bot className="w-6 h-6" />
        </div>
      </div>

      <h3 className="text-base font-semibold text-ink mb-1">{name}</h3>
      <p className="text-sm text-muted line-clamp-2 mb-4">{description}</p>

      <div className="flex items-center justify-between pt-3 border-t border-hairline">
        <div className="flex items-center gap-4">
          {modelName && (
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <Cpu className="w-3.5 h-3.5" />
              {modelName}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <Database className="w-3.5 h-3.5" />
            {kbCount} 个知识库
          </span>
        </div>
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
      </div>
    </div>
  );
}
