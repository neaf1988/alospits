import { useState } from 'react';
import {
  VehicleLifeSheetServiceError,
  buildVehicleLifeSheet,
} from '../../services/vehicleLifeSheetService';
import { downloadVehicleLifeSheetPdf } from '../../utils/vehicleLifeSheetPdf';

interface VehicleLifeSheetExportButtonProps {
  vehicleId: string;
  className?: string;
}

export function VehicleLifeSheetExportButton({
  vehicleId,
  className,
}: VehicleLifeSheetExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setError(null);
    setIsExporting(true);

    try {
      const report = await buildVehicleLifeSheet(vehicleId);
      await downloadVehicleLifeSheetPdf(report);
    } catch (err) {
      setError(
        err instanceof VehicleLifeSheetServiceError
          ? err.message
          : 'No se pudo generar la hoja de vida.',
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => void handleExport()}
        disabled={isExporting}
        className="min-h-12 w-full rounded-lg border border-pit-accent/40 bg-pit-accent/10 px-4 py-2.5 text-sm font-semibold text-pit-accent transition-colors hover:bg-pit-accent/20 disabled:opacity-50"
      >
        {isExporting ? 'Generando PDF…' : 'Descargar hoja de vida (PDF)'}
      </button>
      {error && (
        <p className="mt-2 text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
