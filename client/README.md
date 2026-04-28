# Projex — клієнт

React (Vite) + TypeScript + Tailwind CSS + TanStack React Query. Архітектура зібрана за зразком [VKormylo/linkumo](https://github.com/VKormylo/linkumo): сервісний шар поверх axios (`baseService` + `authService`), path-alias `~`, `react-hook-form` + `zodResolver`, контекст авторизації з інтерсепторами, роутер на `createBrowserRouter` з лоадером `authCheck`.

## Структура `src/`

```
components/          # перевикористовувані UI-компоненти (button, form-input, checkbox, radio-group, svg, auth-*)
constants/           # константи запитів (URLs.auth.*)
context/             # AuthProvider + useAuthContext
exceptions/          # ResponseError
pages/               # сторінки (auth/Auth, auth/auth-login, auth/auth-signup, home, main-container)
plugins/             # axiosClient (baseURL + request interceptor на токен зі сховища)
router/              # router.tsx + loaders/authCheck
schemas/             # zod-схеми (user, auth)
services/            # base-service + auth-service
types/               # common.types, auth.types
utils/               # auth-storage
```

## Вимоги

- Node.js 20+
- Окремо запущений бекенд з каталогу `../server` (`npm run dev` там), за замовчуванням `http://localhost:8000`

## Встановлення

```bash
npm install
```

## Змінні середовища

Скопіюйте `.env.example` у `.env`.

- **`VITE_API_BASE_PATH`** — базовий шлях API для axios (за замовчуванням `/api`). У dev-режимі Vite проксує `/api` на `http://localhost:8000` (див. `vite.config.ts`). Для продакшену задайте повний URL, напр. `https://api.example.com/api`.

## Розробка

```bash
npm run dev
# або
npm start
```

Відкрийте URL з консолі (зазвичай `http://localhost:5173`).

## Збірка

```bash
npm run build
```

## Маршрути

- `/auth/login` — вхід
- `/auth/signup` — реєстрація
- `/` — головний екран (захищений `authCheck` лоадером)

## API-потік

1. `pages/auth/auth-signup/AuthSignup.tsx` та `pages/auth/auth-login/AuthLogin.tsx` використовують `useMutation` з TanStack Query та викликають методи `authService.signup` / `authService.login`.
2. `authService` делегує запити до `baseService.request<T>({ method, url, data })`, який:
   - шле запит через спільний `axiosClient`;
   - розгортає `response.data.data` у типізований результат;
   - мапить помилки сервера (`{ status, message }`) у `ResponseError`.
3. `axiosClient` додає `Authorization: Bearer <token>` з `localStorage`/`sessionStorage` для будь-якого запиту.
4. `AuthProvider` слідкує за 401 (інтерсептор відповіді) та очищає токен/стан.
5. `authCheck` у лоадері перевіряє `/auth/me` перед рендером захищених маршрутів; `guestOnly` — навпаки, вже авторизованих веде з `/auth` на `/`.
