"use client";

import { Briefcase, DollarSign, MapPin } from "lucide-react";
import type { FunnelCandidate } from "../types";

interface ProfessionalInfoProps {
  candidate: FunnelCandidate;
}

export function ProfessionalInfo({ candidate }: ProfessionalInfoProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Briefcase className="h-4 w-4 text-primary" />
        Профессиональная информация
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-muted/50 rounded-lg border space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Местоположение</span>
          </div>
          <p className="text-sm font-semibold">{candidate.location}</p>
        </div>
        <div className="p-3 bg-muted/50 rounded-lg border space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Ожидания по зарплате</span>
          </div>
          <p className="text-sm font-semibold">{candidate.salaryExpectation}</p>
        </div>
      </div>
    </div>
  );
}
