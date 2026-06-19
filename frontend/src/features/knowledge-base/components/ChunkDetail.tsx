import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Spinner, Button } from '../../../shared/components/ui';
import { kbService } from '../../../shared/services';

interface Chunk {
  id: number;
  doc_id: number;
  chunk_index: number;
  content: string;
  token_count: number;
  created_at: string | null;
}

interface ChunkDetailProps {
  docId: number;
  docName: string;
  onClose: () => void;
}

export function ChunkDetail({ docId, docName, onClose }: ChunkDetailProps) {
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchChunks = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const result = await kbService.getDocumentChunks(docId, { page: p, page_size: 10 });
      setChunks(result.items);
      setTotal(result.total);
      setTotalPages(result.total_pages);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [docId]);

  useEffect(() => {
    fetchChunks(page);
  }, [page, fetchChunks]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline">
          <div>
            <h2 className="text-lg font-semibold text-ink">文档切片详情</h2>
            <p className="text-sm text-muted">{docName} - 共 {total} 个切片</p>
          </div>
          <button className="p-1 text-muted hover:text-ink rounded transition-colors" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-32"><Spinner /></div>
          ) : chunks.length === 0 ? (
            <p className="text-center text-muted py-8">暂无切片</p>
          ) : (
            <div className="space-y-4">
              {chunks.map((chunk) => (
                <div key={chunk.id} className="border border-hairline rounded-sm p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-accent bg-accent-soft px-2 py-0.5 rounded">
                      #{chunk.chunk_index + 1}
                    </span>
                    <span className="text-xs text-muted">{chunk.token_count} tokens</span>
                  </div>
                  <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">
                    {chunk.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-hairline">
            <span className="text-sm text-muted">第 {page} / {totalPages} 页</span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<ChevronLeft className="w-4 h-4" />}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                上一页
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                下一页
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
