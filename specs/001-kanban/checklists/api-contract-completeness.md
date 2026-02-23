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

- [x] CHK001 - Указан ли endpoint регистрации (POST /users или /auth/register)? [Gap, Endpoint]
- [x] CHK002 - Указан ли endpoint входа (POST /auth/login)? [Completeness, Spec §FR-001/FR-004]
- [x] CHK003 - Указан ли endpoint обновления токена? [Gap, Endpoint]
- [x] CHK004 - Указан ли endpoint выхода? [Gap, Endpoint]
- [x] CHK005 - Указаны ли все контракты запроса/ответа для endpoint'ов аутентификации? [Completeness, Gap]

### Endpoint'ы досок

- [x] CHK006 - Указан ли endpoint списка досок (GET /boards или /projects)? [Completeness, Spec §FR-009]
- [x] CHK007 - Указан ли endpoint создания доски (POST /boards)? [Completeness, Spec §FR-007]
- [x] CHK008 - Указан ли endpoint получения доски (GET /boards/:id)? [Completeness, Spec §FR-012]
- [x] CHK009 - Указан ли endpoint обновления доски (PATCH/PUT /boards/:id)? [Completeness, Spec §FR-010]
- [x] CHK010 - Указан ли endpoint удаления доски (DELETE /boards/:id)? [Completeness, Spec §FR-011/FR-013]

### Endpoint'ы задач

- [x] CHK011 - Указан ли endpoint списка задач (GET /boards/:boardId/tasks)? [Completeness, Spec §FR-017]
- [x] CHK012 - Указан ли endpoint создания задачи (POST /boards/:boardId/tasks)? [Completeness, Spec §FR-014]
- [x] CHK013 - Указан ли endpoint получения задачи (GET /tasks/:id)? [Completeness, Spec §FR-020]
- [x] CHK014 - Указан ли endpoint обновления задачи (PATCH/PUT /tasks/:id)? [Completeness, Spec §FR-018]
- [x] CHK015 - Указан ли endpoint удаления задачи (DELETE /tasks/:id)? [Completeness, Spec §FR-019]

---

## Полнота контракта запроса

### Запросы аутентификации

- [x] CHK018 - Указано ли тело запроса регистрации (поля username, password)? [Gap, Request Contract]
- [x] CHK019 - Указано ли тело запроса входа (поля username, password)? [Gap, Request Contract]
- [x] CHK020 - Указаны ли правила валидации запроса для endpoint'ов аутентификации? [Completeness, Spec §FR-003/FR-029]

### Запросы досок

- [x] CHK021 - Указано ли тело запроса создания доски (поля title, description)? [Clarity, Spec §FR-007]
- [x] CHK022 - Указаны ли типы полей доски (string для title/description)? [Clarity, Gap]
- [x] CHK023 - Указаны ли лимиты длины полей доски (макс. длина)? [Clarity, Spec §FR-025/FR-028]

### Запросы задач

- [x] CHK025 - Указано ли тело запроса создания задачи (title, description, status, priority)? [Clarity, Spec §FR-014/FR-015/FR-015a]
- [x] CHK027 - Указаны ли лимиты длины полей задачи? [Clarity, Spec §FR-026/FR-028]
- [x] CHK028 - Указано ли тело запроса обновления задачи (какие поля обновляемы)? [Clarity, Spec §FR-018]

---

## Полнота контракта ответа

### Успешные ответы

- [x] CHK029 - Указаны ли форматы успешных ответов (200, 201)? [Gap, Response Contract]
- [x] CHK030 - Указан ли ответ успешной аутентификации (структура токена)? [Clarity, Spec §FR-004]
- [x] CHK031 - Указаны ли форматы ответов ресурсов (объект доски, объект задачи)? [Gap, Response Contract]
- [x] CHK032 - Указаны ли форматы ответов списка (массив с пагинацией)? [Gap, Response Contract]
- [x] CHK033 - Указаны ли все имена полей ответа (id, title, description, status и т.д.)? [Completeness, Gap]

### Ответы об ошибках

