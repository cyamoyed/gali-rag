import { useNavigate } from 'react-router-dom';
import { Database, Bot, Upload, MessageSquare } from 'lucide-react';

const actions = [
  {
    label: '创建知识库',
    description: '上传文档构建知识库',
    icon: Database,
    color: 'text-accent bg-accent-soft',
    path: '/knowledge-bases',
  },
  {
    label: '创建智能体',
    description: '配置AI助手',
    icon: Bot,
    color: 'text-violet-600 bg-violet-soft',
    path: '/agents',
  },
  {
    label: '上传文档',
    description: '添加新文档到知识库',
    icon: Upload,
    color: 'text-success bg-success-soft',
    path: '/knowledge-bases',
  },
  {
    label: '开始对话',
    description: '与智能体对话测试',
    icon: MessageSquare,
    color: 'text-warning bg-warning-soft',
    path: '/chat',
  },
];

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className="flex items-start gap-3 p-4 rounded-lg border border-hairline bg-white shadow-sm hover:border-accent hover:shadow-md transition-all duration-200 text-left"
          >
            <div className={`w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 ${action.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">{action.label}</p>
              <p className="text-xs text-muted mt-0.5">{action.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
