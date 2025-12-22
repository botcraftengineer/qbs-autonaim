# Деплой Telegram Client в k3s

## Быстрый старт

```bash
# 1. Создать секреты
kubectl create secret generic telegram-client-secrets \
  --from-env-file=.env

# 2. Задеплоить приложение
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/hpa.yaml

# 3. Проверить статус
kubectl get pods -l app=telegram-client
kubectl logs -f deployment/telegram-client
```

## Как это работает

### Автоматический запуск новых сессий

При добавлении нового пользователя в БД:

1. **SessionWatcher** каждые 10 секунд проверяет новые записи в `telegram_session`
2. Автоматически запускает новую сессию внутри существующего pod
3. Если нагрузка растет → HPA создает новые pods

### API endpoints

```bash
# Статус всех сессий
GET /sessions/status

# Статус конкретной сессии
GET /sessions/status/:workspaceId

# Запустить новую сессию вручную
POST /sessions/start/:workspaceId

# Перезапустить сессию
POST /sessions/restart/:workspaceId

# Синхронизировать с БД (перезапустить все)
POST /sessions/sync

# Health check
GET /health
```

### Масштабирование

HPA автоматически масштабирует pods при:
- CPU > 70%
- Memory > 80%

Лимиты: 1-10 pods

### Мониторинг

```bash
# Логи
kubectl logs -f deployment/telegram-client

# Метрики
kubectl top pods -l app=telegram-client

# События HPA
kubectl describe hpa telegram-client-hpa
```

## Альтернатива: Pod-per-Session

Если нужна полная изоляция сессий, можно использовать отдельный pod для каждой сессии.
Создать через k8s API при добавлении пользователя.
