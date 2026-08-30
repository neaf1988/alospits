# A Los Pits

PWA offline-first para gestionar carro o moto en Colombia: tanqueos, mantenimientos, cumplimiento normativo, impuestos y alertas en un solo lugar.

**Demo:** https://neaf1988.github.io/alospits/

## ¿Qué es?

¿Se te vence la tecno, el SOAT o el impuesto y te enteras tarde? **A Los Pits** centraliza todo lo de tu vehículo:

- Cuánto rinde y cuánto gastas por km
- Cuándo toca mantenimiento
- SOAT, tecnomecánica, extintor, kit de seguridad
- Impuesto vehicular y descuentos por pronto pago
- Pico y placa según tu ciudad
- Licencia de conducción según el tipo de vehículo

Funciona en el celular como app (PWA), guarda tus datos en el dispositivo y puedes respaldarlos cuando quieras. Sin señal también puedes consultar y registrar información.

## Para quién es

- Dueños de **carro o moto** en Colombia
- Quien quiere llevar el control sin Excel ni cuadernos
- Quien valora **privacidad** (datos locales, respaldo bajo tu control)

## Qué puedes hacer

| Área | Funciones |
|------|-----------|
| **Combustible** | Tanqueos, odómetro, rendimiento (km/gal) y costo por km |
| **Mantenimiento** | Historial, costos, taller y próximo servicio por km o fecha |
| **Cumplimiento** | SOAT, tecnomecánica, extintor, kit, llantas — con avisos |
| **Impuestos** | Impuesto departamental, vencimiento y pronto pago |
| **Movilidad** | Pico y placa (carros) y licencias A1–B3 |
| **Dashboard** | Odómetro, km/día, alertas y resumen de pendientes |
| **Respaldo** | Exportar / importar JSON para cambiar de teléfono |
| **PDF** | Hoja de vida del vehículo para trámites o venta |

Hasta **2 vehículos** por usuario con cambio de contexto inmediato.

## Desarrollo local

Requisitos: Node.js 22+

```bash
npm install
npm run dev
```

```bash
npm run build    # producción
npm run preview  # previsualizar build
npm run lint
npm run icons:generate
```

## Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · Dexie (IndexedDB) · Zustand · vite-plugin-pwa

## Licencia

Proyecto privado — uso personal del autor.
