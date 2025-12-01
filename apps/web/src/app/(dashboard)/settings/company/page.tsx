"use client";

import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function OldSettingsCompanyPage() {
  useEffect(() => {
    // Редирект на новую структуру с workspace
    redirect("/");
  }, []);

  return null;
}
