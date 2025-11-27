import {
  Badge,
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@selectio/ui";
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";

interface VacancyAnalyticsProps {
  totalResponses: number;
  processedResponses: number;
  highScoreResponses: number;
  topScoreResponses: number;
  avgScore: number;
}

interface VacancyRequirement {
  category: string;
  items: string[];
}

interface VacancyRequirementsProps {
  requirements: unknown;
}

export function VacancyAnalytics({
  totalResponses,
  processedResponses,
  highScoreResponses,
  topScoreResponses,
  avgScore,
}: VacancyAnalyticsProps) {
  const processedPercentage =
    totalResponses > 0
      ? Math.round((processedResponses / totalResponses) * 100)
      : 0;

  const highScorePercentage =
    processedResponses > 0
      ? Math.round((highScoreResponses / processedResponses) * 100)
      : 0;

  const topScorePercentage =
    processedResponses > 0
      ? Math.round((topScoreResponses / processedResponses) * 100)
      : 0;

  const isGrowingProcessed = processedPercentage >= 50;
  const isGrowingHighScore = highScorePercentage >= 30;
  const isGrowingTopScore = topScorePercentage >= 15;
  const isGoodAvgScore = avgScore >= 3.0;

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Обработано откликов</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {processedResponses}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {isGrowingProcessed ? <IconTrendingUp /> : <IconTrendingDown />}
              {processedPercentage}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {isGrowingProcessed ? "Хороший прогресс" : "Требует обработки"}
            {isGrowingProcessed ? (
              <IconTrendingUp className="size-4" />
            ) : (
              <IconTrendingDown className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground">
            из {totalResponses} всего откликов
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Скоринг ≥ 3</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {highScoreResponses}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {isGrowingHighScore ? <IconTrendingUp /> : <IconTrendingDown />}
              {highScorePercentage}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {isGrowingHighScore ? "Качественные кандидаты" : "Мало подходящих"}
            {isGrowingHighScore ? (
              <IconTrendingUp className="size-4" />
            ) : (
              <IconTrendingDown className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground">от обработанных откликов</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Скоринг ≥ 4</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {topScoreResponses}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {isGrowingTopScore ? <IconTrendingUp /> : <IconTrendingDown />}
              {topScorePercentage}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {isGrowingTopScore ? "Отличные результаты" : "Нужно больше"}
            {isGrowingTopScore ? (
              <IconTrendingUp className="size-4" />
            ) : (
              <IconTrendingDown className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground">
            топовые кандидаты для интервью
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Средний балл</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {processedResponses > 0 ? avgScore.toFixed(1) : "—"}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {isGoodAvgScore ? <IconTrendingUp /> : <IconTrendingDown />}
              {processedResponses > 0 ? "из 5.0" : "—"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {isGoodAvgScore ? "Качество выше среднего" : "Требует улучшения"}
            {isGoodAvgScore ? (
              <IconTrendingUp className="size-4" />
            ) : (
              <IconTrendingDown className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground">общая оценка кандидатов</div>
        </CardFooter>
      </Card>
    </div>
  );
}

export function VacancyRequirements({
  requirements,
}: VacancyRequirementsProps) {
  if (!requirements) {
    return null;
  }

  // Type guard для проверки структуры
  const isValidRequirements = (data: unknown): data is VacancyRequirement[] => {
    return (
      Array.isArray(data) &&
      data.every(
        (item) =>
          typeof item === "object" &&
          item !== null &&
          "category" in item &&
          "items" in item &&
          typeof item.category === "string" &&
          Array.isArray(item.items)
      )
    );
  };

  if (!isValidRequirements(requirements)) {
    return (
      <div className="rounded-lg border p-6 space-y-4">
        <h2 className="text-xl font-semibold">Сгенерированные требования</h2>
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
            Показать JSON
          </summary>
          <pre className="mt-2 p-4 bg-muted rounded-lg overflow-x-auto text-xs">
            <code>{JSON.stringify(requirements, null, 2)}</code>
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-6 space-y-4">
      <h2 className="text-xl font-semibold">Сгенерированные требования</h2>

      <div className="space-y-4">
        {requirements.map((requirement, index) => (
          <div key={`${requirement.category}-${index}`} className="space-y-2">
            <h3 className="text-lg font-medium text-primary">
              {requirement.category}
            </h3>
            <ul className="space-y-1.5 pl-5">
              {requirement.items.map((item, itemIndex) => (
                <li
                  key={`${requirement.category}-${index}-${itemIndex}`}
                  className="text-sm text-muted-foreground list-disc"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
          Показать JSON
        </summary>
        <pre className="mt-2 p-4 bg-muted rounded-lg overflow-x-auto text-xs">
          <code>{JSON.stringify(requirements, null, 2)}</code>
        </pre>
      </details>
    </div>
  );
}