- [x] CHK035 - Указан ли ответ ошибки валидации (статус 400)? [Completeness, Spec §FR-003]
- [x] CHK036 - Указан ли ответ ошибки аутентификации (статус 401)? [Completeness, Spec §FR-002/FR-006]
- [x] CHK037 - Указан ли ответ ошибки авторизации (статус 403)? [Completeness, Spec §FR-012/FR-020]
- [x] CHK038 - Указан ли ответ ошибки not found (статус 404)? [Gap, Response Contract]
- [x] CHK040 - Указан ли ответ ошибки сервера (статус 500)? [Gap, Response Contract]

---

## Полнота HTTP методов и кодов статуса

- [x] CHK041 - Указаны ли HTTP методы для всех endpoint'ов (GET, POST, PATCH, DELETE)? [Gap, Contract]
- [x] CHK042 - Указаны ли коды успешного статуса (200, 201, 204)? [Gap, Contract]
- [x] CHK043 - Указаны ли коды ошибок для всех сценариев сбоя? [Completeness, Gap]
- [x] CHK044 - Уточнено ли использование PATCH vs PUT для обновлений? [Clarity, Gap]

---

## Полнота заголовков и метаданных

- [x] CHK046 - Указаны ли требования заголовков аутентификации (Authorization: Bearer)? [Gap, Headers]
- [x] CHK047 - Указаны ли заголовки content-type (application/json)? [Gap, Headers]
- [x] CHK048 - Указаны ли заголовки ответов (пагинация, rate limits)? [Gap, Headers]
- [x] CHK050 - Указаны ли заголовки CORS (Access-Control-Allow-Origin)? [Clarity, Spec §Assumptions]

---

## Полнота правил валидации

- [x] CHK051 - Указаны ли правила валидации username (длина, символы)? [Clarity, Spec §Assumptions-8]
- [x] CHK052 - Указано ли правило сложности пароля (8+ символов, 1 заглавная, 1 строчная, 1 цифра)? [Completeness, Spec §FR-029]
- [x] CHK053 - Указаны ли правила валидации названия доски (не пустое, макс. длина)? [Completeness, Spec §FR-025]
- [x] CHK054 - Указаны ли правила валидации названия задачи (не пустое, макс. длина)? [Completeness, Spec §FR-026]
- [x] CHK056 - Указана ли валидация существования доски (задача должна принадлежать существующей доске)? [Completeness, Spec §FR-027]

---

## Полнота enum и ограничений

- [x] CHK057 - Полностью ли указаны значения enum статуса задачи (BACKLOG, TODO, IN_PROGRESS, REVIEW, DONE)? [Completeness, Spec §FR-021]
- [x] CHK058 - Полностью ли указаны значения enum приоритета задачи (LOW, MEDIUM, HIGH, CRITICAL)? [Completeness, Spec §FR-021a]
- [x] CHK059 - Указаны ли ограничения переходов статуса (любой → любой)? [Completeness, Spec §FR-022]

---

## Контракт пагинации и фильтрации

- [x] CHK061 - Указаны ли параметры пагинации (page, pageSize или offset, limit)? [Gap, Contract]
- [x] CHK062 - Указаны ли заголовки ответа пагинации (X-Total-Count, X-Total-Pages)? [Gap, Contract]
- [x] CHK064 - Указаны ли параметры фильтрации (фильтры status, priority)? [Gap, Future Enhancement]
- [x] CHK065 - Указаны ли параметры поиска (q, titleContains)? [Gap, Future Enhancement]

---

## Контракт аутентификации и авторизации

- [x] CHK066 - Указан ли формат токена (структура JWT, claims)? [Clarity, Spec §Assumptions-2]
- [x] CHK067 - Указано ли истечение токена (время жизни access токена)? [Gap, Contract]
- [x] CHK068 - Указаны ли маркеры защищённых endpoint'ов (какие endpoint'ы требуют аутентификацию)? [Completeness, Spec §FR-005]
- [x] CHK069 - Указаны ли правила валидации владения (пользователь может получать доступ только к своим ресурсам)? [Completeness, Spec §FR-009/FR-012/FR-020]

---

## Контракт версионирования и эволюции

- [x] CHK071 - Указано ли версионирование API (префикс /api/v1/)? [Gap, Contract]

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
