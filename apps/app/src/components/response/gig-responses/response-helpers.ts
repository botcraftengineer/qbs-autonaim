export const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    NEW: "Новый",
    EVALUATED: "Оценен",
    INTERVIEW: "Интервью",
    NEGOTIATION: "Переговоры",
    COMPLETED: "Завершен",
    SKIPPED: "Пропущен",
  };
  return labels[status] || status;
};

export const getStatusVariant = (status: string) => {
  const variants: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    NEW: "default",
    EVALUATED: "secondary",
    INTERVIEW: "outline",
    NEGOTIATION: "outline",
    COMPLETED: "secondary",
    SKIPPED: "destructive",
  };
  return variants[status] || "default";
};

export const getHrStatusLabel = (status: string | null) => {
  if (!status) return null;
  const labels: Record<string, string> = {
    RECOMMENDED: "Рекомендован",
    NOT_RECOMMENDED: "Не рекомендован",
    PENDING: "На рассмотрении",
  };
  return labels[status] || status;
};

export const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};
