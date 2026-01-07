import { Button } from "@qbs-autonaim/ui";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-foreground">
          Ссылка на интервью не найдена
        </h2>
        <p className="mt-2 text-muted-foreground">
          Ссылка недействительна, истекла или вакансия закрыта
        </p>
        <div className="mt-8">
          <Button asChild>
            <Link href="/">Вернуться на главную</Link>
          </Button>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Если вы считаете, что это ошибка, свяжитесь с работодателем
        </p>
      </div>
    </main>
  );
}
