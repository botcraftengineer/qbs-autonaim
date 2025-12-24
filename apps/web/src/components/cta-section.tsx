import { APP_CONFIG } from "@qbs-autonaim/config";
import { ArrowRight, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="relative bg-neutral-900 overflow-hidden min-h-screen flex items-center">
      {/* Vertical grid lines - full width */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px)] bg-[size:80px_100%]" />

      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-800/50 via-transparent to-neutral-900" />

      {/* Top rounded corners overlay to create the "card" effect from light bg */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-background" />
      <div className="absolute top-0 left-0 w-16 h-16 bg-background rounded-br-[2.5rem]" />
      <div className="absolute top-0 right-0 w-16 h-16 bg-background rounded-bl-[2.5rem]" />

      {/* Top rounded "notch" decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[6px] bg-neutral-700 rounded-b-full z-10" />

      {/* Content container - centered */}
      <div className="relative px-8 py-24 md:px-16 w-full max-w-5xl mx-auto">
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 px-4 py-2 text-sm font-medium text-blue-400">
            <Sparkles className="h-4 w-4" />
            Доверяют более 1000+ HR-специалистов
          </div>
        </div>

        <h2 className="mb-6 text-4xl font-bold tracking-tight text-white md:text-6xl leading-tight text-balance text-center">
          Автоматизируйте найм персонала с помощью искусственного интеллекта
        </h2>

        <p className="mb-12 text-lg md:text-xl text-neutral-300 leading-relaxed text-center max-w-3xl mx-auto">
          Сократите время закрытия вакансий на 70% с помощью QBS Автонайм.
          Автоматический AI-скрининг, голосовые интервью через Telegram и
          интеграция с HeadHunter — всё в одной платформе для эффективного
          подбора кандидатов.
        </p>

        {/* Buttons */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row mb-12">
          <Button
            size="lg"
            className="bg-white text-neutral-900 hover:bg-neutral-100 transition-all duration-200 h-12 px-8 text-base font-medium rounded-xl shadow-lg hover:shadow-xl"
            asChild
          >
            <Link href={`${APP_CONFIG.url}/sign-up`}>
              Начать бесплатно
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            size="lg"
            className="bg-neutral-800 text-white hover:bg-neutral-700 border border-neutral-700 transition-all duration-200 h-12 px-8 text-base font-medium rounded-xl"
            asChild
          >
            <Link href={`${APP_CONFIG.url}/demo`}>Посмотреть демо</Link>
          </Button>
        </div>

        <div className="text-center mb-10">
          <p className="text-sm text-neutral-500 mb-4">
            Бесплатная регистрация • Без кредитной карты • Настройка за 5 минут
          </p>
        </div>

        {/* Star ratings */}
        <div className="flex flex-wrap items-center justify-center gap-8 pt-8 border-t border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded bg-neutral-800 text-xs font-bold text-white">
              G2
            </div>
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="h-4 w-4 fill-amber-400 text-amber-400"
                />
              ))}
            </div>
            <span className="text-xs text-neutral-400 ml-1">4.9/5.0</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded bg-[#DA552F] text-[10px] font-bold text-white">
              PH
            </div>
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="h-4 w-4 fill-amber-400 text-amber-400"
                />
              ))}
            </div>
            <span className="text-xs text-neutral-400 ml-1">5.0/5.0</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-bold text-white">
              HH
            </div>
            <div className="flex gap-0.5">
              {[...Array(4)].map((_, i) => (
                <Star
                  key={i}
                  className="h-4 w-4 fill-amber-400 text-amber-400"
                />
              ))}
              <Star className="h-4 w-4 fill-amber-400/50 text-amber-400/50" />
            </div>
            <span className="text-xs text-neutral-400 ml-1">4.7/5.0</span>
          </div>
        </div>
      </div>
    </section>
  );
}
