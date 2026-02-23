# Чеклист полноты контракта API: Kanban Backend

**Цель**: Проверить полноту спецификации контракта API — каждый endpoint должен иметь полностью указанные контракты запроса/ответа
**Создан**: 2026-02-23
**Функционал**: [Kanban Board Authentication and Management](../spec.md)
**Фокус**: API Contract (endpoints, методы, payloads, коды статуса)

**Связь с другими чеклистами**:
- `api-requirements-quality.md` — общий чеклист качества требований
- `ux-api-contract.md` — фокус на developer experience
- `api-contract-completeness.md` — **этот чеклист**, фокус на полноте контрактов endpoint'ов

---

## Полнота спецификации endpoint'ов

### Endpoint'ы аутентификации

- [ ] CHK001 - Указан ли endpoint регистрации (POST /users или /auth/register)? [Gap, Endpoint]
- [ ] CHK002 - Указан ли endpoint входа (POST /auth/login)? [Completeness, Spec §FR-001/FR-004]
- [ ] CHK003 - Указан ли endpoint обновления токена? [Gap, Endpoint]
- [ ] CHK004 - Указан ли endpoint выхода? [Gap, Endpoint]
- [ ] CHK005 - Указаны ли все контракты запроса/ответа для endpoint'ов аутентификации? [Completeness, Gap]

### Endpoint'ы досок

- [ ] CHK006 - Указан ли endpoint списка досок (GET /boards или /projects)? [Completeness, Spec §FR-009]
- [ ] CHK007 - Указан ли endpoint создания доски (POST /boards)? [Completeness, Spec §FR-007]
- [ ] CHK008 - Указан ли endpoint получения доски (GET /boards/:id)? [Completeness, Spec §FR-012]
- [ ] CHK009 - Указан ли endpoint обновления доски (PATCH/PUT /boards/:id)? [Completeness, Spec §FR-010]
- [ ] CHK010 - Указан ли endpoint удаления доски (DELETE /boards/:id)? [Completeness, Spec §FR-011/FR-013]

### Endpoint'ы задач

- [ ] CHK011 - Указан ли endpoint списка задач (GET /boards/:boardId/tasks)? [Completeness, Spec §FR-017]
- [ ] CHK012 - Указан ли endpoint создания задачи (POST /boards/:boardId/tasks)? [Completeness, Spec §FR-014]
- [ ] CHK013 - Указан ли endpoint получения задачи (GET /tasks/:id)? [Completeness, Spec §FR-020]
- [ ] CHK014 - Указан ли endpoint обновления задачи (PATCH/PUT /tasks/:id)? [Completeness, Spec §FR-018]
- [ ] CHK015 - Указан ли endpoint удаления задачи (DELETE /tasks/:id)? [Completeness, Spec §FR-019]

### Дополнительные endpoint'ы (потенциальные пробелы)

- [ ] CHK016 - Указан ли endpoint health check (GET /health или /ping)? [Gap, Operations]
- [ ] CHK017 - Указан ли endpoint документации API (GET /api-docs)? [Gap, Constitution]

---

## Полнота контракта запроса

### Запросы аутентификации

- [ ] CHK018 - Указано ли тело запроса регистрации (поля username, password)? [Gap, Request Contract]
- [ ] CHK019 - Указано ли тело запроса входа (поля username, password)? [Gap, Request Contract]
- [ ] CHK020 - Указаны ли правила валидации запроса для endpoint'ов аутентификации? [Completeness, Spec §FR-003/FR-029]

### Запросы досок

- [ ] CHK021 - Указано ли тело запроса создания доски (поля title, description)? [Clarity, Spec §FR-007]
- [ ] CHK022 - Указаны ли типы полей доски (string для title/description)? [Clarity, Gap]
- [ ] CHK023 - Указаны ли лимиты длины полей доски (макс. длина)? [Clarity, Spec §FR-025/FR-028]
- [ ] CHK024 - Указано ли тело запроса обновления доски (какие поля обновляемы)? [Clarity, Spec §FR-010]

### Запросы задач

- [ ] CHK025 - Указано ли тело запроса создания задачи (title, description, status, priority)? [Clarity, Spec §FR-014/FR-015/FR-015a]
- [ ] CHK026 - Указаны ли типы полей задачи (enum status, enum priority)? [Clarity, Spec §FR-021/FR-021a]
- [ ] CHK027 - Указаны ли лимиты длины полей задачи? [Clarity, Spec §FR-026/FR-028]
- [ ] CHK028 - Указано ли тело запроса обновления задачи (какие поля обновляемы)? [Clarity, Spec §FR-018]

---

## Полнота контракта ответа

### Успешные ответы

