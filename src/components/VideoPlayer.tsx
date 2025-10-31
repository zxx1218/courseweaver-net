import { useEffect, useRef } from "react";

interface VideoPlayerProps {
  url: string;
}

const VideoPlayer = ({ url }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // 禁用右键菜单
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    video.addEventListener("contextmenu", handleContextMenu);

    return () => {
      video.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  return (
    <div className="relative w-full bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        className="w-full aspect-video"
        controls
        controlsList="nodownload"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
      >
        <source src={url} type="video/mp4" />
        <source src={url} type="video/webm" />
        您的浏览器不支持视频播放
      </video>
      
      {/* 防止下载的透明遮罩层 */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 1 }}
      />
    </div>
  );
};

export default VideoPlayer;
