# Spec: Reglas Normativas Colombianas y Alertas

## Matriz de Reglas y Normatividad

| Elemento / Documento | Criterio de Control | Regla / Normativa Colombia |
| :--- | :--- | :--- |
| **Licencia de Conducción** | Vencimiento por Categoría (A1/A2 vs B1/B2/B3) | Días de anticipación según fecha de vencimiento configurada en el perfil[cite: 1]. |
| **Botiquín de Primeros Auxilios** | 1 única fecha global de vencimiento | Artículo 30 del Código Nacional de Tránsito. Controla la fecha del elemento que vence más pronto[cite: 1]. |
| **Extintor** | Fecha de recarga anual (12 meses) | Control de recarga obligatorio para automóviles y camionetas[cite: 1]. |
| **Llantas / Neumáticos** | Profundidad de labrado (mm) | Resolución 1080/2019. Alerta cuando la profundidad sea $\le 1.6\text{ mm}$[cite: 1]. |
| **SOAT & Tecnomecánica** | Fecha de vencimiento anual | Días de vigencia. Vehículos nuevos: Tecno a los 5 años (motos a los 2 años)[cite: 1]. |
| **Impuestos Vehiculares** | Fecha límite, costo y pronto pago | Registro de vencimiento del Impuesto Departamental y Semaforización con descuento de pronto pago[cite: 1]. |
| **Pico y Placa** | Día de restricción por último dígito de placa | Push Notification diaria a las 6:00 AM según la ciudad asignada al vehículo (`cityCode`)[cite: 1]. |

## Calendario de Alertas Push
Las alertas se disparan en los siguientes intervalos previos a la fecha límite: **30 días, 15 días, 5 días y 1 día antes**[cite: 1].