- [ ] CHK029 - Указаны ли форматы успешных ответов (200, 201)? [Gap, Response Contract]
- [ ] CHK030 - Указан ли ответ успешной аутентификации (структура токена)? [Clarity, Spec §FR-004]
- [ ] CHK031 - Указаны ли форматы ответов ресурсов (объект доски, объект задачи)? [Gap, Response Contract]
- [ ] CHK032 - Указаны ли форматы ответов списка (массив с пагинацией)? [Gap, Response Contract]
- [ ] CHK033 - Указаны ли все имена полей ответа (id, title, description, status и т.д.)? [Completeness, Gap]

### Ответы об ошибках

- [ ] CHK034 - Указаны ли форматы ответов об ошибках (структура, поля)? [Gap, Response Contract]
- [ ] CHK035 - Указан ли ответ ошибки валидации (статус 400)? [Completeness, Spec §FR-003]
- [ ] CHK036 - Указан ли ответ ошибки аутентификации (статус 401)? [Completeness, Spec §FR-002/FR-006]
- [ ] CHK037 - Указан ли ответ ошибки авторизации (статус 403)? [Completeness, Spec §FR-012/FR-020]
- [ ] CHK038 - Указан ли ответ ошибки not found (статус 404)? [Gap, Response Contract]
- [ ] CHK039 - Указан ли ответ ошибки конфликта/блокировки (статус 409 или 423)? [Completeness, Spec §FR-003a]
- [ ] CHK040 - Указан ли ответ ошибки сервера (статус 500)? [Gap, Response Contract]

---

## Полнота HTTP методов и кодов статуса

- [ ] CHK041 - Указаны ли HTTP методы для всех endpoint'ов (GET, POST, PATCH, DELETE)? [Gap, Contract]
- [ ] CHK042 - Указаны ли коды успешного статуса (200, 201, 204)? [Gap, Contract]
- [ ] CHK043 - Указаны ли коды ошибок для всех сценариев сбоя? [Completeness, Gap]
- [ ] CHK044 - Уточнено ли использование PATCH vs PUT для обновлений? [Clarity, Gap]
- [ ] CHK045 - Указаны ли требования идемпотентности для безопасных методов (GET, DELETE)? [Completeness, Gap]

---

## Полнота заголовков и метаданных

- [ ] CHK046 - Указаны ли требования заголовков аутентификации (Authorization: Bearer)? [Gap, Headers]
- [ ] CHK047 - Указаны ли заголовки content-type (application/json)? [Gap, Headers]
- [ ] CHK048 - Указаны ли заголовки ответов (пагинация, rate limits)? [Gap, Headers]
- [ ] CHK049 - Указаны ли заголовки correlation ID (X-Request-ID)? [Gap, Observability]
- [ ] CHK050 - Указаны ли заголовки CORS (Access-Control-Allow-Origin)? [Clarity, Spec §Assumptions]

---

## Полнота правил валидации

- [ ] CHK051 - Указаны ли правила валидации username (длина, символы)? [Clarity, Spec §Assumptions-8]
- [ ] CHK052 - Указано ли правило сложности пароля (8+ символов, 1 заглавная, 1 строчная, 1 цифра)? [Completeness, Spec §FR-029]
- [ ] CHK053 - Указаны ли правила валидации названия доски (не пустое, макс. длина)? [Completeness, Spec §FR-025]
- [ ] CHK054 - Указаны ли правила валидации названия задачи (не пустое, макс. длина)? [Completeness, Spec §FR-026]
- [ ] CHK055 - Указаны ли правила валидации UUID для ID ресурсов? [Gap, Validation]
- [ ] CHK056 - Указана ли валидация существования доски (задача должна принадлежать существующей доске)? [Completeness, Spec §FR-027]

---

## Полнота enum и ограничений

- [ ] CHK057 - Полностью ли указаны значения enum статуса задачи (BACKLOG, TODO, IN_PROGRESS, REVIEW, DONE)? [Completeness, Spec §FR-021]
- [ ] CHK058 - Полностью ли указаны значения enum приоритета задачи (LOW, MEDIUM, HIGH, CRITICAL)? [Completeness, Spec §FR-021a]
- [ ] CHK059 - Указаны ли ограничения переходов статуса (любой → любой)? [Completeness, Spec §FR-022]
- [ ] CHK060 - Указаны ли значения по умолчанию для опциональных полей (status=BACKLOG, priority=MEDIUM)? [Completeness, Spec §FR-015/FR-015a]

---

## Контракт пагинации и фильтрации

