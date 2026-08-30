# Spec: Motor de Tanqueos, Odómetro e Indicadores

## 1. Fórmulas de Cálculo

### Rendimiento de Combustible (Km/Galón)
Solo se calcula cuando `isFullTank` es `true` en tanqueos consecutivos[cite: 1]:
$$Eficiencia = \frac{Odómetro_{Actual} - Odómetro_{Anterior}}{Galones_{Ingresados}}$$[cite: 1]

### Costo de Combustible por Kilómetro (COP/Km)
$$CostoKm = \frac{ValorTotalPagado}{Odómetro_{Actual} - Odómetro_{Anterior}}$$[cite: 1]

### Promedio de Kilometraje Diario Proyectado
$$KmDiarios = \frac{Odómetro_{Último} - Odómetro_{Primer\_Registro}}{Días_{Transcurridos}}$$[cite: 1]

## 2. Proyección de Mantenimientos Futuros
Con el promedio de $KmDiarios$, el sistema estima la fecha de llegada al próximo mantenimiento[cite: 1]:
$$DíasRestantes = \frac{KmObjetivoMantenimiento - Odómetro_{Actual}}{KmDiarios}$$[cite: 1]

## 3. Alertas de Anomalía Preventiva
Si la $Eficiencia$ ($\text{Km/Gal}$) cae más de un 15% en comparación con el promedio de los últimos 3 tanqueos llenos, la app genera una alerta de inspección preventiva (posible baja presión de aire en llantas o inyectores sucios)[cite: 1].