"use client";

import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@qbs-autonaim/ui";
import {
  IconActivity,
  IconClock,
  IconDatabase,
  IconUsers,
} from "@tabler/icons-react";
import { SiteHeader } from "~/components/layout";

// Моковые данные для демонстрации
const currentPeriod = {
  start: "1 декабря 2025",
  end: "31 декабря 2025",
};

const usageMetrics = [
  {
    title: "Активные пользователи",
    value: "1,234",
    limit: "2,000",
    percentage: 61.7,
    icon: IconUsers,
    trend: "+12%",
    description: "пользователей в этом месяце",
  },
  {
    title: "API запросы",
    value: "456,789",
    limit: "1,000,000",
    percentage: 45.7,
    icon: IconActivity,
    trend: "+8%",
    description: "запросов в этом месяце",
  },
  {
    title: "Хранилище",
    value: "23.4 ГБ",
    limit: "100 ГБ",
    percentage: 23.4,
    icon: IconDatabase,
    trend: "+5%",
    description: "использовано",
  },
  {
    title: "Время выполнения",
    value: "1,234 ч",
    limit: "5,000 ч",
    percentage: 24.7,
    icon: IconClock,
    trend: "+15%",
    description: "часов в этом месяце",
  },
];

const dailyUsage = [
  { date: "18 дек", users: 1150, requests: 42000, storage: 22.1 },
  { date: "19 дек", users: 1180, requests: 45000, storage: 22.5 },
  { date: "20 дек", users: 1200, requests: 48000, storage: 22.8 },
  { date: "21 дек", users: 1220, requests: 44000, storage: 23.0 },
  { date: "22 дек", users: 1210, requests: 46000, storage: 23.2 },
  { date: "23 дек", users: 1234, requests: 43000, storage: 23.4 },
];

const resourceBreakdown = [
  {
    resource: "Воркспейсы",
    usage: "12",
    limit: "50",
    percentage: 24,
    cost: "₽1,200",
  },
  {
    resource: "Участники команды",
    usage: "8",
    limit: "25",
    percentage: 32,
    cost: "₽800",
  },
  {
    resource: "Интеграции",
    usage: "5",
    limit: "10",
    percentage: 50,
    cost: "₽500",
  },
  {
    resource: "Webhook вызовы",
    usage: "15,234",
    limit: "50,000",
    percentage: 30.5,
    cost: "₽152",
  },
  {
    resource: "Email уведомления",
    usage: "2,456",
    limit: "10,000",
    percentage: 24.6,
    cost: "₽246",
  },
];

export default function OrganizationUsagePage() {
  return (
    <>
      <SiteHeader title="Использование" />
      <div className="space-y-6 p-6">
        {/* Заголовок */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Использование</h1>
          <p className="text-muted-foreground">
            Отслеживайте использование ресурсов организации за период с{" "}
            {currentPeriod.start} по {currentPeriod.end}
          </p>
        </div>

        {/* Карточки с основными метриками */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {usageMetrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Card key={metric.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {metric.title}
                  </CardTitle>
                  <Icon className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground text-xs">
                      из {metric.limit}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {metric.trend}
                    </Badge>
                  </div>
                  <Progress value={metric.percentage} className="mt-3" />
                  <p className="text-muted-foreground mt-2 text-xs">
                    {metric.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Табы с детальной информацией */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Обзор</TabsTrigger>
            <TabsTrigger value="resources">Ресурсы</TabsTrigger>
            <TabsTrigger value="history">История</TabsTrigger>
          </TabsList>

          {/* Вкладка Обзор */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Использование за последние 7 дней</CardTitle>
                <CardDescription>
                  Динамика использования основных ресурсов
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dailyUsage.map((day) => (
                    <div
                      key={day.date}
                      className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{day.date}</p>
                        <p className="text-muted-foreground text-xs">
                          {day.users.toLocaleString("ru-RU")} пользователей
                        </p>
                      </div>
                      <div className="flex items-center gap-6 text-right">
                        <div>
                          <p className="text-sm font-medium">
                            {day.requests.toLocaleString("ru-RU")}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            запросов
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {day.storage} ГБ
                          </p>
                          <p className="text-muted-foreground text-xs">
                            хранилище
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Вкладка Ресурсы */}
          <TabsContent value="resources" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Детализация по ресурсам</CardTitle>
                <CardDescription>
                  Подробная информация об использовании каждого ресурса
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ресурс</TableHead>
                      <TableHead>Использование</TableHead>
                      <TableHead>Лимит</TableHead>
                      <TableHead>Прогресс</TableHead>
                      <TableHead className="text-right">Стоимость</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resourceBreakdown.map((resource) => (
                      <TableRow key={resource.resource}>
                        <TableCell className="font-medium">
                          {resource.resource}
                        </TableCell>
                        <TableCell>{resource.usage}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {resource.limit}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={resource.percentage}
                              className="w-[100px]"
                            />
                            <span className="text-muted-foreground text-xs">
                              {resource.percentage}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {resource.cost}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Вкладка История */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>История использования</CardTitle>
                <CardDescription>
                  Архив использования за предыдущие периоды
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      period: "Ноябрь 2025",
                      users: 1180,
                      requests: 425000,
                      storage: 21.2,
                      cost: "₽2,850",
                    },
                    {
                      period: "Октябрь 2025",
                      users: 1050,
                      requests: 380000,
                      storage: 19.8,
                      cost: "₽2,650",
                    },
                    {
                      period: "Сентябрь 2025",
                      users: 980,
                      requests: 350000,
                      storage: 18.5,
                      cost: "₽2,450",
                    },
                  ].map((period) => (
                    <div
                      key={period.period}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div>
                        <p className="font-medium">{period.period}</p>
                        <p className="text-muted-foreground text-sm">
                          {period.users.toLocaleString("ru-RU")} пользователей •{" "}
                          {period.requests.toLocaleString("ru-RU")} запросов •{" "}
                          {period.storage} ГБ
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{period.cost}</p>
                        <p className="text-muted-foreground text-sm">Итого</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Предупреждения и рекомендации */}
        <Card>
          <CardHeader>
            <CardTitle>Рекомендации</CardTitle>
            <CardDescription>
              Советы по оптимизации использования ресурсов
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900 dark:bg-yellow-950">
              <IconActivity className="mt-0.5 size-4 text-yellow-600 dark:text-yellow-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  Использование API приближается к лимиту
                </p>
                <p className="text-muted-foreground text-xs">
                  Вы использовали 45.7% от месячного лимита API запросов.
                  Рассмотрите возможность оптимизации запросов или повышения
                  тарифа.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
              <IconDatabase className="mt-0.5 size-4 text-blue-600 dark:text-blue-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  Хранилище используется эффективно
                </p>
                <p className="text-muted-foreground text-xs">
                  Вы используете только 23.4% от доступного хранилища. У вас
                  достаточно места для роста.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
