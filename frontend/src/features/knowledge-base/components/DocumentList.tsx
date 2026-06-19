import { useRef, useState, useCallback } from 'react';
import {
  Upload,
  Trash2,
  RefreshCw,
  FileText,
  File,
  Loader,
  AlertCircle,
  CheckCircle,
  Clock,
  Sparkles,
  Eye,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSearch,
} from 'lucide-react';
import { Button, Badge, EmptyState, Spinner, Modal } from '../../../shared/components/ui';
import { formatFileSize, formatDate } from '../../../shared/utils/format';
import type { Document } from '../../../shared/types';

interface DocumentListProps {
  documents: Document[];
  loading: boolean;
  total?: number;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onUpload: (files: File[]) => void;
  onDelete: (docId: number) => void;
  onReprocess: (docId: number) => void;
  onGenerateSummary: (docId: number) => Promise<string>;
  onViewChunks?: (docId: number, docName: string) => void;
  onBatchDelete?: (docIds: number[]) => void;
  onBatchReprocess?: (docIds: number[]) => void;
  onBatchGenerateSummary?: (docIds: number[]) => void;
  onPreview?: (docId: number, filename: string, fileType: string) => void;
  onDownload?: (docId: number, filename: string) => void;
}

const statusConfig: Record<
  Document['status'],
  { label: string; variant: 'default' | 'info' | 'success' | 'error' | 'warning'; icon: typeof Clock }
> = {
  pending: { label: '等待中', variant: 'warning', icon: Clock },
  processing: { label: '处理中', variant: 'info', icon: Loader },
  completed: { label: '已完成', variant: 'success', icon: CheckCircle },
  failed: { label: '错误', variant: 'error', icon: AlertCircle },
};

function getFileIcon(fileType: string) {
  const type = fileType.toLowerCase();
  if (type.includes('pdf')) return <FileText className="w-4 h-4 text-error" />;
  if (type.includes('doc')) return <FileText className="w-4 h-4 text-accent" />;
  if (type.includes('txt') || type.includes('md')) return <File className="w-4 h-4 text-muted" />;
  return <File className="w-4 h-4 text-muted" />;
}

