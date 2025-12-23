"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Input,
  Label,
} from "@qbs-autonaim/ui";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";

interface DeleteOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationName: string;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function DeleteOrganizationDialog({
  open,
  onOpenChange,
  organizationName,
  onConfirm,
  isDeleting = false,
}: DeleteOrganizationDialogProps) {
  const [nameInput, setNameInput] = useState("");

  const isNameValid = nameInput === organizationName;
  const canDelete = isNameValid && !isDeleting;

  const handleConfirm = () => {
    if (canDelete) {
      onConfirm();
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isDeleting) {
      onOpenChange(newOpen);
      if (!newOpen) {
        setNameInput("");
      }
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
          </div>
          <AlertDialogTitle className="text-center text-xl">
            Удалить организацию
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-muted-foreground">
            Внимание: Это безвозвратно удалит вашу организацию, все рабочие
            пространства, интеграции, вакансии и отклики кандидатов.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name-input" className="text-sm font-medium">
              Введите название организации{" "}
              <span className="font-semibold">{organizationName}</span> для
              продолжения:
            </Label>
            <Input
              id="name-input"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder={organizationName}
              disabled={isDeleting}
              className={
                nameInput && !isNameValid
                  ? "border-destructive focus-visible:ring-destructive"
                  : ""
              }
            />
          </div>
        </div>

        <AlertDialogFooter className="flex-col sm:flex-col gap-2">
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!canDelete}
            className="w-full"
          >
            {isDeleting ? "Удаление…" : "Подтвердить удаление"}
          </Button>
          <AlertDialogCancel
            disabled={isDeleting}
            className="w-full mt-0"
            onClick={() => handleOpenChange(false)}
          >
            Отмена
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
