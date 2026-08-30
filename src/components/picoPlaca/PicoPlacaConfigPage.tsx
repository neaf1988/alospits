import { useEffect, useState } from 'react';
import { AppPageBody, AppPageError, AppPageLoading } from '../layout/AppShell';
import { BottomActions } from '../layout/BottomActions';
import { COLOMBIAN_CITIES, getCityName } from '../../constants/cities';
import { getAllPicoPlacaSchedules } from '../../services/picoPlacaService';
import { useDashboardRefreshStore } from '../../stores/dashboardRefreshStore';
import { getScheduleStatusLabel, getScheduleSummary } from '../../utils/picoPlacaUtils';
import { getVehicleTypeLabel } from '../../utils/vehicleDisplay';
import type { PicoPlacaSchedule, VehicleType } from '../../types';

interface PicoPlacaConfigPageProps {
  onAddSchedule: () => void;
  onEditSchedule: (scheduleId: string) => void;
}

export function PicoPlacaConfigPage({ onAddSchedule, onEditSchedule }: PicoPlacaConfigPageProps) {
  const revision = useDashboardRefreshStore((state) => state.revision);
  const [schedules, setSchedules] = useState<PicoPlacaSchedule[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const records = await getAllPicoPlacaSchedules();
        if (!cancelled) {
          setSchedules(records);
          setIsLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setLoadError('No se pudieron cargar las configuraciones.');
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [revision]);

  if (loadError) {
    return <AppPageError message={loadError} />;
  }

  if (!isLoaded) {
    return <AppPageLoading />;
  }

  const grouped = COLOMBIAN_CITIES.map((city) => ({
    city,
    items: (['CAR', 'MOTORCYCLE'] as VehicleType[])
      .map((vehicleType) =>
        schedules.find(
          (schedule) => schedule.cityCode === city.code && schedule.vehicleType === vehicleType,
        ),
      )
      .filter((schedule): schedule is PicoPlacaSchedule => Boolean(schedule)),
  })).filter((group) => group.items.length > 0);

  const unlisted = schedules.filter(
    (schedule) => !COLOMBIAN_CITIES.some((city) => city.code === schedule.cityCode),
  );

  return (
    <AppPageBody
      footer={
        <BottomActions>
          <button
            type="button"
            onClick={onAddSchedule}
            className="min-h-12 w-full rounded-lg bg-pit-accent px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-pit-accent-muted"
          >
            + Nueva configuración
          </button>
        </BottomActions>
      }
    >
      <p className="mb-4 text-sm text-slate-400">
        Define por ciudad y tipo de vehículo qué días aplican restricción y a qué dígitos de placa.
        Algunas ciudades no tienen pico y placa para motos.
      </p>

      {schedules.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-600 bg-slate-900/40 p-4 text-center">
          <p className="text-sm font-medium text-slate-200">Sin configuraciones</p>
          <p className="mt-1 text-xs text-slate-400">
            Crea el calendario de pico y placa para las ciudades donde circulas.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ city, items }) => (
            <section key={city.code}>
              <h2 className="mb-2 text-sm font-semibold text-pit-accent-muted">{city.name}</h2>
              <ul className="space-y-2">
                {items.map((schedule) => (
                  <li key={schedule.id}>
                    <ScheduleCard schedule={schedule} onEdit={() => onEditSchedule(schedule.id)} />
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {unlisted.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-pit-accent-muted">Otras ciudades</h2>
              <ul className="space-y-2">
                {unlisted.map((schedule) => (
                  <li key={schedule.id}>
                    <ScheduleCard schedule={schedule} onEdit={() => onEditSchedule(schedule.id)} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </AppPageBody>
  );
}

function ScheduleCard({
  schedule,
  onEdit,
}: {
  schedule: PicoPlacaSchedule;
  onEdit: () => void;
}) {
  const status = getScheduleStatusLabel(schedule);
  const isActive = schedule.enabled && schedule.dayRules.length > 0;

  return (
    <button
      type="button"
      onClick={onEdit}
      className="w-full rounded-xl border border-slate-700/60 bg-pit-surface p-4 text-left transition-colors hover:border-pit-accent/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-slate-100">
            {getCityName(schedule.cityCode)} · {getVehicleTypeLabel(schedule.vehicleType)}
          </p>
          <p className="mt-1 text-xs text-slate-400">{getScheduleSummary(schedule)}</p>
        </div>
        <span
          className={[
            'shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ring-1',
            isActive
              ? 'bg-emerald-500/15 text-emerald-200 ring-emerald-500/30'
              : 'bg-slate-800 text-slate-400 ring-slate-600',
          ].join(' ')}
        >
          {status}
        </span>
      </div>
    </button>
  );
}
