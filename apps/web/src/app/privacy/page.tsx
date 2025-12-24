import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Zap } from "lucide-react"

export default function PrivacyPolicyPage() {
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
          <h1 className="mb-8 text-4xl font-bold text-foreground">Политика конфиденциальности</h1>
          <p className="mb-8 text-muted-foreground">Последнее обновление: 19 декабря 2025 г.</p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">1. Общие положения</h2>
              <p className="text-muted-foreground leading-relaxed">
                Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных данных
                пользователей сервиса QBS Автонайм (далее — «Сервис»). Используя Сервис, вы соглашаетесь с условиями
                данной Политики конфиденциальности.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">2. Собираемые данные</h2>
              <p className="mb-4 text-muted-foreground leading-relaxed">Мы собираем следующие типы данных:</p>
              <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                <li>Контактная информация (имя, email, номер телефона)</li>
                <li>Данные о компании (название, ИНН, адрес)</li>
                <li>Данные кандидатов (резюме, контактные данные, записи интервью)</li>
                <li>Техническая информация (IP-адрес, тип браузера, данные об устройстве)</li>
                <li>Данные об использовании Сервиса (журналы действий, аналитика)</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">3. Цели обработки данных</h2>
              <p className="mb-4 text-muted-foreground leading-relaxed">Персональные данные обрабатываются для:</p>
              <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                <li>Предоставления услуг по автоматизации найма персонала</li>
                <li>Проведения AI-интервью и анализа кандидатов</li>
                <li>Улучшения качества Сервиса</li>
                <li>Связи с пользователями по вопросам работы Сервиса</li>
                <li>Выполнения требований законодательства РФ</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">4. Защита данных</h2>
              <p className="text-muted-foreground leading-relaxed">
                Мы применяем современные технические и организационные меры для защиты персональных данных от
                несанкционированного доступа, изменения, раскрытия или уничтожения. Данные хранятся на защищённых
                серверах с использованием шифрования и регулярного резервного копирования.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">5. Передача данных третьим лицам</h2>
              <p className="text-muted-foreground leading-relaxed">
                Мы не передаём персональные данные третьим лицам, за исключением случаев, предусмотренных
                законодательством РФ, а также при использовании сторонних сервисов, необходимых для работы Сервиса
                (хостинг, аналитика). Все партнёры обязуются соблюдать конфиденциальность данных.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">6. Хранение данных</h2>
              <p className="text-muted-foreground leading-relaxed">
                Персональные данные хранятся в течение срока действия договора и 3 лет после его окончания, если иное не
                предусмотрено законодательством. Данные кандидатов хранятся в соответствии с настройками пользователя и
                могут быть удалены по запросу.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">7. Права пользователей</h2>
              <p className="mb-4 text-muted-foreground leading-relaxed">Вы имеете право:</p>
              <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                <li>Получить информацию об обрабатываемых персональных данных</li>
                <li>Требовать исправления неточных данных</li>
                <li>Требовать удаления персональных данных</li>
                <li>Отозвать согласие на обработку данных</li>
                <li>Подать жалобу в Роскомнадзор</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">8. Файлы cookie</h2>
              <p className="text-muted-foreground leading-relaxed">
                Сервис использует файлы cookie для обеспечения работоспособности и улучшения пользовательского опыта. Вы
                можете настроить использование cookie в настройках браузера.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">9. Контактная информация</h2>
              <p className="text-muted-foreground leading-relaxed">
                По вопросам, связанным с обработкой персональных данных, вы можете связаться с нами:
              </p>
              <p className="mt-4 text-muted-foreground">
                Email: privacy@qbs-avtonaim.ru
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
