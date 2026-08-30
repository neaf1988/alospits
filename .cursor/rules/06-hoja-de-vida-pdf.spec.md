# Spec: Generación de Hoja de Vida en PDF

## 1. Propósito
Permitir al usuario exportar el expediente completo del vehículo en formato PDF estructurado para peritajes o trámites de compraventa[cite: 1].

## 2. Contenido del Reporte
1. **Encabezado del Vehículo:** Placa, Marca, Línea, Modelo, Ciudad de registro y Kilometraje actual[cite: 1].
2. **Resumen Financiero Consolidado:**
   - Inversión acumulada en Mantenimientos (COP)[cite: 1].
   - Gasto acumulado en Combustible (COP)[cite: 1].
   - Gasto acumulado en Impuestos y Documentos Legales (COP)[cite: 1].
   - **Costo Total por Kilómetro (CPK Global)**[cite: 1].
3. **Historial de Mantenimientos:** Tabla cronológica con Fecha, Kilometraje, Trabajo realizado, Repuestos/Detalles, Taller y Costo[cite: 1].
4. **Estado de Cumplimiento Legal:** Estado actual del SOAT, Tecnomecánica, Impuestos, Extintor y Botiquín[cite: 1].

## 3. Renderizado Client-Side
La compilación del archivo PDF se realiza localmente en el navegador mediante `jsPDF` y `html2canvas`[cite: 1]. Esto permite descargar el expediente completo de la Hoja de Vida sin depender de un servidor backend ni conexión a internet[cite: 1].