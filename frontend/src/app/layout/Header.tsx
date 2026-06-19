import { useLocation } from 'react-router-dom';
import { Search, Bell, Menu } from 'lucide-react';
import { useUIStore } from '../../shared/stores';

const breadcrumbMap: Record<string, string> = {
  '/': '工作台',
  '/knowledge-bases': '知识库',
  '/agents': '智能体',
  '/conversations': '会话管理',
  '/prompts': 'Prompt 模板',
  '/models': '模型管理',
  '/settings': '系统设置',
};

export function Header() {
  const location = useLocation();
  const { toggleMobileMenu } = useUIStore();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  const getBreadcrumb = () => {
    if (pathSegments.length === 0) return '工作台';
    if (pathSegments[0] === 'knowledge-bases' && pathSegments.length > 1) return '知识库详情';
    if (pathSegments[0] === 'agents' && pathSegments.length > 1) return '智能体详情';
    return breadcrumbMap[`/${pathSegments[0]}`] || pathSegments[0];
  };

  return (
    <header className="flex items-center justify-between px-4 lg:px-8 h-16 bg-white border-b border-hairline sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden p-2 hover:bg-canvas-soft rounded-sm transition-colors"
        >
          <Menu className="w-5 h-5 text-muted" />
        </button>
        <nav className="flex items-center gap-2 text-sm text-muted">
          <span>Gali RAG</span>
          <span className="text-hairline">/</span>
          <span className="text-ink font-medium">{getBreadcrumb()}</span>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <button className="hidden sm:flex items-center gap-2 px-3 py-2 bg-canvas-soft border border-hairline rounded-sm text-sm text-muted hover:border-muted transition-colors" aria-label="搜索">
          <Search className="w-4 h-4" />
          <span>搜索知识库、文档…</span>
          <kbd className="ml-4 text-xs px-1.5 py-0.5 border border-hairline rounded text-muted">
            ⌘K
          </kbd>
        </button>

        <button className="sm:hidden p-2 hover:bg-canvas-soft rounded-sm transition-colors" aria-label="搜索">
          <Search className="w-5 h-5 text-muted" />
        </button>

        <button className="p-2 hover:bg-canvas-soft rounded-sm transition-colors relative" aria-label="通知">
          <Bell className="w-5 h-5 text-muted" />
        </button>

        <div className="w-8 h-8 rounded-full bg-accent-soft text-accent flex items-center justify-center text-sm font-semibold">
          张
        </div>
      </div>
    </header>
  );
}
