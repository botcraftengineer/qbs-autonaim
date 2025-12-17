"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
} from "@qbs-autonaim/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";
import type { FunnelCandidate } from "../types";

interface SendOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: FunnelCandidate;
  workspaceId: string;
}

export function SendOfferDialog({
  open,
  onOpenChange,
  candidate,
  workspaceId,
}: SendOfferDialogProps) {
  const [position, setPosition] = useState(candidate.position);
  const [salary, setSalary] = useState("");
  const [startDate, setStartDate] = useState("");
  const [benefits, setBenefits] = useState("");
  const [message, setMessage] = useState("");

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const sendOfferMutation = useMutation({
    ...trpc.candidates.sendOffer.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.candidates.list.queryKey(),
      });
      toast.success("Оффер успешно отправлен");
      onOpenChange(false);
      resetForm();
    },
    onError: () => {
      toast.error("Не удалось отправить оффер");
    },
  });

  const resetForm = () => {
    setPosition(candidate.position);
    setSalary("");
    setStartDate("");
    setBenefits("");
    setMessage("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendOfferMutation.mutate({
      workspaceId,
      candidateId: candidate.id,
      offerDetails: {
        position,
        salary,
        startDate,
        benefits,
        message,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Отправить оффер</DialogTitle>
          <DialogDescription>
            Отправьте предложение о работе кандидату {candidate.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="position">Должность</Label>
            <Input
              id="position"
              name="position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="Например, Senior Frontend Developer"
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="salary">Зарплата</Label>
            <Input
              id="salary"
              name="salary"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              placeholder="Например, 200 000 - 250 000 ₽"
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">Дата начала работы</Label>
            <Input
              id="startDate"
              name="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="benefits">Бенефиты</Label>
            <Textarea
              id="benefits"
              name="benefits"
              value={benefits}
              onChange={(e) => setBenefits(e.target.value)}
              placeholder="ДМС, удаленная работа, гибкий график…"
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Дополнительное сообщение</Label>
            <Textarea
              id="message"
              name="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Персональное сообщение кандидату…"
              rows={4}
              className="resize-none"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={sendOfferMutation.isPending}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={sendOfferMutation.isPending}>
              {sendOfferMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Отправить оффер
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
