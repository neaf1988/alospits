# Spec: Arquitectura del Sistema y Capacidades PWA

## 1. Propósito General
Aplicación Web Progresiva (PWA) Offline-First para la gestión operativa, financiera y legal de vehículos particulares (carros y motos) en Colombia. Permite administrar hasta 2 vehículos simultáneamente con cambio de contexto inmediato.

## 2. Tech Stack
- **Frontend Framework:** Vue 3 (Composition API) / React / Svelte.
- **State Management:** Pinia / Zustand con persistencia en LocalStorage del estado de vehículo activo[cite: 1].
- **Local Database:** IndexedDB gestionado con `Dexie.js` para persistencia Offline-First[cite: 1].
- **Service Workers:** Workbox CLI. Estrategia `Stale-While-Revalidate` para datos dinámicos y `Cache-First` para assets estáticos[cite: 1].
- **Generación de Reportes:** `jsPDF` y `html2canvas` para renderizado client-side[cite: 1].

## 3. Capacidades PWA
- **Modo Offline:** Registro y consulta de tanqueos, mantenimientos y fechas en IndexedDB sin cobertura móvil[cite: 1].
- **Background Sync:** Cola de peticiones vía Workbox SyncQueue que sincroniza con la API al recuperar internet[cite: 1].
- **Push Notifications:** Alertas programadas vía Web Push API (Service Workers + VAPID Keys) para Pico y Placa y vencimiento de documentos[cite: 1].
- **Instalabilidad:** Web App Manifest (`manifest.json`) configurado en modo `standalone` con iconos adaptativos[cite: 1].