import { useEffect, useState } from 'react';
import { AppPageBody, AppPageError, AppPageLoading } from '../layout/AppShell';
import { VehicleContextBanner } from '../layout/VehicleContextBanner';
import {
  COMPLIANCE_DOCUMENT_TYPES,
  COMPLIANCE_SAFETY_TYPES,
} from '../../constants/complianceItems';
import {
  getAvailableComplianceItemTypesByCategory,
  getComplianceItemsByVehicle,
  type ComplianceItemCategory,
} from '../../services/complianceItemService';
import { useDashboardRefreshStore } from '../../stores/dashboardRefreshStore';
import {
  COMPLIANCE_STATUS_STYLES,
  formatExpiryDate,
  getComplianceItemLabel,
  getComplianceItemStatus,
  getComplianceItemStatusLabel,
  getExpiryCountdownText,
  sortComplianceItemsByUrgency,
} from '../../utils/complianceDisplay';
import type { ComplianceItem } from '../../types';
import { TireTreadSection } from './TireTreadSection';

interface CompliancePageProps {
  userId: string;
  vehicleId: string;
  onAddItem: (category: ComplianceItemCategory) => void;
  onEditItem: (itemId: string) => void;
}

function ComplianceItemList({
  items,
  emptyMessage,
  onEditItem,
}: {
  items: ComplianceItem[];
  emptyMessage: string;
  onEditItem: (itemId: string) => void;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">{emptyMessage}</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const status = getComplianceItemStatus(item);
        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onEditItem(item.id)}
              className="w-full rounded-xl border border-slate-700/60 bg-slate-900/40 p-4 text-left transition-colors hover:border-pit-accent/40 hover:bg-slate-800/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-100">
                    {getComplianceItemLabel(item.type)}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Vence: {formatExpiryDate(item.expiryDate)}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">{getExpiryCountdownText(item)}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${COMPLIANCE_STATUS_STYLES[status]}`}
                >
                  {getComplianceItemStatusLabel(status)}
                </span>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function CompliancePage({
  userId,
  vehicleId,
  onAddItem,
  onEditItem,
}: CompliancePageProps) {
  const revision = useDashboardRefreshStore((state) => state.revision);

  const [items, setItems] = useState<ComplianceItem[]>([]);
  const [canAddDocument, setCanAddDocument] = useState(false);
  const [canAddSafety, setCanAddSafety] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [records, availableDocuments, availableSafety] = await Promise.all([
          getComplianceItemsByVehicle(vehicleId),
          getAvailableComplianceItemTypesByCategory(vehicleId, 'document'),
          getAvailableComplianceItemTypesByCategory(vehicleId, 'safety'),
        ]);

        if (cancelled) {
          return;
        }

        setItems(sortComplianceItemsByUrgency(records));
        setCanAddDocument(availableDocuments.length > 0);
        setCanAddSafety(availableSafety.length > 0);
        setIsLoaded(true);
      } catch {
        if (!cancelled) {
          setLoadError('No se pudo cargar el cumplimiento normativo.');
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [vehicleId, revision]);

  if (loadError) {
    return <AppPageError message={loadError} />;
  }

  if (!isLoaded) {
    return <AppPageLoading />;
  }

  const documentItems = items.filter((item) => COMPLIANCE_DOCUMENT_TYPES.includes(item.type));
  const safetyItems = items.filter((item) => COMPLIANCE_SAFETY_TYPES.includes(item.type));

  return (
    <AppPageBody>
      <VehicleContextBanner vehicleId={vehicleId} />

      <p className="mb-4 text-sm text-slate-400">
        Documentos, kit de seguridad y estado de llantas según normativa colombiana.
      </p>

      <TireTreadSection vehicleId={vehicleId} userId={userId} />

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Documentos
        </h2>
        <ComplianceItemList
          items={documentItems}
          emptyMessage="Registra SOAT, tecnomecánica o seguro todo riesgo."
          onEditItem={onEditItem}
        />
        {canAddDocument && (
          <button
            type="button"
            onClick={() => onAddItem('document')}
            className="mt-3 min-h-12 w-full rounded-lg border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-sm font-medium text-slate-200 hover:border-pit-accent/50 hover:bg-slate-800"
          >
            + Agregar documento
          </button>
        )}
      </section>

      <section>
        <div className="mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Kit de seguridad
          </h2>
          <p className="mt-1 text-xs text-slate-500">Botiquín y extintor (obligatorios en ruta)</p>
        </div>
        <ComplianceItemList
          items={safetyItems}
          emptyMessage="Registra botiquín y extintor para recibir alertas de vencimiento."
          onEditItem={onEditItem}
        />
        {canAddSafety && (
          <button
            type="button"
            onClick={() => onAddItem('safety')}
            className="mt-3 min-h-12 w-full rounded-lg border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-sm font-medium text-slate-200 hover:border-pit-accent/50 hover:bg-slate-800"
          >
            + Agregar elemento
          </button>
        )}
      </section>
    </AppPageBody>
  );
}
