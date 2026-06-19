import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, FileText, Bot, Cpu } from 'lucide-react';
import { useKBStore, useAgentStore } from '../../shared/stores';
import { systemService } from '../../shared/services';
import { PageHeader } from '../../app/layout/PageHeader';
import { StatCard } from '../../shared/components/cards/StatCard';
import { KBCard } from '../../shared/components/cards/KBCard';
import { Card } from '../../shared/components/cards/Card';
import { Spinner } from '../../shared/components/ui/Spinner';
import { Button } from '../../shared/components/ui/Button';
import { ActivityList } from './components/ActivityList';
import { QuickActions } from './components/QuickActions';
import type { SystemResource } from '../../shared/types';

interface ActivityItem {
  id: string;
  type: 'document' | 'agent' | 'knowledge_base';
  title: string;
  description: string;
  time: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { knowledgeBases, fetchKnowledgeBases, loading: kbLoading } = useKBStore();
  const { agents, fetchAgents, loading: agentLoading } = useAgentStore();
  const [resources, setResources] = useState<SystemResource | null>(null);
  const [resourcesLoading, setResourcesLoading] = useState(true);

  useEffect(() => {
    fetchKnowledgeBases();
    fetchAgents();
    systemService.getResources().then(setResources).catch(() => {}).finally(() => setResourcesLoading(false));
  }, [fetchKnowledgeBases, fetchAgents]);

  const loading = kbLoading || agentLoading || resourcesLoading;

  const recentKBs = [...knowledgeBases]
    .sort((a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? ''))
    .slice(0, 4);

  const activities: ActivityItem[] = [
    ...knowledgeBases.slice(0, 3).map((kb) => ({
      id: `kb-${kb.id}`,
      type: 'knowledge_base' as const,
      title: kb.name,
      description: kb.description || '知识库',
      time: kb.updated_at ? new Date(kb.updated_at).toLocaleDateString('zh-CN') : '-',
    })),
    ...agents.slice(0, 3).map((agent) => ({
      id: `agent-${agent.id}`,
      type: 'agent' as const,
      title: agent.name,
      description: agent.description || '智能体',
      time: agent.updated_at ? new Date(agent.updated_at).toLocaleDateString('zh-CN') : '-',
    })),
  ].sort((a, b) => b.time.localeCompare(a.time)).slice(0, 5);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Spinner /></div>;
  }

  return (
    <div>
      <PageHeader
        title="工作台"
        subtitle="欢迎回来，这里是系统概览"
        actions={
          <Button variant="primary" onClick={() => navigate('/knowledge-bases')}>
            新建知识库
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          icon={<Database className="w-5 h-5" />}
          iconColor="blue"
          value={resources?.total_documents ?? knowledgeBases.reduce((sum, kb) => sum + kb.document_count, 0)}
          label="总文档数"
        />
        <StatCard
          icon={<FileText className="w-5 h-5" />}
          iconColor="green"
          value={resources?.total_chunks ?? 0}
          label="总切片数"
        />
        <StatCard
          icon={<Bot className="w-5 h-5" />}
          iconColor="amber"
          value={agents.length}
          label="智能体数量"
        />
        <StatCard
          icon={<Cpu className="w-5 h-5" />}
          iconColor="red"
          value={knowledgeBases.length}
          label="知识库数量"
        />
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-ink">知识库</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/knowledge-bases')}>
              查看全部
            </Button>
          </div>
          {recentKBs.length === 0 ? (
            <Card>
              <p className="text-sm text-muted text-center py-8">
                暂无知识库，点击右上角创建
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentKBs.map((kb) => (
                <KBCard
                  key={kb.id}
                  id={kb.id}
                  name={kb.name}
                  description={kb.description}
                  kb_type={kb.kb_type}
                  status="ready"
                  documentCount={kb.document_count}
                  chunkCount={kb.chunk_count}
                  createdAt={kb.updated_at ? new Date(kb.updated_at).toLocaleDateString('zh-CN') : undefined}
                  onClick={() => navigate(`/knowledge-bases/${kb.id}`)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-ink">最近活动</h2>
            </div>
            <Card>
              <ActivityList items={activities} />
            </Card>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-ink mb-4">快捷操作</h2>
            <QuickActions />
          </div>
        </div>
      </div>
    </div>
  );
}
