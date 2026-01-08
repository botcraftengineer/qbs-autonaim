"use client";

import { useCallback, useRef, useState } from "react";

export type RecordingStatus = "idle" | "recording" | "processing";

interface UseVoiceRecorderOptions {
  maxDuration?: number;
  onError?: (error: Error) => void;
}

interface UseVoiceRecorderReturn {
  status: RecordingStatus;
  duration: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  cancelRecording: () => void;
  isSupported: boolean;
}

export function useVoiceRecorder({
  maxDuration = 300,
  onError,
}: UseVoiceRecorderOptions = {}): UseVoiceRecorderReturn {
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const resolveRef = useRef<((blob: Blob | null) => void) | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    !!window.MediaRecorder;

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setDuration(0);
  }, []);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      onError?.(new Error("Запись голоса не поддерживается в этом браузере"));
      return;
    }

    try {
      cleanup();
      setStatus("processing");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;

      let mimeType: string | undefined;

      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = "audio/webm";
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4";
      } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
        mimeType = "audio/ogg";
      } else if (MediaRecorder.isTypeSupported("audio/wav")) {
        mimeType = "audio/wav";
      }

      if (!mimeType) {
        throw new Error(
          "Ни один из поддерживаемых аудио форматов не доступен в этом браузере",
        );
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onerror = () => {
        onError?.(new Error("Ошибка записи"));
        cleanup();
        setStatus("idle");
      };

      mediaRecorder.onstop = () => {
        const recordedMimeType = mediaRecorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: recordedMimeType });

        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        if (streamRef.current) {
          for (const track of streamRef.current.getTracks()) {
            track.stop();
          }
          streamRef.current = null;
        }

        mediaRecorderRef.current = null;
        chunksRef.current = [];
        setDuration(0);
        setStatus("idle");

        resolveRef.current?.(blob);
        resolveRef.current = null;
      };

      mediaRecorder.start(100);
      setStatus("recording");
      setDuration(0);

      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setDuration(elapsed);

        if (elapsed >= maxDuration) {
          mediaRecorder.stop();
        }
      }, 1000);
    } catch (err) {
      cleanup();
      setStatus("idle");

      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          onError?.(new Error("Доступ к микрофону запрещён"));
        } else if (err.name === "NotFoundError") {
          onError?.(new Error("Микрофон не найден"));
        } else {
          onError?.(err);
        }
      }
    }
  }, [isSupported, maxDuration, onError, cleanup]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;

      if (!mediaRecorder || mediaRecorder.state === "inactive") {
        cleanup();
        setStatus("idle");
        resolve(null);
        return;
      }

      setStatus("processing");
      resolveRef.current = resolve;
      mediaRecorder.stop();
    });
  }, [cleanup]);

  const cancelRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    cleanup();
    setStatus("idle");
    resolveRef.current?.(null);
    resolveRef.current = null;
  }, [cleanup]);

  return {
    status,
    duration,
    startRecording,
    stopRecording,
    cancelRecording,
    isSupported,
  };
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
