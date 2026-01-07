"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { paths } from "@qbs-autonaim/config";
import { Button } from "@/components/ui/button";
import { env } from "@/env";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground">
            <span className="text-lg font-bold text-background">Q</span>
          </div>
          <span className="text-lg font-semibold text-foreground">QBS</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="#features"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Возможности
          </Link>
          <Link
            href="#how-it-works"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Как работает
          </Link>
          <Link
            href="#pricing"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Цены
          </Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button
            variant="ghost"
            size="sm"
            className="text-sm hover:bg-muted hover:text-foreground"
            asChild
          >
            <Link href={`${env.NEXT_PUBLIC_APP_URL}${paths.auth.signin}`}>Войти</Link>
          </Button>
          <Button
            size="sm"
            className="bg-foreground text-background hover:bg-neutral-800 transition-all duration-200"
            asChild
          >
            <Link href={`${env.NEXT_PUBLIC_APP_URL}${paths.auth.signup}`}>
              Начать бесплатно
            </Link>
          </Button>
        </div>

        <button
          type="button"
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {isMenuOpen && (
        <div className="border-t border-border md:hidden">
          <nav className="container mx-auto flex flex-col gap-4 px-4 py-4">
            <Link href="#features" className="text-sm text-muted-foreground">
              Возможности
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm text-muted-foreground"
            >
              Как работает
            </Link>
            <Link href="#pricing" className="text-sm text-muted-foreground">
              Цены
            </Link>
            <div className="flex flex-col gap-2 pt-4 border-t border-border">
              <Button
                variant="ghost"
                className="w-full justify-start hover:bg-muted hover:text-foreground"
                asChild
              >
                <Link href={`${env.NEXT_PUBLIC_APP_URL}${paths.auth.signin}`}>
                  Войти
                </Link>
              </Button>
              <Button
                className="w-full bg-foreground text-background hover:bg-neutral-800 transition-all duration-200"
                asChild
              >
                <Link href={`${env.NEXT_PUBLIC_APP_URL}${paths.auth.signup}`}>
                  Начать бесплатно
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
