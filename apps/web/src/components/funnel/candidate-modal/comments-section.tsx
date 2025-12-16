"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Label,
  Switch,
  Textarea,
} from "@qbs-autonaim/ui";
import { Globe, Lock, MessageSquare, Send, Trash2 } from "lucide-react";
import { useState } from "react";

export interface Comment {
  id: string;
  author: string;
  authorAvatar: string | null;
  content: string;
  isPrivate: boolean;
  createdAt: Date;
}

export interface CommentsSectionProps {
  comments: Comment[];
  onAddComment: (content: string, isPrivate: boolean) => void;
  onDeleteComment: (commentId: string) => void;
  isAdding?: boolean;
}

export function CommentsSection({
  comments,
  onAddComment,
  onDeleteComment,
  isAdding,
}: CommentsSectionProps) {
  const [comment, setComment] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  const handleSubmit = () => {
    if (!comment.trim()) return;
    try {
      onAddComment(comment, isPrivate);
      setComment("");
      setIsPrivate(false);
    } catch (error) {
      // Обработка ошибки или toast уведомление
      console.error("Failed to add comment:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
        <Label className="text-sm font-semibold">Добавить комментарий</Label>
        <Textarea
          placeholder="Введите комментарий или заметку о кандидате…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="min-h-[100px] resize-none bg-background"
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch
              id="private"
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
            />
            <Label
              htmlFor="private"
              className="text-sm text-muted-foreground cursor-pointer flex items-center gap-1.5"
            >
              {isPrivate ? (
                <Lock className="h-3.5 w-3.5" />
              ) : (
                <Globe className="h-3.5 w-3.5" />
              )}
              {isPrivate ? "Приватный комментарий" : "Видно всей команде"}
            </Label>
          </div>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!comment.trim() || isAdding}
            className="gap-2"
          >
            <Send className="h-3.5 w-3.5" />
            Добавить
          </Button>
        </div>
      </div>

      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Пока нет комментариев</p>
          </div>
        ) : (
          comments.map((c) => (
            <div
              key={c.id}
              className="p-4 bg-background rounded-lg border space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={c.authorAvatar ?? undefined}
                      alt={c.author}
                    />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {(() => {
                        const fallback = "?";
                        const trimmed = (c.author ?? "").trim();
                        if (!trimmed) return fallback;
                        const initials = trimmed
                          .split(/\s+/)
                          .filter(Boolean)
                          .map((part) => part[0] ?? "")
                          .join("")
                          .toUpperCase();
                        return initials || fallback;
                      })()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{c.author}</p>
                      {c.isPrivate && (
                        <Badge
                          variant="secondary"
                          className="text-xs px-2 py-0 h-5"
                        >
                          <Lock className="h-3 w-3 mr-1" />
                          Приватный
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(c.createdAt).toLocaleString("ru")}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onDeleteComment(c.id)}
                  aria-label="Удалить"
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
              <p className="text-sm leading-relaxed">{c.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
