import { Clock, FileText, Bot, Database } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'document' | 'agent' | 'knowledge_base';
  title: string;
  description: string;
  time: string;
}

interface ActivityListProps {
  items: ActivityItem[];
}

const typeConfig = {
  document: { icon: FileText, color: 'text-accent bg-accent-soft' },
  agent: { icon: Bot, color: 'text-violet-600 bg-violet-100' },
  knowledge_base: { icon: Database, color: 'text-success bg-success-soft' },
};

export function ActivityList({ items }: ActivityListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted">
        暂无最近活动
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {items.map((item) => {
        const config = typeConfig[item.type];
        const Icon = config.icon;
        return (
          <div
            key={item.id}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-canvas-soft transition-colors"
          >
            <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${config.color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink truncate">{item.title}</p>
              <p className="text-xs text-muted truncate">{item.description}</p>
            </div>
            <span className="flex items-center gap-1 text-xs text-muted flex-shrink-0">
              <Clock className="w-3 h-3" />
              {item.time}
            </span>
          </div>
        );
      })}
    </div>
  );
}
