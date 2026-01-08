"use client";

import { Button } from "@qbs-autonaim/ui";
import {
  IconFile,
  IconFileTypePdf,
  IconPhoto,
  IconTrash,
  IconUpload,
  IconVideo,
} from "@tabler/icons-react";
import { useCallback, useRef, useState } from "react";

interface MediaFile {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize?: string | null;
  url?: string;
}

interface InterviewMediaUploadProps {
  files: MediaFile[];
  onFilesChange: (fileIds: string[]) => void;
  workspaceId: string;
  gigId: string;
}

export function InterviewMediaUpload({
  files,
  onFilesChange,
}: InterviewMediaUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    // TODO: Implement file upload to S3 and get file IDs
    // For now, just show a placeholder
    console.log("Files selected:", selectedFiles);
  }, []);

  const handleRemoveFile = useCallback(
    (fileId: string) => {
      const newFileIds = files.filter((f) => f.id !== fileId).map((f) => f.id);
      onFilesChange(newFileIds);
    },
    [files, onFilesChange],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect],
  );

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) {
      return <IconPhoto className="size-5" aria-hidden="true" />;
    }
    if (mimeType.startsWith("video/")) {
      return <IconVideo className="size-5" aria-hidden="true" />;
    }
    if (mimeType === "application/pdf") {
      return <IconFileTypePdf className="size-5" aria-hidden="true" />;
    }
    return <IconFile className="size-5" aria-hidden="true" />;
  };

  const formatFileSize = (size: string | null | undefined) => {
    if (!size) return "";
    const bytes = Number.parseInt(size, 10);
    if (Number.isNaN(bytes)) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,application/pdf"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="sr-only"
        id="interview-media-upload"
      />
      <label
        htmlFor="interview-media-upload"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          flex flex-col items-center gap-2 cursor-pointer
          border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${isDragging ? "border-primary bg-primary/5" : "border-border"}
        `}
      >
        <IconUpload
          className="size-8 text-muted-foreground"
          aria-hidden="true"
        />
        <div className="space-y-1">
          <p className="text-sm font-medium">
            Перетащите файлы сюда или нажмите для выбора
          </p>
          <p className="text-xs text-muted-foreground">
            Поддерживаются изображения, видео и PDF
          </p>
        </div>
      </label>

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Загруженные файлы ({files.length})
          </p>
          <ul className="space-y-2">
            {files.map((file) => (
              <li
                key={file.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card"
              >
                <div className="shrink-0 text-muted-foreground">
                  {getFileIcon(file.mimeType)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {file.fileName}
                  </p>
                  {file.fileSize && (
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.fileSize)}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFile(file.id)}
                  className="shrink-0 min-h-[44px] min-w-[44px]"
                  aria-label={`Удалить файл ${file.fileName}`}
                >
                  <IconTrash className="size-4" aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-lg bg-muted/50 p-4 space-y-2">
        <p className="text-sm font-medium">Как это работает</p>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
          <li>
            Загрузите изображения, видео или документы, которые хотите показать
            кандидату
          </li>
          <li>
            Бот покажет эти файлы во время интервью и спросит, сможет ли
            кандидат сделать подобное
          </li>
          <li>
            Это помогает оценить практические навыки и понимание требований
          </li>
        </ul>
      </div>
    </div>
  );
}
