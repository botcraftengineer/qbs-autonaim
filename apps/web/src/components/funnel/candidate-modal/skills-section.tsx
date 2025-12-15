"use client";

import { Badge } from "@qbs-autonaim/ui";
import { Star } from "lucide-react";

interface SkillsSectionProps {
  skills: string[];
}

export function SkillsSection({ skills }: SkillsSectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Star className="h-4 w-4 text-primary" />
        Навыки и технологии
      </h3>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <Badge
            key={skill}
            variant="secondary"
            className="text-sm font-medium px-3 py-1.5"
          >
            {skill}
          </Badge>
        ))}
      </div>
    </div>
  );
}
