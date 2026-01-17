import { InfoTooltip } from "../ui/info-tooltip";

interface PageHeaderProps {
  title: string;
  description: string;
  docsUrl: string;
  children?: React.ReactNode;
  /** Если true, убирает горизонтальные отступы (для центрированных контейнеров) */
  noPadding?: boolean;
}

export function PageHeader({
  title,
  description,
  docsUrl,
  children,
  noPadding = false,
}: PageHeaderProps) {
  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${
        noPadding ? "" : "px-4 md:px-6 lg:px-8"
      }`}
    >
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold md:text-xl">{title}</h1>
        <InfoTooltip
          content={`${description} [Подробнее в документации](${docsUrl})`}
        />
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
