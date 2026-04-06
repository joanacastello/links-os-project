# Links OS Project

Una experiencia web interactiva con estética de pantalla de inicio estilo smartphone para centralizar enlaces, proyectos y contenido personal en un solo lugar.

## Qué hace este proyecto

`links-os-project` es una landing interactiva construida con React + TypeScript + Vite que simula un sistema operativo móvil:

- Home con widgets y apps arrastrables (drag & drop).
- Navegación entre pantallas internas (`home`, `advent`, `vibe`, `zero2hero`, `onanem`).
- Dock social con accesos rápidos a perfiles públicos.
- Suscripción a newsletter mediante endpoint seguro (`/api/subscribe`) con validaciones, límite de peticiones y protección básica anti abuso.
- Integración con Sentry y Vercel Analytics.

Está pensado para creadoras/es y profesionales que quieren una “link in bio” más expresiva y con identidad visual propia.

## Stack técnico

- `React 19`
- `TypeScript`
- `Vite 8`
- `Tailwind CSS`
- `Vitest` (tests)
- `ESLint` (linting)
- `Vercel Functions` (API serverless en producción)

## Estructura rápida

- `src/`: interfaz principal y componentes de la app.
- `api/`: función serverless de newsletter (`subscribe.ts`).
- `server/`: lógica de seguridad, validaciones y conexión con Beehiiv.
- `docs/`: documentación operativa de seguridad.

## Requisitos

- Node.js 20+ (recomendado 22+)
- npm / pnpm / yarn

## Cómo ejecutarlo en local

1. Clona el repositorio:

```bash
git clone <URL_DEL_REPO>
cd links-os-project
```

2. Instala dependencias:

```bash
npm install
```

3. Crea tu archivo de entorno:

```bash
cp .env.example .env
```

4. Completa las variables necesarias en `.env`:

- `BEEHIIV_API_BASE`
- `BEEHIIV_API_KEY`
- `BEEHIIV_PUBLICATION_ID`
- `BEEHIIV_SUBSCRIBE_TAG`
- `BEEHIIV_UTM_SOURCE`
- `BEEHIIV_UTM_MEDIUM`
- `VITE_SA_COMMUNITY_URL`
- `VITE_SENTRY_DSN` (opcional)

5. Inicia el entorno de desarrollo:

```bash
npm run dev
```

## Scripts útiles

- `npm run dev`: arranca Vite en desarrollo.
- `npm run build`: compila TypeScript y genera build de producción.
- `npm run preview`: sirve la build localmente.
- `npm run lint`: ejecuta ESLint.
- `npm run test`: ejecuta tests con Vitest.

## Despliegue

El proyecto está preparado para desplegarse en Vercel:

- Frontend estático con Vite.
- Endpoint `/api/subscribe` como función serverless.
- Variables sensibles definidas en entorno de Vercel (nunca en cliente).

Flujo recomendado:

1. Subir repositorio a GitHub.
2. Importar proyecto en Vercel.
3. Configurar variables de entorno.
4. Desplegar.

## Personalización para otras personas

Si quieres reutilizar este proyecto para tu marca personal:

- Cambia enlaces del home en `src/components/HomeScreenGrid.tsx`.
- Actualiza enlaces del dock en `src/config/socialLinks.ts`.
- Sustituye iconos e imágenes en `public/`.
- Ajusta textos, nombres y labels en componentes (`LinkWidget`, pantallas de proyectos, etc.).
- Personaliza estilos y paleta en clases Tailwind.

## Seguridad y privacidad

Se incluyen guías prácticas para operación y cumplimiento:

- `docs/security-checklist.md`
- `docs/security-runbook.md`

Estas guías cubren validaciones, rate limiting, cabeceras de seguridad, respuesta ante incidentes y buenas prácticas RGPD.

## Contribuciones

Si detectas una mejora o bug:

1. Crea una rama.
2. Realiza cambios con pruebas/lint.
3. Abre un Pull Request describiendo el contexto.

## Licencia

Define aquí la licencia que quieras aplicar (`MIT`, `Apache-2.0`, etc.).
Si todavía no has decidido una, añade un archivo `LICENSE` antes de aceptar contribuciones externas.
