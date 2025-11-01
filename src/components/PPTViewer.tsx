import { useEffect, useRef, useState } from "react";
import { FileText, AlertCircle } from "lucide-react";

interface PPTViewerProps {
  url: string;
}

const PPTViewer = ({ url }: PPTViewerProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [viewerStatus, setViewerStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [processedUrl, setProcessedUrl] = useState<string>('');
  const [useDomesticService, setUseDomesticService] = useState(true);

  // 处理URL，将相对路径转换为绝对路径
  useEffect(() => {
    if (!url) return;

    try {
      // 如果是完整URL，直接使用
      new URL(url);
      setProcessedUrl(url);
    } catch (e) {
      // 如果是相对路径，转换为绝对路径
      if (url.startsWith('/')) {
        // 在浏览器环境中构造完整URL
        if (typeof window !== 'undefined') {
          const fullUrl = new URL(url, window.location.origin);
          setProcessedUrl(fullUrl.toString());
        } else {
          setProcessedUrl(url);
        }
      } else {
        // 其他情况，尝试添加到当前路径
        if (typeof window !== 'undefined') {
          const fullUrl = new URL(url, window.location.href);
          setProcessedUrl(fullUrl.toString());
        } else {
          setProcessedUrl(url);
        }
      }
    }
  }, [url]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !processedUrl) return;

    // 禁用右键菜单
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    iframe.addEventListener("contextmenu", handleContextMenu);

    // 设置超时检测
    const timeoutId = setTimeout(() => {
      if (viewerStatus === 'loading') {
        setViewerStatus('error');
        setErrorMessage('加载超时，请确保文件路径正确且可访问');
      }
    }, 20000); // 20秒超时

    // 监听加载完成
    const handleLoad = () => {
      clearTimeout(timeoutId);
      if (viewerStatus === 'loading') {
        setViewerStatus('success');
      }
    };

    // 监听加载错误
    const handleError = () => {
      clearTimeout(timeoutId);
      if (viewerStatus === 'loading') {
        setViewerStatus('error');
        setErrorMessage('加载失败，请检查文件路径或网络连接');
      }
    };

    iframe.addEventListener("load", handleLoad);
    iframe.addEventListener("error", handleError);

    return () => {
      clearTimeout(timeoutId);
      iframe.removeEventListener("contextmenu", handleContextMenu);
      iframe.removeEventListener("load", handleLoad);
      iframe.removeEventListener("error", handleError);
    };
  }, [processedUrl, viewerStatus]);

  // 构造国内服务URL（示例为阿里云）
  const domesticViewerUrl = processedUrl 
    ? `https://preview.imm.aliyuncs.com/index.html?url=${encodeURIComponent(processedUrl)}&hidecmb=1&lang=zh`
    : '';

  // 备用的Office Online Viewer
  const officeOnlineViewerUrl = processedUrl 
    ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(processedUrl)}&wdSmallView=1`
    : '';

  // 根据设置选择使用哪个服务
  const viewerUrl = useDomesticService ? domesticViewerUrl : officeOnlineViewerUrl;

  if (!url) {
    return (
      <div className="relative w-full bg-muted rounded-lg overflow-hidden flex items-center justify-center h-[600px]">
        <div className="text-center p-8 max-w-md">
          <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-6" />
          <h3 className="text-xl font-semibold mb-2">URL为空</h3>
          <p className="text-muted-foreground">
            未提供有效的文件URL。
          </p>
        </div>
        
        <div className="absolute top-0 left-0 right-0 bg-primary/90 text-primary-foreground text-sm py-2 px-4 text-center">
          演示文稿仅供在线查看，不支持下载
        </div>
      </div>
    );
  }

  if (viewerStatus === 'error') {
    return (
      <div className="relative w-full bg-muted rounded-lg overflow-hidden flex items-center justify-center h-[600px]">
        <div className="text-center p-8 max-w-md">
          <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-6" />
          <h3 className="text-xl font-semibold mb-2">无法加载演示文稿</h3>
          <p className="text-muted-foreground mb-4">
            {errorMessage || '很抱歉，当前无法加载该演示文稿。'}
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>重要提醒:</strong> 出于版权和安全考虑，演示文稿仅供已授权用户在线学习，系统已禁用下载功能。
            </p>
          </div>
          
          <div className="text-xs text-muted-foreground mb-4">
            <p className="font-medium mb-1">原始URL:</p>
            <p className="truncate bg-background p-2 rounded mb-2">{url}</p>
            <p className="font-medium mb-1">处理后URL:</p>
            <p className="truncate bg-background p-2 rounded">{processedUrl}</p>
          </div>
          
          <button 
            onClick={() => {
              setUseDomesticService(!useDomesticService);
              setViewerStatus('loading');
              setErrorMessage('');
            }}
            className="text-sm text-primary hover:underline"
          >
            切换到{useDomesticService ? 'Office Online' : '国内服务'}重试
          </button>
        </div>
        
        <div className="absolute top-0 left-0 right-0 bg-primary/90 text-primary-foreground text-sm py-2 px-4 text-center">
          演示文稿仅供在线查看，不支持下载
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-muted rounded-lg overflow-hidden">
      {processedUrl ? (
        <iframe
          ref={iframeRef}
          src={viewerUrl}
          className="w-full h-[600px] border-0"
          title="PPT查看器"
        />
      ) : (
        <div className="flex items-center justify-center h-[600px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">正在处理文件路径...</p>
          </div>
        </div>
      )}
      
      {viewerStatus === 'loading' && processedUrl && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              {useDomesticService ? '正在使用国内服务加载演示文稿...' : '正在使用Office Online加载演示文稿...'}
            </p>
            <p className="text-xs text-muted-foreground mt-2 truncate w-full px-4">文件: {processedUrl}</p>
          </div>
        </div>
      )}
      
      {/* 防止下载的提示 */}
      <div className="absolute top-0 left-0 right-0 bg-primary/90 text-primary-foreground text-sm py-2 px-4 text-center">
        演示文稿仅供在线查看，不支持下载
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

export default PPTViewer;