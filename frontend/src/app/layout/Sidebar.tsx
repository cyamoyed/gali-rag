import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Database,
  Bot,
  MessageSquare,
  Settings,
  Cpu,
  FileText,
  HelpCircle,
  ChevronLeft,
  X,
} from 'lucide-react';
import { useUIStore } from '../../shared/stores';

const navSections = [
  {
    label: '概览',
    items: [
      { path: '/', icon: LayoutDashboard, label: '工作台' },
    ],
  },
  {
    label: '对话问答',
    items: [
      { path: '/chat', icon: MessageSquare, label: '对话问答' },
    ],
  },
  {
    label: '知识管理',
    items: [
      { path: '/knowledge-bases', icon: Database, label: '知识库' },
      { path: '/agents', icon: Bot, label: '智能体' },
      { path: '/prompts', icon: FileText, label: 'Prompt 模板' },
    ],
  },
  {
    label: '系统',
    items: [
      { path: '/models', icon: Cpu, label: '模型管理' },
      { path: '/settings', icon: Settings, label: '系统设置' },
    ],
  },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, mobileMenuOpen, setMobileMenuOpen } = useUIStore();

  const handleNavClick = () => {
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`
          relative flex flex-col bg-white border-r border-hairline
          transition-all duration-300 overflow-hidden
          ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'}
          fixed inset-y-0 left-0 z-50 w-64
          lg:relative lg:z-20
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex items-center justify-between px-4 py-5 border-b border-hairline">
          <div
            className={`flex items-center gap-3 ${sidebarCollapsed ? 'cursor-pointer' : ''}`}
            onClick={sidebarCollapsed ? toggleSidebar : undefined}
            title={sidebarCollapsed ? '展开菜单' : undefined}
          >
            <div className="w-9 h-9 rounded-md bg-gradient-to-br from-accent to-violet-600 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
              G
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-ink truncate">Gali RAG</span>
                <span className="text-xs text-muted truncate">智能知识库平台</span>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <button
              onClick={toggleSidebar}
              className="p-1.5 hover:bg-canvas-soft rounded-sm transition-colors hidden lg:flex"
              title="收起菜单"
            >
              <ChevronLeft className="w-4 h-4 text-muted" />
            </button>
          )}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1 hover:bg-canvas-soft rounded-sm transition-colors"
          >
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.label} className="mb-6">
              {!sidebarCollapsed && (
                <div className="text-xs font-semibold text-muted uppercase tracking-wider px-3 mb-2">
                  {section.label}
                </div>
              )}
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.path === '/'}
                      onClick={handleNavClick}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-sm text-sm transition-colors
                        ${isActive
                          ? 'bg-accent-soft text-accent font-medium'
                          : 'text-body hover:bg-canvas-soft hover:text-ink'
                        }
                        ${sidebarCollapsed ? 'justify-center' : ''}
                        `
                      }
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-hairline p-3">
          <NavLink
            to="/help"
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-sm text-sm transition-colors
              ${isActive ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-canvas-soft hover:text-ink'}
              ${sidebarCollapsed ? 'justify-center' : ''}
              `
            }
          >
            <HelpCircle className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span>帮助文档</span>}
          </NavLink>
        </div>
      </aside>
    </>
  );
}
