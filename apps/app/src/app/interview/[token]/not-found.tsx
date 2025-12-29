import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-white px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-gray-700">
          Ссылка на интервью не найдена
        </h2>
        <p className="mt-2 text-gray-600">
          Ссылка недействительна, истекла или вакансия закрыта
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Вернуться на главную
          </Link>
        </div>
        <p className="mt-6 text-sm text-gray-500">
          Если вы считаете, что это ошибка, свяжитесь с работодателем
        </p>
      </div>
    </main>
  );
}
