![CI](https://github.com/Mario-Meza/backend_internet_routes/actions/workflows/ci.yml/badge.svg)
# Rutas Digitales — Frontend Web

Aplicación web para la gestión, asignación y seguimiento en tiempo real de cuadrillas técnicas en campo (instalaciones de fibra óptica, enlaces wireless y soporte).

> **Backend asociado:** [`backend_internet_routes`](https://github.com/Mario-Meza/backend_internet_routes) (FastAPI + MongoDB + WebSockets + Cloudinary).

## Características principales

- **Panel Administrativo:** Dashboard con tarjetas de métricas animadas en SVG, control de rutas (`assigned` → `in_progress` → `completed` / `canceled`), administración de técnicos con carga de fotos y directorio de clientes.
- **Módulo de Clientes en React:** Búsqueda instantánea, filtros por estado, paginación y modales accesibles (`role="dialog"`, soporte de teclado) integrados con `@astrojs/react`.
- **Panel Móvil para Técnicos (`/panel`):** Interfaz optimizada para trabajo en campo con hoja de ruta paso a paso, inicio/cierre de servicios y registro de observaciones técnicas.
- **Sincronización en tiempo real:** Conexión WebSocket autenticada con JWT que notifica al técnico mediante toasts no bloqueantes cuando la oficina asigna, modifica o cancela servicios.
- **Seguridad y contratos estrictos:** Tipado estricto en TypeScript alineado con Pydantic, escape centralizado contra XSS y cierre automático de sesión ante respuestas `401`.

## Stack Tecnológico

- **Framework:** Astro + React (`@astrojs/react`)
- **Lenguaje:** TypeScript (`strict`)
- **Estilos:** Tailwind CSS
- **Testing y Calidad:** Vitest, Testing Library, ESLint y GitHub Actions CI

## Estructura del proyecto

```text
src/
├── components/
│   ├── customers/     # Módulo interactivo de clientes (React + TSX)
│   ├── dashboard/     # Tarjetas SVG, tabla y modales del panel principal
│   └── Sidebar.astro
├── hooks/             # Custom hooks de React (useCustomers)
├── layouts/           # Layout base, control de roles y cliente WebSocket
├── pages/             # Rutas de Astro (admin, técnicos, clientes, login y /panel)
├── scripts/           # Lógica modular de vistas interactivas
├── services/          # Cliente HTTP centralizado (api.ts)
├── types/             # Contratos TypeScript sincronizados con FastAPI
└── utils/             # Manejo de JWT (auth.ts) y formateo/toasts (format.ts)