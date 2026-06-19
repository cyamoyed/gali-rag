import { useState, useRef, useEffect } from 'react';
import { Send, Square, Trash2, Plus, MessageSquare } from 'lucide-react';
import { Button, Spinner } from '../../../shared/components/ui';
import { useAgentStore } from '../../../shared/stores';
import type { Message, Conversation } from '../../../shared/types';

interface ChatPanelProps {
  agentId: number;
}

export function ChatPanel({ agentId }: ChatPanelProps) {
  const {
    conversations,
    currentConversation,
    messages,
    streamingContent,
    isStreaming,
    loading,
    fetchConversations,
    deleteConversation,
    setCurrentConversation,
    fetchMessages,
    sendStreamMessage,
    clearChat,
  } = useAgentStore();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    clearChat();
    setCurrentConversation(null);
    useAgentStore.setState({ conversations: [] });
    fetchConversations(agentId);
  }, [agentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleSend = () => {
    const query = input.trim();
    if (!query || isStreaming) return;

    const userMsg: Message = {
      id: Date.now(),
      conversation_id: currentConversation?.id ?? 0,
      role: 'user',
      content: query,
      cited_sources: '',
      conflict_info: '',
      latency_ms: 0,
      created_at: new Date().toISOString(),
    };

    useAgentStore.setState((state) => ({
      messages: [...state.messages, userMsg],
    }));

    setInput('');

    const onMessage = (event: { type: string; content?: string; conversation_id?: number }) => {
      if (event.type === 'conversation_id' && event.conversation_id) {
        useAgentStore.setState((state) => ({
          currentConversation: {
            id: event.conversation_id!,
            agent_id: agentId,
            title: query.slice(0, 20),
            message_count: 2,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          conversations: [
            {
              id: event.conversation_id!,
              agent_id: agentId,
              title: query.slice(0, 20),
              message_count: 2,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            ...state.conversations.filter((c) => c.id !== event.conversation_id),
          ],
        }));
      }
    };

    abortRef.current = sendStreamMessage(
      agentId,
      {
        query,
        conversation_id: currentConversation?.id ?? null,
        stream: true,
      },
      onMessage,
    );
  };

  const handleStop = () => {
    abortRef.current?.();
    abortRef.current = null;
  };

  const handleNewChat = async () => {
    clearChat();
    setCurrentConversation(null);
  };

  const handleSelectConversation = async (conv: Conversation) => {
    setCurrentConversation(conv);
    await fetchMessages(conv.id);
  };

  const handleDeleteConversation = async (convId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteConversation(convId);
    if (currentConversation?.id === convId) {
      clearChat();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMessage = (msg: Message) => {
    const isUser = msg.role === 'user';
    return (
      <div
        key={msg.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
      >
        <div
          className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm ${
            isUser
              ? 'bg-accent text-white'
              : 'bg-canvas-soft text-ink border border-hairline'
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row h-[600px] max-h-[calc(100vh-16rem)] border border-hairline rounded-lg overflow-hidden">
      <div className="w-full lg:w-56 border-b lg:border-b-0 lg:border-r border-hairline bg-canvas-soft flex flex-col max-h-[200px] lg:max-h-none">
        <div className="p-3 border-b border-hairline">
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            className="w-full"
            onClick={handleNewChat}
          >
            新对话
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-canvas-soft-2 transition-colors group ${
                currentConversation?.id === conv.id
                  ? 'bg-canvas-soft-2 border-l-2 border-accent'
                  : 'border-l-2 border-transparent'
              }`}
              onClick={() => handleSelectConversation(conv)}
            >
              <MessageSquare className="w-4 h-4 text-muted flex-shrink-0" />
              <span className="flex-1 text-sm text-ink truncate">
                {conv.title}
              </span>
              <button
                className="opacity-0 group-hover:opacity-100 text-muted hover:text-error transition-opacity"
                onClick={(e) => handleDeleteConversation(conv.id, e)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {conversations.length === 0 && (
            <p className="text-xs text-muted text-center py-4">暂无对话</p>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map(renderMessage)}

          {isStreaming && streamingContent && (
            <div className="flex justify-start mb-3">
              <div className="max-w-[80%] rounded-lg px-4 py-2.5 text-sm bg-canvas-soft text-ink border border-hairline">
                <p className="whitespace-pre-wrap break-words">
                  {streamingContent}
                </p>
              </div>
            </div>
          )}

          {isStreaming && !streamingContent && (
            <div className="flex justify-start mb-3">
              <div className="rounded-lg px-4 py-2.5 bg-canvas-soft border border-hairline">
                <Spinner className="w-4 h-4" />
              </div>
            </div>
          )}

          {messages.length === 0 && !isStreaming && (
            <div className="flex items-center justify-center h-full text-muted text-sm">
              发送消息开始对话
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-hairline p-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              className="flex-1 bg-canvas border border-hairline rounded-sm px-3 py-2 text-sm text-ink placeholder:text-muted outline-none resize-none focus:border-accent focus:ring-1 focus:ring-accent/30 min-h-[40px] max-h-[120px]"
              placeholder="输入消息..."
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
            />
            {isStreaming ? (
              <Button
                variant="danger"
                size="sm"
                icon={<Square className="w-4 h-4" />}
                onClick={handleStop}
              >
                停止
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                icon={<Send className="w-4 h-4" />}
                onClick={handleSend}
                disabled={!input.trim() || loading}
              >
                发送
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
