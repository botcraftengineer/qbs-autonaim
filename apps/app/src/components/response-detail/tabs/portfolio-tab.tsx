"use client";

import { Button } from "@qbs-autonaim/ui";
import { ExternalLink, FileText, Image as ImageIcon } from "lucide-react";
import type { RouterOutputs } from "@qbs-autonaim/api";

type GigResponseDetail = RouterOutputs["gig"]["responses"]["get"];

interface PortfolioTabProps {
  response: GigResponseDetail;
}

export function PortfolioTab({ response }: PortfolioTabProps) {
  return (
    <div className="space-y-3 sm:space-y-4 mt-0">
      {response.portfolioLinks &&
        response.portfolioLinks.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs sm:text-sm font-semibold">
              Ссылки на работы
            </h4>
            <div className="space-y-2">
              {response.portfolioLinks.map((link) => (
                <Button
                  key={link}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 min-h-[44px] sm:min-h-[36px] touch-action-manipulation"
                  asChild
                >
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate text-xs sm:text-sm">
                      {link}
                    </span>
                  </a>
                </Button>
              ))}
            </div>
          </div>
        )}

      {response.portfolioFileId && (
        <div className="space-y-3">
          <h4 className="text-xs sm:text-sm font-semibold">
            Файл портфолио
          </h4>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 w-full sm:w-auto min-h-[44px] sm:min-h-[36px] touch-action-manipulation"
          >
            <FileText className="h-4 w-4" />
            Скачать портфолио
          </Button>
        </div>
      )}

      {response.photoFileId && (
        <div className="space-y-3">
          <h4 className="text-xs sm:text-sm font-semibold">Фото</h4>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 w-full sm:w-auto min-h-[44px] sm:min-h-[36px] touch-action-manipulation"
          >
            <ImageIcon className="h-4 w-4" />
            Посмотреть фото
          </Button>
        </div>
      )}

      {!response.portfolioLinks?.length &&
        !response.portfolioFileId &&
        !response.photoFileId && (
          <div className="rounded-lg border border-dashed bg-muted/20 text-center py-8 text-muted-foreground">
            <FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 opacity-50" />
            <p className="text-xs sm:text-sm">
              Портфолио не предоставлено
            </p>
          </div>
        )}
    </div>
  );
}