"use client";

import { cn } from "@selectio/ui";
import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface VoicePlayerProps {
  src: string;
  isOutgoing?: boolean;
}

export function VoicePlayer({ src, isOutgoing = false }: VoicePlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setTotalDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className="flex items-center gap-2 min-w-[200px]">
      <audio ref={audioRef} src={src} preload="metadata">
        <track kind="captions" />
      </audio>

      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full transition-colors shrink-0",
          isOutgoing
            ? "bg-white/20 hover:bg-white/30"
            : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600",
        )}
      >
        {isPlaying ? (
          <Pause
            className={cn("w-4 h-4", isOutgoing ? "text-white" : "text-black")}
            fill="currentColor"
          />
        ) : (
          <Play
            className={cn(
              "w-4 h-4 ml-0.5",
              isOutgoing ? "text-white" : "text-black",
            )}
            fill="currentColor"
          />
        )}
      </button>

      {/* Progress Bar */}
      <div className="flex-1 flex items-center gap-2">
        <div className="flex-1 h-1 bg-white/20 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all",
              isOutgoing ? "bg-white" : "bg-teal-500",
            )}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Time */}
        <span className="text-xs opacity-70 whitespace-nowrap tabular-nums">
          {formatTime(currentTime)} / {formatTime(totalDuration)}
        </span>
      </div>
    </div>
  );
}
