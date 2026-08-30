import type { VehicleLifeSheetReport } from '../types/vehicleLifeSheet';
import {
  buildLifeSheetFilename,
  formatCopAmount,
  formatCpk,
} from './vehicleLifeSheetData';
import { formatOdometer, formatPlate } from './vehicleDisplay';

const PAGE_MARGIN = 14;
const CONTENT_WIDTH = 182;

function formatGeneratedAt(isoDate: string): string {
  return new Date(isoDate).toLocaleString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function addSectionTitle(
  doc: import('jspdf').jsPDF,
  title: string,
  y: number,
): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text(title, PAGE_MARGIN, y);
  doc.setDrawColor(148, 163, 184);
  doc.line(PAGE_MARGIN, y + 2, PAGE_MARGIN + CONTENT_WIDTH, y + 2);
  return y + 8;
}

function addKeyValueBlock(
  doc: import('jspdf').jsPDF,
  rows: [string, string][],
  startY: number,
): number {
  doc.setFontSize(10);
  let y = startY;

  for (const [label, value] of rows) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(`${label}:`, PAGE_MARGIN, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(value, PAGE_MARGIN + 42, y);
    y += 6;
  }

  return y + 4;
}

type AutoTableDoc = import('jspdf').jsPDF & { lastAutoTable?: { finalY: number } };

async function renderVehicleLifeSheetPdf(report: VehicleLifeSheetReport) {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const autoTable = autoTableModule.default;

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const { vehicle, financialSummary } = report;

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(248, 250, 252);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Hoja de Vida del Vehículo', PAGE_MARGIN, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('A Los Pits · Expediente offline', PAGE_MARGIN, 19);
  doc.text(`Generado: ${formatGeneratedAt(report.generatedAt)}`, PAGE_MARGIN, 24);

  let y = 38;
  y = addSectionTitle(doc, '1. Encabezado del vehículo', y);
  y = addKeyValueBlock(doc, [
    ['Placa', formatPlate(vehicle.plate)],
    ['Marca / Línea', report.displayName],
    ['Modelo', String(vehicle.modelYear)],
    ['Tipo', report.vehicleTypeLabel],
    ['Ciudad', report.cityName],
    ['Kilometraje', formatOdometer(vehicle.currentOdometerKm)],
  ], y);

  y = addSectionTitle(doc, '2. Resumen financiero consolidado', y);
  y = addKeyValueBlock(doc, [
    ['Mantenimientos', formatCopAmount(financialSummary.maintenanceTotalCop)],
    ['Combustible', formatCopAmount(financialSummary.fuelTotalCop)],
    ['Impuestos pagados', formatCopAmount(financialSummary.taxTotalCop)],
    ['Documentos legales', formatCopAmount(financialSummary.complianceTotalCop)],
    ['Inversión total', formatCopAmount(financialSummary.totalInvestmentCop)],
    [
      'Km recorridos (est.)',
      financialSummary.kmTraveled !== null
        ? `${financialSummary.kmTraveled.toLocaleString('es-CO')} km`
        : '—',
    ],
    ['CPK global', formatCpk(financialSummary.globalCpkCop)],
  ], y);

  y = addSectionTitle(doc, '3. Historial de mantenimientos', y);

  if (report.maintenanceRows.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('Sin mantenimientos registrados.', PAGE_MARGIN, y);
    y += 10;
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
      head: [['Fecha', 'Km', 'Trabajo', 'Detalle', 'Taller', 'Costo']],
      body: report.maintenanceRows.map((row) => [
        row.serviceDate,
        row.odometerKm.toLocaleString('es-CO'),
        row.title,
        row.details,
        row.workshopName,
        formatCopAmount(row.costCop),
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [30, 41, 59], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 16 },
        2: { cellWidth: 28 },
        3: { cellWidth: 42 },
        4: { cellWidth: 28 },
        5: { cellWidth: 22, halign: 'right' },
      },
    });
    y = (doc as AutoTableDoc).lastAutoTable?.finalY ?? y;
    y += 8;
  }

  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  y = addSectionTitle(doc, '4. Estado de cumplimiento legal', y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Impuestos: ${report.taxStatusSummary}`, PAGE_MARGIN, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    head: [['Elemento', 'Estado', 'Vencimiento']],
    body: report.complianceRows.map((row) => [row.label, row.statusLabel, row.expiryLabel]),
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 45 },
      2: { cellWidth: 40 },
    },
  });

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `A Los Pits · Hoja de vida · ${formatPlate(vehicle.plate)} · Pág. ${page}/${pageCount}`,
      PAGE_MARGIN,
      287,
    );
  }

  return doc;
}

export async function downloadVehicleLifeSheetPdf(report: VehicleLifeSheetReport): Promise<void> {
  const doc = await renderVehicleLifeSheetPdf(report);
  doc.save(buildLifeSheetFilename(report.vehicle.plate));
}

/** Reservado para plantillas visuales enriquecidas (spec: html2canvas). */
export async function renderHtmlSnippetToCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
  const { default: html2canvas } = await import('html2canvas');
  return html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
    logging: false,
  });
}
