import { useEffect, useRef } from "react";

interface PDFViewerProps {
  url: string;
}

const PDFViewer = ({ url }: PDFViewerProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // 禁用右键菜单
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    iframe.addEventListener("contextmenu", handleContextMenu);

    return () => {
      iframe.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  // 使用 Google Docs Viewer 或 PDF.js 来防止下载
  // 这里使用禁用下载的 iframe 方式
  const viewerUrl = `${url}#toolbar=0&navpanes=0&scrollbar=0`;

  return (
    <div className="relative w-full bg-muted rounded-lg overflow-hidden">
      <iframe
        ref={iframeRef}
        src={viewerUrl}
        className="w-full h-[600px] border-0"
        title="PDF查看器"
        onContextMenu={(e) => e.preventDefault()}
        sandbox="allow-same-origin allow-scripts"
      />
      
      {/* 防止下载的提示 */}
      <div className="absolute top-0 left-0 right-0 bg-primary/90 text-primary-foreground text-sm py-2 px-4 text-center">
        文档仅供在线查看，不支持下载
      </div>
      
      {/* 防止下载的透明遮罩层 */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 1 }}
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
};

export default PDFViewer;
