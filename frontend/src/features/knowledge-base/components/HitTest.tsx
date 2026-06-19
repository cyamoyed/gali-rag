import { useState } from 'react';
import { Search, Zap, FileText, Hash, Timer, Eye } from 'lucide-react';
import { Button, Input, Badge } from '../../../shared/components/ui';
import type { HitTestResult, HitItem } from '../../../shared/types';

interface HitTestProps {
  onTest: (params: { query: string; top_k?: number; similarity_threshold?: number }) => void;
  result: HitTestResult | null;
  loading: boolean;
  onViewChunks?: (docId: number, docName: string) => void;
}

export function HitTest({ onTest, result, loading, onViewChunks }: HitTestProps) {
  const [query, setQuery] = useState('');
  const [topK, setTopK] = useState(5);
  const [threshold, setThreshold] = useState(0.5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onTest({ query: query.trim(), top_k: topK, similarity_threshold: threshold });
  };

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              placeholder="输入查询内容测试检索效果..."
              prefix={<Search className="w-4 h-4" />}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            icon={<Zap className="w-4 h-4" />}
            loading={loading}
            disabled={!query.trim()}
          >
            测试
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted">返回数量</label>
            <input
              type="number"
              min={1}
              max={20}
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="w-16 bg-canvas border border-hairline rounded-sm px-2 py-1 text-sm text-ink outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted">相似度阈值</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-24 accent-accent"
            />
            <span className="text-xs text-ink font-mono w-8">{threshold.toFixed(2)}</span>
          </div>
        </div>
      </form>

      {result && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-xs text-muted">
            <span className="flex items-center gap-1">
              <Hash className="w-3 h-3" />
              命中 {result.total_hits} 条
            </span>
            <span className="flex items-center gap-1">
              <Timer className="w-3 h-3" />
              {result.latency_ms}ms
            </span>
            {result.rewritten_query && result.rewritten_query !== result.query && (
              <span className="text-accent">
                改写查询: {result.rewritten_query}
              </span>
            )}
          </div>

          <div className="space-y-3">
            {result.hits.map((hit, index) => (
              <HitItemCard key={hit.chunk_id} hit={hit} rank={index + 1} onViewChunks={onViewChunks} />
            ))}
          </div>

          {result.hits.length === 0 && (
            <div className="text-center py-8 text-muted text-sm">
              未找到匹配的文档片段
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HitItemCard({ hit, rank, onViewChunks }: { hit: HitItem; rank: number; onViewChunks?: (docId: number, docName: string) => void }) {
  const scoreColor =
    hit.score >= 0.8
      ? 'text-success'
      : hit.score >= 0.5
        ? 'text-warning'
        : 'text-error';

  return (
    <div className="border border-hairline rounded-sm p-4 hover:border-hairline-strong transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted bg-canvas-soft-2 px-1.5 py-0.5 rounded-sm">
            #{rank}
          </span>
          <button
            className="flex items-center gap-1.5 text-xs text-muted hover:text-accent transition-colors"
            onClick={() => onViewChunks?.(hit.doc_id, hit.doc_name)}
            title="查看文档切片"
          >
            <FileText className="w-3 h-3" />
            <span className="truncate max-w-[120px] sm:max-w-[200px] underline-offset-2 hover:underline">{hit.doc_name}</span>
            <Eye className="w-3 h-3" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          {hit.retrieval_source && (
            <Badge variant="info">{hit.retrieval_source}</Badge>
          )}
          <span className={`text-sm font-mono font-semibold ${scoreColor}`}>
            {hit.score.toFixed(4)}
          </span>
        </div>
      </div>
      <p className="text-sm text-body leading-relaxed whitespace-pre-wrap line-clamp-4">
        {hit.content}
      </p>
    </div>
  );
}
