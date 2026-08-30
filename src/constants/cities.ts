export interface CityOption {
  code: string;
  name: string;
}

/** Ciudades principales para pico y placa y normativa local */
export const COLOMBIAN_CITIES: CityOption[] = [
  { code: 'BOG', name: 'Bogotá' },
  { code: 'MDE', name: 'Medellín' },
  { code: 'CLO', name: 'Cali' },
  { code: 'BAQ', name: 'Barranquilla' },
  { code: 'CTG', name: 'Cartagena' },
  { code: 'BGA', name: 'Bucaramanga' },
  { code: 'PEI', name: 'Pereira' },
  { code: 'MAN', name: 'Manizales' },
  { code: 'CUC', name: 'Cúcuta' },
  { code: 'IBG', name: 'Ibagué' },
  { code: 'VLL', name: 'Villavicencio' },
  { code: 'SMR', name: 'Santa Marta' },
];

export function getCityName(cityCode: string): string {
  return COLOMBIAN_CITIES.find((city) => city.code === cityCode)?.name ?? cityCode;
}
