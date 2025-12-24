# Настройка переменных окружения для Web Landing

## Переменные окружения

Web приложение использует собственный `env.ts` и не зависит от пакета `@qbs-autonaim/config`.

### Обязательные переменные

```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_APP_NAME=QBS Автонайм
```

## Локальная разработка

1. Создайте `.env.local` в корне проекта:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=QBS Автонайм
```

2. Запустите dev сервер:

```bash
cd apps/web
bun dev
```

## Docker

### Сборка образа

```bash
docker build \
  --build-arg NEXT_PUBLIC_APP_URL=https://qbs-autonaim.com \
  --build-arg NEXT_PUBLIC_APP_NAME="QBS Автонайм" \
  -f apps/web/Dockerfile \
  -t qbs-autonaim-web:latest \
  .
```

### Docker Compose

Переменные автоматически берутся из `.env` файла:

```bash
docker-compose up web
```

## Kubernetes

Переменные `NEXT_PUBLIC_*` встраиваются в код **во время сборки**, поэтому:

1. **Соберите образ** с правильными переменными
2. **Задеплойте** образ в K8s

```bash
# Сборка
docker build \
  --build-arg NEXT_PUBLIC_APP_URL=https://qbs-autonaim.com \
  --build-arg NEXT_PUBLIC_APP_NAME="QBS Автонайм" \
  -f apps/web/Dockerfile \
  -t registry.example.com/qbs-autonaim-web:v1.0.0 \
  .

# Push
docker push registry.example.com/qbs-autonaim-web:v1.0.0

# Deploy
kubectl apply -f k8s/web-deployment.yaml
```

## Важно

- Переменные `NEXT_PUBLIC_*` встраиваются в статические файлы при сборке
- Изменение переменных требует **пересборки** Docker образа
- Для разных окружений (dev/staging/prod) создавайте отдельные образы

## Проверка

После деплоя откройте браузер и проверьте, что кнопки ведут на правильный URL:

- "Войти" → `${NEXT_PUBLIC_APP_URL}/sign-in`
- "Начать бесплатно" → `${NEXT_PUBLIC_APP_URL}/sign-up`
- "Посмотреть демо" → `${NEXT_PUBLIC_APP_URL}/demo`
