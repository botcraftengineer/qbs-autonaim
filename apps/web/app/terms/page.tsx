import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Zap } from "lucide-react"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">QBS Автонайм</span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              На главную
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-8 text-4xl font-bold text-foreground">Условия использования</h1>
          <p className="mb-8 text-muted-foreground">Последнее обновление: 19 декабря 2025 г.</p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">1. Общие положения</h2>
              <p className="text-muted-foreground leading-relaxed">
                Настоящие Условия использования (далее — «Условия») регулируют отношения между ООО «КБС» (далее —
                «Компания») и пользователем сервиса QBS Автонайм (далее — «Пользователь»). Регистрируясь в Сервисе,
                Пользователь подтверждает согласие с настоящими Условиями.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">2. Описание Сервиса</h2>
              <p className="text-muted-foreground leading-relaxed">
                QBS Автонайм — это платформа для автоматизации процесса найма персонала с использованием технологий
                искусственного интеллекта. Сервис обеспечивает автоматический скрининг резюме, проведение интервью в
                Telegram и формирование отчётов по кандидатам.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">3. Регистрация и аккаунт</h2>
              <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                <li>Для использования Сервиса необходима регистрация</li>
                <li>Пользователь обязуется предоставить достоверную информацию</li>
                <li>Пользователь несёт ответственность за сохранность учётных данных</li>
                <li>Один аккаунт может использоваться только одной организацией</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">4. Права и обязанности Пользователя</h2>
              <p className="mb-4 text-muted-foreground leading-relaxed">Пользователь имеет право:</p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
                <li>Использовать функционал Сервиса в соответствии с выбранным тарифом</li>
                <li>Получать техническую поддержку</li>
                <li>Экспортировать свои данные</li>
              </ul>
              <p className="mb-4 text-muted-foreground leading-relaxed">Пользователь обязуется:</p>
              <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                <li>Соблюдать законодательство РФ при использовании Сервиса</li>
                <li>Получать согласие кандидатов на обработку персональных данных</li>
                <li>Не использовать Сервис для противоправных целей</li>
                <li>Своевременно оплачивать услуги согласно выбранному тарифу</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">5. Тарифы и оплата</h2>
              <p className="text-muted-foreground leading-relaxed">
                Стоимость услуг определяется действующими тарифами, опубликованными на сайте Сервиса. Оплата
                производится на условиях предоплаты. Неиспользованные в течение оплаченного периода услуги не
                переносятся на следующий период и не возвращаются.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">6. Интеллектуальная собственность</h2>
              <p className="text-muted-foreground leading-relaxed">
                Все права на Сервис, включая программный код, дизайн, алгоритмы и товарные знаки, принадлежат Компании.
                Пользователю предоставляется неисключительная лицензия на использование Сервиса в рамках его
                функционала.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">7. Ограничение ответственности</h2>
              <p className="text-muted-foreground leading-relaxed">
                Сервис предоставляется «как есть». Компания не гарантирует бесперебойную работу Сервиса и не несёт
                ответственности за косвенные убытки Пользователя. Максимальная ответственность Компании ограничена
                суммой, уплаченной Пользователем за последние 12 месяцев.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">8. Конфиденциальность</h2>
              <p className="text-muted-foreground leading-relaxed">
                Обработка персональных данных осуществляется в соответствии с Политикой конфиденциальности, которая
                является неотъемлемой частью настоящих Условий.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">9. Изменение Условий</h2>
              <p className="text-muted-foreground leading-relaxed">
                Компания вправе изменять настоящие Условия, уведомив Пользователя не менее чем за 14 дней до вступления
                изменений в силу. Продолжение использования Сервиса после вступления изменений в силу означает согласие
                с новыми Условиями.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">10. Прекращение использования</h2>
              <p className="text-muted-foreground leading-relaxed">
                Пользователь может прекратить использование Сервиса в любое время, удалив аккаунт. Компания вправе
                заблокировать аккаунт при нарушении настоящих Условий.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">11. Применимое право</h2>
              <p className="text-muted-foreground leading-relaxed">
                Настоящие Условия регулируются законодательством Российской Федерации. Все споры подлежат рассмотрению в
                суде по месту нахождения Компании.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">12. Контактная информация</h2>
              <p className="text-muted-foreground leading-relaxed">По вопросам, связанным с использованием Сервиса:</p>
              <p className="mt-4 text-muted-foreground">
                ООО «КБС»
                <br />
                Email: support@qbs-avtonaim.ru
                <br />
                Телефон: +7 (800) 555-35-35
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-muted/30 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2025 QBS Автонайм. Все права защищены.
        </div>
      </footer>
    </div>
  )
}
