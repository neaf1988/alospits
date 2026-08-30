# Spec: Selector de Vehículo y Gestión de Contexto

## 1. Comportamiento en Interfaz
- El Top Bar del sistema incluye un desplegable/toggle para cambiar de vehículo activo con 1 solo toque[cite: 1].
- Al conmutar de vehículo, el `activeVehicleId` cambia globalmente y todas las vistas (Dashboard, Historial, Alertas, Gastos) refrescan sus datos instantáneamente[cite: 1].

## 2. Matriz de Estados del Usuario

| Cantidad de Vehículos | Acción UI Disponible | Comportamiento |
| :--- | :--- | :--- |
| **0 Vehículos** | Crear Vehículo 1 | Pantalla de Onboarding forzada[cite: 1]. |
| **1 Vehículo** | Crear Vehículo 2 / Seleccionar V1 | Muestra el vehículo actual y botón para registrar el segundo[cite: 1]. |
| **2 Vehículos** | Conmutar V1 ↔ V2 | Muestra un selector/toggle para alternar entre ambos. Oculta la opción de crear más vehículos[cite: 1]. |

## 3. Flujo de Persistencia
1. Al iniciar la app, se lee `UserProfile.activeVehicleId` desde IndexedDB[cite: 1].
2. Si no se encuentra seleccionado ninguno, toma por defecto el ID del primer vehículo registrado[cite: 1].
3. Cualquier cambio en la selección persiste localmente en IndexedDB y LocalStorage[cite: 1].