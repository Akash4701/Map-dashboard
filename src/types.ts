// Types and interfaces for the polygon drawing system

export interface ThresholdRule {
  id: string;
  operator: '<' | '<=' | '=' | '>=' | '>';
  value: number;
  color: string;
}

export interface DataSource {
  id: string;
  name: string;
  displayName: string;
}

export interface PolygonData {
  id: string;
  layer: any; // Leaflet layer
  dataSource: DataSource | null;
  thresholdRules: ThresholdRule[];
  currentValue?: number;
  currentColor?: string;
  label?: string;
}

export interface WeatherData {
  temperature_2m: number;
  humidity_2m: number;
}

export const DATA_SOURCES: DataSource[] = [
  { id: 'temperature_2m', name: 'temperature_2m', displayName: 'Temperature (°C)' },
  { id: 'humidity_2m', name: 'humidity_2m', displayName: 'Humidity (%)' },
];

export const DEFAULT_THRESHOLD_RULES: ThresholdRule[] = [
  { id: '1', operator: '<', value: 10, color: '#dc2626' }, // Red
  { id: '2', operator: '>=', value: 10, color: '#2563eb' }, // Blue  
  { id: '3', operator: '>=', value: 25, color: '#16a34a' }, // Green
];
