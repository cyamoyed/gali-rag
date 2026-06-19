import { useEffect } from 'react';
import { Database, HardDrive, FileText, Layers, Server } from 'lucide-react';
import { PageHeader } from '../../app/layout/PageHeader';
import { Spinner } from '../../shared/components/ui';
import { useModelStore } from '../../shared/stores';

const RESOURCE_CARDS = [
  {
    key: 'chroma_size_mb',
    label: 'ChromaDB 大小',
    icon: Database,
    unit: 'MB',
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
  {
    key: 'database_size_mb',
    label: '数据库大小',
    icon: Server,
    unit: 'MB',
    color: 'text-success',
    bg: 'bg-success/10',
  },
  {
    key: 'upload_size_mb',
    label: '上传文件大小',
    icon: HardDrive,
    unit: 'MB',
    color: 'text-warning',
    bg: 'bg-warning/10',
  },
  {
    key: 'total_documents',
    label: '文档总数',
    icon: FileText,
    unit: '个',
    color: 'text-link',
    bg: 'bg-link-bg-soft',
  },
  {
    key: 'total_chunks',
    label: '分块总数',
    icon: Layers,
    unit: '个',
    color: 'text-ink',
    bg: 'bg-canvas-soft-2',
  },
] as const;

export default function SettingsPage() {
  const { resources, loading, fetchResources } = useModelStore();

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  if (loading && !resources) {
    return <div className="flex items-center justify-center h-64"><Spinner /></div>;
  }

  return (
    <div>
      <PageHeader
        title="系统设置"
        subtitle="查看系统资源使用情况"
      />

      {!resources ? (
        <div className="text-center py-12 text-muted text-sm">无法加载系统资源信息</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {RESOURCE_CARDS.map((card) => {
            const Icon = card.icon;
            const value = resources[card.key as keyof typeof resources];
            return (
              <div
                key={card.key}
                className="bg-canvas rounded-lg border border-hairline shadow-sm p-6 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg ${card.bg} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${card.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted">{card.label}</p>
                    <p className="text-2xl font-semibold text-ink mt-0.5">
                      {typeof value === 'number'
                        ? value.toLocaleString('zh-CN')
                        : '-'}
                      <span className="text-sm font-normal text-muted ml-1">{card.unit}</span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