- [ ] CHK061 - Указаны ли параметры пагинации (page, pageSize или offset, limit)? [Gap, Contract]
- [ ] CHK062 - Указаны ли заголовки ответа пагинации (X-Total-Count, X-Total-Pages)? [Gap, Contract]
- [ ] CHK063 - Указаны ли параметры сортировки (sortBy, sortOrder)? [Gap, Contract]
- [ ] CHK064 - Указаны ли параметры фильтрации (фильтры status, priority)? [Gap, Future Enhancement]
- [ ] CHK065 - Указаны ли параметры поиска (q, titleContains)? [Gap, Future Enhancement]

---

## Контракт аутентификации и авторизации

- [ ] CHK066 - Указан ли формат токена (структура JWT, claims)? [Clarity, Spec §Assumptions-2]
- [ ] CHK067 - Указано ли истечение токена (время жизни access токена)? [Gap, Contract]
- [ ] CHK068 - Указаны ли маркеры защищённых endpoint'ов (какие endpoint'ы требуют аутентификацию)? [Completeness, Spec §FR-005]
- [ ] CHK069 - Указаны ли правила валидации владения (пользователь может получать доступ только к своим ресурсам)? [Completeness, Spec §FR-009/FR-012/FR-020]
- [ ] CHK070 - Указано ли различие ролей admin/owner? [Gap, Authorization]

---

## Контракт версионирования и эволюции

- [ ] CHK071 - Указано ли версионирование API (префикс /api/v1/)? [Gap, Contract]
- [ ] CHK072 - Указаны ли требования уведомления о breaking changes? [Gap, Contract]
- [ ] CHK073 - Указана ли политика устаревания? [Gap, Future Enhancement]
- [ ] CHK074 - Указаны ли требования обратной совместимости? [Gap, Contract]

---

## Сводка полноты

### Покрытие endpoint'ов

| Категория | Требуемые endpoint'ы | Указано | Отсутствует |
|-----------|---------------------|---------|-------------|
| Аутентификация | 4 (register, login, refresh, logout) | 1-2 | 2-3 |
| Доски | 5 (list, create, get, update, delete) | 5 подразумевается | 0 |
| Задачи | 5 (list, create, get, update, delete) | 5 подразумевается | 0 |
| Операции | 2 (health, docs) | 0 | 2 |

### Покрытие контрактов

| Аспект контракта | Статус | Количество пробелов |
|------------------|--------|---------------------|
| Тела запросов | ⚠️ Partial | 8 |
| Тела ответов | ❌ Missing | 10 |
| HTTP методы | ❌ Missing | 5 |
| Коды статуса | ⚠️ Partial | 6 |
| Заголовки | ❌ Missing | 5 |
| Правила валидации | ⚠️ Partial | 6 |
| Пагинация | ❌ Missing | 5 |
| Аутентификация | ⚠️ Partial | 4 |

### Критические пробелы (должны быть устранены перед планированием)

1. **Схемы тел ответов** — Не указаны форматы ответов для всех endpoint'ов
2. **HTTP методы** — Не указаны методы (GET/POST/PATCH/DELETE) для endpoint'ов
3. **Структура ответа об ошибке** — Не указан формат ошибок
4. **Формат токена** — Не указана структура JWT токена
5. **Параметры пагинации** — Не указаны параметры пагинации
6. **Заголовки запросов** — Не указаны требуемые заголовки (Authorization, Content-Type)

### Рекомендации

**Перед `/speckit.plan`:**

1. **Добавить раздел контракта API** в spec.md с:
   - Все endpoint'ы с HTTP методами
   - Схемы тел запросов для POST/PATCH
   - Схемы тел ответов для всех ответов
   - Стандарт формата ответа об ошибке

2. **Указать контракт аутентификации:**
   - Структура JWT токена и claims
   - Времена истечения токена
   - Flow refresh токена

3. **Определить стандарт пагинации:**
   - Имена параметров (page/pageSize или offset/limit)
   - Заголовки ответов для метаданных пагинации

4. **Задокументировать требования заголовков:**
   - Формат заголовка Authorization
   - Ожидания Content-Type
   - Заголовки rate limit

### Следующие шаги

```bash
# 1. Добавить раздел контракта API в spec.md
#    Указать endpoint'ы, методы, схемы запросов/ответов

# 2. Проверить связанные чеклисты
cat specs/001-kanban/checklists/api-requirements-quality.md
cat specs/001-kanban/checklists/ux-api-contract.md

# 3. Когда готово, перейти к планированию
/speckit.plan
```

### Заметка об отслеживаемости

Элементы ссылаются на разделы спецификации где доступны. Элементы помеченные `[Gap]` указывают на отсутствующие спецификации контракта API которые должны быть добавлены. Этот чеклист фокусируется конкретно на **полноте контракта API** — каждый endpoint должен иметь полностью указанные контракты запроса/ответа перед реализацией.