export function DocumentList({
  documents,
  loading,
  total,
  page,
  totalPages,
  onPageChange,
  onUpload,
  onDelete,
  onReprocess,
  onGenerateSummary,
  onViewChunks,
  onBatchDelete,
  onBatchReprocess,
  onBatchGenerateSummary,
  onPreview,
  onDownload,
}: DocumentListProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [dragOver, setDragOver] = useState(false);
  const [summaryLoadingIds, setSummaryLoadingIds] = useState<Set<number>>(new Set());
  const [summaryModal, setSummaryModal] = useState<{ open: boolean; docName: string; summary: string }>({
    open: false,
    docName: '',
    summary: '',
  });

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        onUpload(files);
      }
    },
    [onUpload],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const toggleSelect = (docId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) next.delete(docId);
      else next.add(docId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === documents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(documents.map((d) => d.id)));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onUpload(Array.from(files));
      e.target.value = '';
    }
  };

  const handleGenerateSummary = async (docId: number, docName: string) => {
    setSummaryLoadingIds((prev) => new Set(prev).add(docId));
    try {
      const summary = await onGenerateSummary(docId);
      setSummaryModal({ open: true, docName, summary });
    } finally {
      setSummaryLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(docId);
        return next;
      });
    }
  };

  if (loading && documents.length === 0) {
    return <div className="flex items-center justify-center h-64"><Spinner /></div>;
  }

  if (documents.length === 0) {
    return (
      <>
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            dragOver ? 'border-accent bg-accent/5' : 'border-hairline hover:border-accent/50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <EmptyState
            icon={<Upload className="w-8 h-8" />}
            title="暂无文档"
            description="拖拽文件到此处，或点击下方按钮上传"
            action={
              <Button
                variant="primary"
                size="sm"
                icon={<Upload className="w-4 h-4" />}
                onClick={() => fileInputRef.current?.click()}
              >
                上传文档
              </Button>
            }
          />
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </>
    );
  }

  return (
    <div
      className={dragOver ? 'relative' : ''}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {dragOver && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-accent/5 border-2 border-dashed border-accent rounded-lg pointer-events-none">
          <div className="flex items-center gap-2 text-accent font-medium">
            <Upload className="w-5 h-5" />
            释放文件以上传
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted">{total ?? documents.length} 个文档</p>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              {onBatchReprocess && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<RefreshCw className="w-3.5 h-3.5" />}
                  onClick={() => { onBatchReprocess(Array.from(selectedIds)); setSelectedIds(new Set()); }}
                >
                  批量重处理 ({selectedIds.size})
                </Button>
              )}
              {onBatchGenerateSummary && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Sparkles className="w-3.5 h-3.5" />}
                  onClick={() => { onBatchGenerateSummary(Array.from(selectedIds)); setSelectedIds(new Set()); }}
                >
                  批量摘要 ({selectedIds.size})
                </Button>
              )}
              {onBatchDelete && (
                <Button
                  variant="danger"
                  size="sm"
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                  onClick={() => { onBatchDelete(Array.from(selectedIds)); setSelectedIds(new Set()); }}
                >
                  删除选中 ({selectedIds.size})
                </Button>
              )}
            </div>
          )}
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<Upload className="w-4 h-4" />}
          onClick={() => fileInputRef.current?.click()}
        >
          上传文档
        </Button>
      </div>

      <div className="border border-hairline rounded-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="bg-canvas-soft border-b border-hairline">
              <th className="text-left px-4 py-3 font-medium text-muted w-10">
                <input
                  type="checkbox"
                  checked={documents.length > 0 && selectedIds.size === documents.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-hairline text-accent focus:ring-accent"
                />
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted">文件名</th>
              <th className="text-left px-4 py-3 font-medium text-muted w-20">类型</th>
              <th className="text-right px-4 py-3 font-medium text-muted w-24">大小</th>
              <th className="text-right px-4 py-3 font-medium text-muted w-20">分块</th>
              <th className="text-center px-4 py-3 font-medium text-muted w-24">状态</th>
              <th className="text-left px-4 py-3 font-medium text-muted w-40">上传时间</th>
              <th className="text-right px-4 py-3 font-medium text-muted w-48">操作</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => {
              const statusInfo = statusConfig[doc.status] ?? { label: doc.status, variant: 'default' as const, icon: Clock };
              const StatusIcon = statusInfo.icon;

              return (
                <tr
                  key={doc.id}
                  className="border-b border-hairline last:border-b-0 hover:bg-canvas-soft transition-colors"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(doc.id)}
                      onChange={() => toggleSelect(doc.id)}
                      className="w-4 h-4 rounded border-hairline text-accent focus:ring-accent"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {getFileIcon(doc.file_type)}
                      <div className="min-w-0">
                        <p className="text-ink font-medium truncate">{doc.filename}</p>
                        {doc.status === 'failed' && doc.error_message && (
                          <p className="text-[11px] text-error/80 mt-0.5 max-w-[320px] line-clamp-2 break-all" title={doc.error_message}>
                            {doc.error_message}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted uppercase text-xs">
                    {doc.file_type}
                  </td>
                  <td className="px-4 py-3 text-right text-muted">
                    {formatFileSize(doc.file_size)}
                  </td>
                  <td className="px-4 py-3 text-right text-ink">
                    {doc.chunk_count}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <span title={doc.status === 'failed' ? doc.error_message : undefined}>
                        <Badge variant={statusInfo.variant}>
                          <StatusIcon
                            className={`w-3 h-3 mr-1 ${doc.status === 'processing' ? 'animate-spin' : ''}`}
                          />
                          {statusInfo.label}
                        </Badge>
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {formatDate(doc.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {onPreview && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<FileSearch className="w-3.5 h-3.5" />}
                          onClick={() => onPreview(doc.id, doc.filename, doc.file_type)}
                          title="预览文件"
                        >
                          预览
                        </Button>
                      )}
                      {onDownload && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Download className="w-3.5 h-3.5" />}
                          onClick={() => onDownload(doc.id, doc.filename)}
                          title="下载文件"
                        >
                          下载
                        </Button>
                      )}
                      {onViewChunks && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Eye className="w-3.5 h-3.5" />}
                          onClick={() => onViewChunks(doc.id, doc.filename)}
                          disabled={doc.status !== 'completed'}
                          title="查看切片"
                        >
                          切片
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={summaryLoadingIds.has(doc.id) ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        onClick={() => handleGenerateSummary(doc.id, doc.filename)}
                        disabled={doc.status !== 'completed' || summaryLoadingIds.has(doc.id)}
                        title="生成摘要"
                      >
                        摘要
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<RefreshCw className="w-3.5 h-3.5" />}
                        onClick={() => onReprocess(doc.id)}
                        disabled={doc.status === 'processing'}
                        title="重新处理"
                      >
                        重处理
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 className="w-3.5 h-3.5 text-error" />}
                        onClick={() => onDelete(doc.id)}
                        title="删除文档"
                        className="hover:text-error"
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages && totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-hairline">
          <span className="text-sm text-muted">第 {page} / {totalPages} 页</span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<ChevronLeft className="w-4 h-4" />}
              onClick={() => onPageChange(page! - 1)}
              disabled={page! <= 1}
            >
              上一页
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(page! + 1)}
              disabled={page! >= totalPages}
            >
              下一页
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <Modal
        open={summaryModal.open}
        onClose={() => setSummaryModal({ open: false, docName: '', summary: '' })}
        title="文档摘要"
        description={summaryModal.docName}
      >
        <p className="text-sm text-ink whitespace-pre-wrap">{summaryModal.summary}</p>
      </Modal>
    </div>
  );
}
