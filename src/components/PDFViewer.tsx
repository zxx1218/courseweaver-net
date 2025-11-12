import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2 } from "lucide-react";

interface PDFViewerProps {
  url: string;
}

const PDFViewer = ({ url }: PDFViewerProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // 禁用右键菜单
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // 禁用键盘快捷键
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) && 
        (e.key === 's' || e.key === 'S' || e.key === 'p' || e.key === 'P')
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    iframe.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      iframe.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("全屏切换失败:", error);
    }
  };

  // 使用 Google Docs Viewer 或 PDF.js 来防止下载
  // 这里使用禁用下载的 iframe 方式
  const viewerUrl = `${url}#toolbar=0&navpanes=0&scrollbar=0`;

  return (
    <div 
      ref={containerRef} 
      className="relative w-full bg-muted rounded-lg overflow-hidden select-none"
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
    >
      <iframe
        ref={iframeRef}
        src={viewerUrl}
        className={isFullscreen ? "w-full h-screen border-0" : "w-full h-[600px] border-0"}
        title="PDF查看器"
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }}
      />
      
      {/* 防止下载的提示 */}
      <div className="absolute top-0 left-0 right-0 bg-primary/90 text-primary-foreground text-sm py-2 px-4 text-center flex items-center justify-between z-10">
        <span>文档仅供在线查看，不支持下载</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleFullscreen}
          className="text-primary-foreground hover:bg-primary/80"
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="w-4 h-4 mr-2" />
              退出全屏
            </>
          ) : (
            <>
              <Maximize2 className="w-4 h-4 mr-2" />
              全屏查看
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default PDFViewer;
