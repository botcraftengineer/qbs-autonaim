"use client";

import { IconBrandGithub, IconBrandLinkedin } from "@tabler/icons-react";
import { Mail, Phone, Users } from "lucide-react";
import type { FunnelCandidate } from "../types";

interface ContactInfoProps {
  candidate: FunnelCandidate;
}

export function ContactInfo({ candidate }: ContactInfoProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Users className="h-4 w-4 text-primary" />
        Контактная информация
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {candidate.email && (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-background border">
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium">Email</p>
              <p className="text-sm font-medium truncate">{candidate.email}</p>
            </div>
          </div>
        )}
        {candidate.phone && (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-background border">
              <Phone className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium">
                Телефон
              </p>
              <p className="text-sm font-medium">{candidate.phone}</p>
            </div>
          </div>
        )}
        {candidate.linkedin && (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-background border">
              <IconBrandLinkedin className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium">
                LinkedIn
              </p>
              <p className="text-sm font-medium text-primary truncate">
                {candidate.linkedin}
              </p>
            </div>
          </div>
        )}
        {candidate.github && (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-background border">
              <IconBrandGithub className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium">
                GitHub
              </p>
              <p className="text-sm font-medium text-primary truncate">
                {candidate.github}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
