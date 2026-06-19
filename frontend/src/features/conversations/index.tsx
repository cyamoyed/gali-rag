import { useEffect, useState, useRef } from 'react';
import { MessageSquare, Search, Eye, Trash2, Download } from 'lucide-react';
import { PageHeader } from '../../app/layout/PageHeader';
import { Button, Input, Modal, Spinner, EmptyState, Badge, ConfirmModal } from '../../shared/components/ui';
import { useUIStore } from '../../shared/stores';
import { conversationService } from '../../shared/services';
import type { Conversation, Message } from '../../shared/types';

export default function ConversationPage() {
  const addNotification = useUIStore((s) => s.addNotification);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingConv, setViewingConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingConv, setDeletingConv] = useState<Conversation | null>(null);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    setLoading(true);
    conversationService
      .listConversations()
      .then((data) => setConversations(data))
      .catch(() => addNotification({ type: 'error', message: '加载会话列表失败' }))
      .finally(() => setLoading(false));
  }, [addNotification]);

  const filteredConversations = conversations.filter(
    (c) => !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleDelete = async (conv: Conversation) => {
    setDeletingConv(conv);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDeleteConversation = async () => {
    if (!deletingConv) return;
    try {
      await conversationService.deleteConversation(deletingConv.id);
      addNotification({ type: 'success', message: '会话已删除' });
      setConversations((prev) => prev.filter((c) => c.id !== deletingConv.id));
      if (viewingConv?.id === deletingConv.id) setViewingConv(null);
    } catch {
      addNotification({ type: 'error', message: '删除会话失败' });
    }
  };

  const handleViewMessages = async (conv: Conversation) => {
    setViewingConv(conv);
    setMessagesLoading(true);
    try {
      const data = await conversationService.listMessages(conv.id);
      setMessages(data);
    } catch {
      addNotification({ type: 'error', message: '加载消息失败' });
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleExportConversation = async (convId: number) => {
    try {
      const result = await conversationService.exportConversation(convId);
      downloadJson(result.data, `conversation-${convId}.json`);
      addNotification({ type: 'success', message: '会话已导出' });
    } catch {
      addNotification({ type: 'error', message: '导出会话失败' });
    }
  };

  const handleExportAll = async () => {
    try {
      const result = await conversationService.exportAllMessages();
      downloadJson(result.data, 'all-messages.json');
      addNotification({ type: 'success', message: '所有问答日志已导出' });
    } catch {
      addNotification({ type: 'error', message: '导出问答日志失败' });
    }
  };

  if (loading && conversations.length === 0) {
    return <div className="flex items-center justify-center h-64"><Spinner /></div>;
  }

  return (
    <div>
      <PageHeader
        title="会话管理"
        subtitle="查看和管理所有对话记录"
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={<Download className="w-4 h-4" />}
            onClick={handleExportAll}
          >
            导出全部日志
          </Button>
        }
      />

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 max-w-xs">
          <Input
            placeholder="搜索会话..."
            prefix={<Search className="w-4 h-4" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredConversations.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="w-8 h-8" />}
          title="暂无会话"
          description="会话将在智能体对话中自动创建"
        />
      ) : (
        <div className="bg-canvas rounded-lg border border-hairline overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-hairline bg-canvas-soft">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase">标题</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase">消息数</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase">创建时间</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted uppercase">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredConversations.map((conv) => (
                <tr key={conv.id} className="border-b border-hairline last:border-0 hover:bg-canvas-soft/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-ink">{conv.title}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="default">{conv.message_count}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-body">
                    {conv.created_at ? new Date(conv.created_at).toLocaleString('zh-CN') : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className="p-1.5 text-muted hover:text-accent rounded transition-colors"
                        title="查看消息"
                        onClick={() => handleViewMessages(conv)}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1.5 text-muted hover:text-accent rounded transition-colors"
                        title="导出"
                        onClick={() => handleExportConversation(conv.id)}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1.5 text-muted hover:text-error rounded transition-colors"
                        title="删除"
                        onClick={() => handleDelete(conv)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <MessageDrawer
        conversation={viewingConv}
        messages={messages}
        loading={messagesLoading}
        onClose={() => {
          setViewingConv(null);
          setMessages([]);
        }}
      />

      <ConfirmModal
        open={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingConv(null);
        }}
        onConfirm={handleConfirmDeleteConversation}
        title="删除会话"
        description={`确定删除会话"${deletingConv?.title}"？`}
        confirmText="删除"
        variant="danger"
      />
    </div>
  );
}

function MessageDrawer({
  conversation,
  messages,
  loading,
  onClose,
}: {
  conversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  onClose: () => void;
}) {
  if (!conversation) return null;

  return (
    <Modal
      open={!!conversation}
      onClose={onClose}
      title={conversation.title}
      description={`${conversation.message_count} 条消息`}
      size="lg"
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-12 text-muted text-sm">暂无消息</div>
      ) : (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2.5 ${
                  msg.role === 'user'
                    ? 'bg-accent text-white'
                    : 'bg-canvas-soft border border-hairline'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                {msg.role === 'assistant' && msg.latency_ms > 0 && (
                  <p className="text-xs text-muted mt-1.5">
                    响应时间: {msg.latency_ms}ms
                  </p>
                )}
                <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-white/70' : 'text-muted'}`}>
                  {msg.created_at ? new Date(msg.created_at).toLocaleString('zh-CN') : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
