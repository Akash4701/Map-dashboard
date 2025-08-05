import { createContext, useState } from 'react';
import type { ReactNode } from 'react';

// Define the shape of a polygon
export interface Polygon {
  id: string;
  points: { lat: number; lng: number }[];
  dataSource: string;
  value?: number;
  color?: string;
  label?: string;
}

// Define the shape of a threshold rule
export interface ThresholdRule {
  operator: '<' | '<=' | '=' | '>=' | '>';
  value: number;
  color: string;
}

// Define time range interface
export interface TimeRange {
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
}

// Define the shape of the global state
export interface AppState {
  polygons: Polygon[];
  dataSources: string[];
  thresholdRules: ThresholdRule[];
  selectedPolygonId?: string;
  timeRange: TimeRange;
}

export interface AppContextType extends AppState {
  addPolygon: (polygon: Polygon) => void;
  deletePolygon: (polygonId: string) => void;
  updatePolygon: (polygon: Polygon) => void;
  setThresholdRules: (rules: ThresholdRule[]) => void;
  setSelectedPolygon: (polygonId?: string) => void;
  setTimeRange: (timeRange: TimeRange) => void;
  evaluateThresholds: () => void;
}

// Create the context
export const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper function to get date range for 30 days (15 days before and after today)
const getInitialTimeRange = (): TimeRange => {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 15);
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 15);
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
};

// Create the provider component
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [polygons, setPolygons] = useState<Polygon[]>([]);
  const [dataSources] = useState<string[]>(['temperature_2m', 'relativehumidity_2m']);
  const [thresholdRules, setThresholdRules] = useState<ThresholdRule[]>([]);
  const [selectedPolygonId, setSelectedPolygonId] = useState<string | undefined>(undefined);
  const [timeRange, setTimeRange] = useState<TimeRange>(getInitialTimeRange());

  const addPolygon = (polygon: Polygon) => {
    setPolygons((prev) => [...prev, polygon]);
  };

  const deletePolygon = (polygonId: string) => {
    setPolygons((prev) => prev.filter((p) => p.id !== polygonId));
  };

  const updatePolygon = (updatedPolygon: Polygon) => {
    setPolygons((prev) =>
      prev.map((p) => (p.id === updatedPolygon.id ? updatedPolygon : p))
    );
  };

  const setSelectedPolygon = (polygonId?: string) => {
    setSelectedPolygonId(polygonId);
  };

  const evaluateThresholds = () => {
    const updatedPolygons = polygons.map((polygon) => {
      if (polygon.value === undefined) {
        return polygon;
      }

      // Find the first matching rule (rules are evaluated in order)
      const matchedRule = thresholdRules.find((rule) => {
        switch (rule.operator) {
          case '<':
            return polygon.value! < rule.value;
          case '<=':
            return polygon.value! <= rule.value;
          case '=':
            return polygon.value! === rule.value;
          case '>=':
            return polygon.value! >= rule.value;
          case '>':
            return polygon.value! > rule.value;
          default:
            return false;
        }
      });

      return {
        ...polygon,
        color: matchedRule ? matchedRule.color : '#3388ff', // Default color if no rule matches
      };
    });

    setPolygons(updatedPolygons);
  };

  const contextValue: AppContextType = {
    polygons,
    dataSources,
    thresholdRules,
    selectedPolygonId,
    timeRange,
    addPolygon,
    deletePolygon,
    updatePolygon,
    setThresholdRules,
    setSelectedPolygon,
    setTimeRange,
    evaluateThresholds,
  };

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};