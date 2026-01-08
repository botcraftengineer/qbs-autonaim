import { Button } from "@qbs-autonaim/ui";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-foreground">
          Страница не найдена
        </h2>
        <p className="mt-2 text-muted-foreground">
          Запрошенная страница не существует
        </p>
      </div>
    </main>
  );
}
