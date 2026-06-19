import { useEffect, useState, useRef, useCallback } from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  Search,
  Send,
  Square,
  Copy,
  Check,
  Clock,
  FileText,
  Bot,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { Button, Spinner, EmptyState, ConfirmModal } from '../../shared/components/ui';
import { useAgentStore, useUIStore } from '../../shared/stores';
import { conversationService, apiClient } from '../../shared/services';
import type { Agent, Conversation, Message } from '../../shared/types';

interface CitedSource {
  chunk_id: number;
  doc_id: number;
  doc_name: string;
  content: string;
  score: number;
}

interface StreamEvent {
  type: string;
  content?: string;
  conversation_id?: number;
  cited_sources?: CitedSource[];
  conflict_info?: { has_conflict: boolean; description: string } | null;
  latency_ms?: number;
}

export default function ChatPage() {
  const { agents, fetchAgents } = useAgentStore();
  const addNotification = useUIStore((s) => s.addNotification);

  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(() => {
    try {
      const cached = localStorage.getItem('chat_selected_agent');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingSources, setStreamingSources] = useState<CitedSource[]>([]);
  const [streamingLatency, setStreamingLatency] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAgentSelect, setShowAgentSelect] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingConv, setDeletingConv] = useState<Conversation | null>(null);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<(() => void) | null>(null);
  const agentSelectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAgents({ status: 'published' });
  }, [fetchAgents]);

  useEffect(() => {
    if (agents.length > 0 && !selectedAgent) {
      try {
        const cached = JSON.parse(localStorage.getItem('chat_selected_agent') || 'null');
        const match = cached ? agents.find((a) => a.id === cached.id) : null;
        setSelectedAgent(match || agents[0]);
      } catch {
        setSelectedAgent(agents[0]);
      }
    }
  }, [agents, selectedAgent]);

  useEffect(() => {
    if (selectedAgent) {
      loadConversations(selectedAgent.id);
    }
  }, [selectedAgent]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  useEffect(() => {
    if (!showAgentSelect) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (agentSelectRef.current && !agentSelectRef.current.contains(e.target as Node)) {
        setShowAgentSelect(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAgentSelect]);

  const loadConversations = async (agentId: number) => {
    try {
      const data = await conversationService.listConversations({ agent_id: agentId, source: 'qa' });
      setConversations(data);
    } catch {
      addNotification({ type: 'error', message: '加载会话列表失败' });
    }
  };

  const loadMessages = async (convId: number) => {
    setLoading(true);
    try {
      const data = await conversationService.listMessages(convId);
      setMessages(data);
    } catch {
      addNotification({ type: 'error', message: '加载消息失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    localStorage.setItem('chat_selected_agent', JSON.stringify(agent));
    setCurrentConversation(null);
    setMessages([]);
    setShowAgentSelect(false);
  };

  const handleSelectConversation = (conv: Conversation) => {
    setCurrentConversation(conv);
    loadMessages(conv.id);
  };

  const handleNewChat = () => {
    setCurrentConversation(null);
    setMessages([]);
    inputRef.current?.focus();
  };

  const handleDeleteConversation = async () => {
    if (!deletingConv) return;
    try {
      await conversationService.deleteConversation(deletingConv.id);
      addNotification({ type: 'success', message: '会话已删除' });
      setConversations((prev) => prev.filter((c) => c.id !== deletingConv.id));
      if (currentConversation?.id === deletingConv.id) {
        setCurrentConversation(null);
        setMessages([]);
      }
    } catch {
      addNotification({ type: 'error', message: '删除会话失败' });
    }
    setShowDeleteConfirm(false);
    setDeletingConv(null);
  };

  const handleSend = useCallback(() => {
    const query = input.trim();
    if (!query || isStreaming || !selectedAgent) return;

    const controller = new AbortController();
    abortRef.current = () => controller.abort();

    let streamConversationId: number | null = currentConversation?.id ?? null;
    const msgIdBase = Date.now();

    const userMsg: Message = {
      id: msgIdBase,
      conversation_id: currentConversation?.id ?? 0,
      role: 'user',
      content: query,
      cited_sources: '',
      conflict_info: '',
      latency_ms: 0,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);
    setStreamingContent('');
    setStreamingSources([]);
    setStreamingLatency(null);

    let msgIdCounter = msgIdBase;

    fetch(`${apiClient.defaults.baseURL}/agents/${selectedAgent.id}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiClient.defaults.headers.common['X-API-Key'] ? { 'X-API-Key': apiClient.defaults.headers.common['X-API-Key'] as string } : {}),
      },
      body: JSON.stringify({
        query,
        conversation_id: streamConversationId,
        stream: true,
        source: 'qa',
      }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const reader = response.body?.getReader();
        if (!reader) return;
        const decoder = new TextDecoder();
        let buffer = '';
        let fullContent = '';
        let sources: CitedSource[] = [];
        let latency: number | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const event: StreamEvent = JSON.parse(line.slice(6));

              if (event.type === 'conversation_id' && event.conversation_id) {
                streamConversationId = event.conversation_id;
                const newConv: Conversation = {
                  id: event.conversation_id,
                  agent_id: selectedAgent.id,
                  title: query.slice(0, 30),
                  message_count: 2,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                };
                setCurrentConversation(newConv);
                setConversations((prev) => [newConv, ...prev.filter((c) => c.id !== event.conversation_id)]);
              }

              if (event.type === 'token' && event.content) {
                fullContent += event.content;
                setStreamingContent(fullContent);
              }

              if (event.type === 'sources' && event.cited_sources) {
                sources = event.cited_sources;
                setStreamingSources(sources);
              }

              if (event.type === 'latency' && event.latency_ms !== undefined) {
                latency = event.latency_ms;
                setStreamingLatency(latency);
              }

              if (event.type === 'end') {
                const assistantMsg: Message = {
                  id: ++msgIdCounter,
                  conversation_id: streamConversationId ?? 0,
                  role: 'assistant',
                  content: fullContent,
                  cited_sources: JSON.stringify(sources),
                  conflict_info: '',
                  latency_ms: latency ?? 0,
                  created_at: new Date().toISOString(),
                };
                setMessages((prev) => [...prev, assistantMsg]);
                setIsStreaming(false);
                setStreamingContent('');
                setStreamingSources([]);
                setStreamingLatency(null);
              }

              if (event.type === 'error' && event.content) {
                addNotification({ type: 'error', message: event.content });
                setIsStreaming(false);
                setStreamingContent('');
              }
            } catch {
              // skip malformed events
            }
          }
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          addNotification({ type: 'error', message: '发送消息失败' });
          setIsStreaming(false);
          setStreamingContent('');
        }
      });
  }, [input, isStreaming, selectedAgent, currentConversation, addNotification]);

  const handleStop = () => {
    abortRef.current?.();
    abortRef.current = null;
    setIsStreaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content);
    addNotification({ type: 'success', message: '已复制到剪贴板' });
  };

  const filteredConversations = conversations
    .filter((c) => !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

  const parseCitedSources = (sourcesStr: string): CitedSource[] => {
    try {
      return JSON.parse(sourcesStr || '[]');
    } catch {
      return [];
    }
  };

  return (
    <div className="flex h-full">
      {/* Left Panel: Agent + Conversation List */}
      <div
        className={`flex flex-col bg-white border-r border-hairline flex-shrink-0 transition-all duration-300 ${
          leftPanelCollapsed ? 'w-12' : 'w-72'
        }`}
      >
        {/* Panel Header with Collapse Toggle */}
        <div className="flex items-center justify-between h-12 px-3 border-b border-hairline flex-shrink-0">
          {!leftPanelCollapsed && (
            <span className="text-sm font-semibold text-ink truncate">对话问答</span>
          )}
          <button
            onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
            className="p-1 hover:bg-canvas-soft rounded-sm transition-colors text-muted hover:text-ink ml-auto"
            title={leftPanelCollapsed ? '展开面板' : '收起面板'}
          >
            {leftPanelCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {!leftPanelCollapsed && (
          <>
            {/* Agent Selector Dropdown */}
            <div className="border-b border-hairline flex-shrink-0 p-3 relative" ref={agentSelectRef}>
              <button
                className="w-full flex items-center justify-between px-3 py-2 bg-canvas-soft border border-hairline rounded-sm text-sm hover:border-hairline-strong transition-colors"
                onClick={() => setShowAgentSelect(!showAgentSelect)}
              >
                <span className="flex items-center gap-2 truncate">
                  <Bot className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{selectedAgent?.name || '选择智能体'}</span>
                </span>
                <ChevronDown className="w-4 h-4 flex-shrink-0 text-muted" />
              </button>
              {showAgentSelect && (
                <div className="absolute left-3 right-3 top-full mt-1 bg-white border border-hairline rounded-lg shadow-lg z-50 max-h-[240px] overflow-y-auto">
                  {agents.map((agent) => (
                    <button
                      key={agent.id}
                      className={`w-full text-left px-3 py-2.5 hover:bg-canvas-soft transition-colors flex items-center gap-2 first:rounded-t-lg last:rounded-b-lg ${
                        selectedAgent?.id === agent.id ? 'bg-accent-soft text-accent' : ''
                      }`}
                      onClick={() => handleSelectAgent(agent)}
                    >
                      <Bot className="w-4 h-4 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{agent.name}</div>
                        <div className="text-xs text-muted truncate">{agent.description || '暂无描述'}</div>
                      </div>
                    </button>
                  ))}
                  {agents.length === 0 && (
                    <div className="px-3 py-3 text-sm text-muted text-center">暂无可用智能体</div>
                  )}
                </div>
              )}
            </div>

            {/* Conversation List */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between px-3 py-2 flex-shrink-0">
                <span className="text-xs font-medium text-muted uppercase tracking-wider">会话</span>
                <button
                  onClick={handleNewChat}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-accent bg-accent-soft hover:bg-accent/15 rounded-sm transition-colors"
                  title="新对话"
                >
                  <Plus className="w-3.5 h-3.5" />
                  新对话
                </button>
              </div>
              <div className="px-2 pb-2 flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
                  <input
                    type="text"
                    className="w-full bg-canvas-soft border border-hairline rounded-sm pl-8 pr-3 py-1.5 text-xs text-ink placeholder:text-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
                    placeholder="搜索会话..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-1.5 pb-2">
                {filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`flex items-center gap-2 px-2.5 py-2 cursor-pointer rounded-sm transition-colors group ${
                      currentConversation?.id === conv.id
                        ? 'bg-canvas-soft-2'
                        : 'hover:bg-canvas-soft'
                    }`}
                    onClick={() => handleSelectConversation(conv)}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-muted flex-shrink-0" />
                    <span className="flex-1 text-xs text-ink truncate">{conv.title}</span>
                    <button
                      className="opacity-0 group-hover:opacity-100 text-muted hover:text-error transition-opacity flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingConv(conv);
                        setShowDeleteConfirm(true);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {filteredConversations.length === 0 && (
                  <p className="text-xs text-muted text-center py-4">暂无会话</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Right Panel: Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Chat Header */}
        <div className="flex items-center gap-3 h-12 px-4 border-b border-hairline flex-shrink-0">
          <Bot className="w-4 h-4 text-muted flex-shrink-0" />
          <span className="text-sm font-medium text-ink truncate">
            {selectedAgent?.name || '请选择智能体'}
          </span>
          {currentConversation && (
            <>
              <span className="text-hairline">/</span>
              <span className="text-sm text-muted truncate">{currentConversation.title}</span>
            </>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          {!selectedAgent ? (
            <div className="flex items-center justify-center h-full">
              <EmptyState
                icon={<Bot className="w-8 h-8" />}
                title="请选择智能体"
                description="从左侧面板下拉选择一个智能体开始对话"
              />
            </div>
          ) : messages.length === 0 && !isStreaming ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-full bg-accent-soft flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-lg font-medium text-ink mb-2">开始对话</h3>
              <p className="text-sm text-muted max-w-md">
                当前智能体：{selectedAgent.name}
                {selectedAgent.description && ` - ${selectedAgent.description}`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  onCopy={handleCopyContent}
                  parseCitedSources={parseCitedSources}
                />
              ))}

              {/* Streaming Message */}
              {isStreaming && (
                <div className="flex justify-start">
                  <div className="max-w-[80%]">
                    <div className="rounded-lg px-4 py-3 bg-canvas-soft border border-hairline">
                      {streamingContent ? (
                        <p className="text-sm whitespace-pre-wrap break-words text-ink">
                          {streamingContent}
                        </p>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Spinner className="w-4 h-4" />
                          <span className="text-sm text-muted">思考中...</span>
                        </div>
                      )}
                    </div>
                    {streamingSources.length > 0 && (
                      <CitedSourcesPanel sources={streamingSources} />
                    )}
                    {streamingLatency !== null && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted">
                        <Clock className="w-3 h-3" />
                        {streamingLatency}ms
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {selectedAgent && (
          <div className="border-t border-hairline p-4 flex-shrink-0">
            <div className="flex items-center gap-2">
              <textarea
                ref={inputRef}
                className="flex-1 bg-canvas border border-hairline rounded-lg px-4 py-2.5 text-sm text-ink placeholder:text-muted outline-none resize-none focus:border-accent focus:ring-1 focus:ring-accent/30 min-h-[44px] max-h-[120px]"
                placeholder="输入你的问题..."
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isStreaming}
              />
              {isStreaming ? (
                <Button
                  variant="danger"
                  size="md"
                  icon={<Square className="w-4 h-4" />}
                  onClick={handleStop}
                >
                  停止
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  icon={<Send className="w-4 h-4" />}
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                >
                  发送
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingConv(null);
        }}
        onConfirm={handleDeleteConversation}
        title="删除会话"
        description={`确定删除会话"${deletingConv?.title}"？此操作不可恢复。`}
        confirmText="删除"
        variant="danger"
      />
    </div>
  );
}

function MessageBubble({ message, onCopy, parseCitedSources }: {
  message: Message;
  onCopy: (content: string) => void;
  parseCitedSources: (str: string) => CitedSource[];
}) {
  const isUser = message.role === 'user';
  const sources = !isUser ? parseCitedSources(message.cited_sources) : [];
  const [copied, setCopied] = useState(false);
  const [showSources, setShowSources] = useState(false);

  const handleCopy = () => {
    onCopy(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatContent = (text: string) =>
    text.replace(/(?<!\n)\[来源:/g, '\n\n[来源:');

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${isUser ? '' : 'w-full max-w-3xl'}`}>
        <div
          className={`rounded-lg px-4 py-3 ${
            isUser
              ? 'bg-accent text-white'
              : 'bg-canvas-soft border border-hairline'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{formatContent(message.content)}</p>
          {!isUser && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-hairline">
              <button
                className="flex items-center gap-1 text-xs text-muted hover:text-ink transition-colors"
                onClick={handleCopy}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? '已复制' : '复制'}
              </button>
              {message.latency_ms > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted">
                  <Clock className="w-3 h-3" />
                  {message.latency_ms}ms
                </span>
              )}
              {sources.length > 0 && (
                <button
                  className="flex items-center gap-1 text-xs text-muted hover:text-ink transition-colors"
                  onClick={() => setShowSources(!showSources)}
                >
                  <FileText className="w-3 h-3" />
                  {sources.length} 个引用
                </button>
              )}
            </div>
          )}
        </div>
        {!isUser && showSources && sources.length > 0 && (
          <CitedSourcesPanel sources={sources} />
        )}
      </div>
    </div>
  );
}

function CitedSourcesPanel({ sources }: { sources: CitedSource[] }) {
  const grouped = sources.reduce<Record<string, CitedSource[]>>((acc, src) => {
    const key = src.doc_name || `文档 ${src.doc_id}`;
    (acc[key] ??= []).push(src);
    return acc;
  }, {});

  return (
    <div className="mt-2 bg-white border border-hairline rounded-lg overflow-hidden">
      <div className="px-3 py-2 bg-canvas-soft border-b border-hairline">
        <span className="text-xs font-medium text-ink flex items-center gap-1">
          <FileText className="w-3.5 h-3.5" />
          引用文档
        </span>
      </div>
      <div className="divide-y divide-hairline max-h-[200px] overflow-y-auto">
        {Object.entries(grouped).map(([docName, items]) => (
          <div key={docName} className="px-3 py-2 hover:bg-canvas-soft/50 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-ink truncate flex-1">{docName}</span>
              <span className="text-xs text-accent ml-2 flex-shrink-0">
                {items.length > 1 ? `${items.length} 条引用` : `${(items[0].score * 100).toFixed(1)}%`}
              </span>
            </div>
            <div className="space-y-1">
              {items.map((src, idx) => (
                <p key={idx} className="text-xs text-muted line-clamp-2">{src.content}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
