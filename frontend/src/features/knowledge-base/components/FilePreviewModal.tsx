import { useState, useEffect, useRef } from 'react';
import { Download, Loader, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Modal, Button } from '../../../shared/components/ui';
import { previewDocument, previewDocumentAsBlob, downloadDocument } from '../../../shared/services/kbService';

interface FilePreviewModalProps {
  open: boolean;
  onClose: () => void;
  docId: number | null;
  filename: string;
  fileType: string;
}

export function FilePreviewModal({ open, onClose, docId, filename, fileType }: FilePreviewModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open || !docId) {
      setContent(null);
      setPdfUrl(null);
      setError(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (fileType === 'pdf') {
          const blob = await previewDocumentAsBlob(docId);
          if (cancelled) return;
          const url = URL.createObjectURL(blob);
          blobUrlRef.current = url;
          setPdfUrl(url);
        } else {
          const data = await previewDocument(docId);
          if (cancelled) return;
          setContent(data.content);
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : '加载失败';
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [open, docId, fileType]);

  const handleDownload = async () => {
    if (!docId) return;
    try {
      await downloadDocument(docId, filename);
    } catch {
      // downloadDocument handles its own errors
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-[60vh]">
          <Loader className="w-8 h-8 animate-spin text-muted" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-muted">
          <FileText className="w-12 h-12 mb-3 opacity-40" />
          <p>{error}</p>
        </div>
      );
    }

    if (fileType === 'pdf' && pdfUrl) {
      return (
        <iframe
          src={pdfUrl}
          className="w-full h-[70vh] border-0 rounded"
          title={filename}
        />
      );
    }

    if (fileType === 'markdown' && content !== null) {
      return (
        <div className="bg-white border border-hairline rounded-lg p-6 h-[70vh] overflow-y-auto">
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const codeString = String(children).replace(/\n$/, '');
                  if (match) {
                    return (
                      <SyntaxHighlighter
                        style={oneLight}
                        language={match[1]}
                        PreTag="div"
                        customStyle={{ margin: '0.5em 0', borderRadius: '6px', fontSize: '0.85em' }}
                      >
                        {codeString}
                      </SyntaxHighlighter>
                    );
                  }
                  return (
                    <code className="bg-canvas-soft-2 px-1.5 py-0.5 rounded text-sm font-mono text-error" {...props}>
                      {children}
                    </code>
                  );
                },
                table({ children }) {
                  return (
                    <div className="overflow-x-auto my-3">
                      <table className="border-collapse text-sm">{children}</table>
                    </div>
                  );
                },
                th({ children }) {
                  return <th className="border border-hairline px-3 py-2 bg-canvas-soft text-left font-semibold">{children}</th>;
                },
                td({ children }) {
                  return <td className="border border-hairline px-3 py-2">{children}</td>;
                },
                blockquote({ children }) {
                  return <blockquote className="border-l-4 border-accent pl-4 py-1 text-body italic bg-accent-soft/30 rounded-r">{children}</blockquote>;
                },
                a({ href, children }) {
                  return <a href={href} className="text-link hover:text-link-deep underline" target="_blank" rel="noreferrer">{children}</a>;
                },
                img({ src, alt }) {
                  return <img src={src} alt={alt} className="max-w-full rounded" />;
                },
                hr() {
                  return <hr className="border-hairline my-4" />;
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>
      );
    }

    if (content !== null) {
      return (
        <div className="bg-white border border-hairline rounded-lg p-6 h-[70vh] overflow-y-auto">
          <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-ink">
            {content}
          </pre>
        </div>
      );
    }

    return null;
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={filename}
      size="xl"
      footer={
        <Button
          variant="primary"
          icon={<Download className="w-4 h-4" />}
          onClick={handleDownload}
        >
          下载
        </Button>
      }
    >
      {renderContent()}
    </Modal>
  );
}
