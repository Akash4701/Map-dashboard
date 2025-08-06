import { useContext, useEffect, useRef, useState } from 'react';
import { MapContainer, Polygon, TileLayer, Tooltip } from 'react-leaflet';
import { AppContext } from '../context/PolygonContext';
import LeafletDrawControl from './LeafletDrawController';
import { fetchTemperature } from '../utils/fetchWeather';
import L from 'leaflet';

const ReactMap = () => {
  const { 
    polygons, 
    updatePolygon, 
    setThresholdRules, 
    thresholdRules, 
    evaluateThresholds,
    timeRange 
  } = useContext(AppContext)!;
  
  const fetchingRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<string>('');
  const [fetchProgress, setFetchProgress] = useState(0);

  useEffect(() => {
    // Set enhanced default threshold rules with better colors
    setThresholdRules([
      { operator: '<', value: 0, color: '#1e40af' },      // Deep blue for freezing
      { operator: '>=', value: 0, color: '#06b6d4' },     // Cyan for cold
      { operator: '>=', value: 10, color: '#10b981' },    // Green for mild
    ]);
  }, [setThresholdRules]);

  // Get all data points for a polygon (center + vertices)
  const getDataPointsForPolygon = (polygon: any) => {
    const dataPoints = [];
    
    // Add center point
    const bounds = L.polygon(polygon.points).getBounds();
    const center = bounds.getCenter();
    dataPoints.push({
      lat: center.lat,
      lng: center.lng,
      type: 'center'
    });
    
    // Add vertex points
    polygon.points.forEach((point: [number, number], index: number) => {
      dataPoints.push({
        lat: point[0],
        lng: point[1],
        type: 'vertex',
        index
      });
    });
    
    return dataPoints;
  };

  const fetchDataForPolygons = async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setIsLoading(true);
    setFetchProgress(0);

    try {
      const polygonsToUpdate = polygons.filter(p => p.dataSource);
      
      // Calculate total operations (center + vertices for each polygon)
      const totalOperations = polygonsToUpdate.reduce((acc, polygon) => {
        const dataPoints = getDataPointsForPolygon(polygon);
        return acc + dataPoints.length;
      }, 0);

      if (totalOperations === 0) {
        setIsLoading(false);
        fetchingRef.current = false;
        return;
      }

      let completedOperations = 0;

      const updatePromises = polygonsToUpdate.map(async (polygon) => {
        try {
          const dataPoints = getDataPointsForPolygon(polygon);
          
          console.log(`Fetching data for polygon ${polygon.id} from ${dataPoints.length} points (1 center + ${dataPoints.length - 1} vertices)`);

          // Fetch data for all points (center + vertices)
          const pointPromises = dataPoints.map(async (point) => {
            try {
              const value = await fetchTemperature(
                point.lat,
                point.lng,
                polygon.dataSource!,
                new Date(timeRange.startDate).getTime(),
                new Date(timeRange.endDate).getTime()
              );
              
              completedOperations++;
              setFetchProgress((completedOperations / totalOperations) * 100);
              
              console.log(`${point.type} point (${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}): ${value}`);
              
              return { point, value };
            } catch (error) {
              console.error(`Error fetching data for ${point.type} point:`, error);
              completedOperations++;
              setFetchProgress((completedOperations / totalOperations) * 100);
              return { point, value: null };
            }
          });

          const results = await Promise.all(pointPromises);
          const validResults = results.filter(r => r.value !== null);
          
          if (validResults.length > 0) {
            // Calculate average of all valid points (center + vertices)
            const values = validResults.map(r => r.value!);
            const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;
            const minValue = Math.min(...values);
            const maxValue = Math.max(...values);
            
            const unit = polygon.dataSource === 'temperature_2m' ? '°C' : 
                        polygon.dataSource === 'relativehumidity_2m' ? '%' : '';
            
            const centerResult = validResults.find(r => r.point.type === 'center');
            const vertexResults = validResults.filter(r => r.point.type === 'vertex');
            
            console.log(`Polygon ${polygon.id} results:`);
            console.log(`- Center: ${centerResult?.value || 'N/A'}`);
            console.log(`- Vertices: ${vertexResults.map(r => r.value).join(', ')}`);
            console.log(`- Average: ${avgValue.toFixed(2)}`);
            
            const label = `${polygon.dataSource!.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${avgValue.toFixed(1)}${unit} (${validResults.length} points)`;
            
            updatePolygon({ 
              ...polygon, 
              value: avgValue, 
              label,
              additionalData: {
                totalPoints: validResults.length,
                centerValue: centerResult?.value,
                vertexValues: vertexResults.map(r => r.value),
                minValue,
                maxValue,
                allValues: values
              }
            });
          }

          return true;
        } catch (error) {
          console.error(`Error fetching data for polygon ${polygon.id}:`, error);
          return false;
        }
      });

      await Promise.all(updatePromises);
      setLastFetchTime(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error fetching polygon data:', error);
    } finally {
      setIsLoading(false);
      setFetchProgress(0);
      fetchingRef.current = false;
    }
  };

  // Fetch data when time range changes or when polygons with data sources are added
  useEffect(() => {
    const polygonsWithDataSource = polygons.filter(p => p.dataSource);
    if (polygonsWithDataSource.length > 0) {
      fetchDataForPolygons();
    }
  }, [timeRange, polygons.map(p => p.dataSource).join(',')]);

  // Evaluate thresholds when data or rules change
  useEffect(() => {
    if (thresholdRules.length > 0 && polygons.some(p => p.value !== undefined)) {
      evaluateThresholds();
    }
  }, [thresholdRules, polygons.map(p => p.value).join(',')]);

  // Enhanced polygon styling based on data availability and loading state
  const getPolygonStyle = (polygon: any) => {
    const baseStyle = {
      weight: 2,
      opacity: 1,
      fillOpacity: 0.4,
    };

    if (isLoading && polygon.dataSource) {
      return {
        ...baseStyle,
        color: '#6b7280',
        fillColor: '#6b7280',
        dashArray: '5, 5',
        fillOpacity: 0.2,
      };
    }

    if (polygon.color) {
      return {
        ...baseStyle,
        color: polygon.color,
        fillColor: polygon.color,
        fillOpacity: 0.5,
      };
    }

    if (polygon.dataSource && polygon.value === undefined) {
      return {
        ...baseStyle,
        color: '#f59e0b',
        fillColor: '#f59e0b',
        fillOpacity: 0.3,
      };
    }

    return {
      ...baseStyle,
      color: '#3388ff',
      fillColor: '#3388ff',
    };
  };

  // Enhanced tooltip content
  const getTooltipContent = (polygon: any) => {
    const timeRangeText = timeRange.startDate === timeRange.endDate 
      ? `Date: ${timeRange.startDate}`
      : `Period: ${timeRange.startDate} to ${timeRange.endDate}`;

    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border-0 min-w-48">
        <div className="font-semibold text-gray-800 mb-2">
          Polygon {polygon.id}
        </div>
        
        {polygon.dataSource && (
          <div className="text-sm text-gray-600 mb-1">
            <span className="font-medium">Data Source:</span>
            <br />
            {polygon.dataSource.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </div>
        )}
        
        {polygon.value !== undefined && (
          <div className="text-lg font-bold mb-2" style={{ color: polygon.color }}>
            {polygon.value.toFixed(1)}
            {polygon.dataSource === 'temperature_2m' ? '°C' : 
             polygon.dataSource === 'relativehumidity_2m' ? '%' : ''}
          </div>
        )}
        
        {polygon.additionalData && (
          <div className="text-xs text-gray-600 mb-2 border-t pt-2">
            <div className="mb-1">
              <span className="font-medium">Data Points: {polygon.additionalData.totalPoints}</span>
            </div>
            
            {polygon.additionalData.centerValue !== undefined && (
              <div>Center: {polygon.additionalData.centerValue.toFixed(1)}°C</div>
            )}
            
            {polygon.additionalData.vertexValues && polygon.additionalData.vertexValues.length > 0 && (
              <div>Vertices: {polygon.additionalData.vertexValues.map((v: number) => v.toFixed(1)).join(', ')}°C</div>
            )}
            
            {polygon.additionalData.totalPoints > 1 && (
              <div className="mt-1 text-gray-500">
                Range: {polygon.additionalData.minValue.toFixed(1)} - {polygon.additionalData.maxValue.toFixed(1)}°C
              </div>
            )}
          </div>
        )}
        
        <div className="text-xs text-gray-500 border-t pt-2">
          {timeRangeText}
        </div>
        
        {isLoading && polygon.dataSource && (
          <div className="text-xs text-blue-600 mt-1 flex items-center">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
            Loading...
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto relative">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg p-4 min-w-64">
          <div className="flex items-center mb-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
            <span className="font-medium text-gray-800">Fetching Weather Data</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${fetchProgress}%` }}
            ></div>
          </div>
          
          <div className="text-sm text-gray-600">
            {Math.round(fetchProgress)}% Complete
          </div>
          
          <div className="text-xs text-gray-500 mt-2">
            Sampling: Center + Vertices
          </div>
          
          <div className="text-xs text-gray-500">
            Time Range: {timeRange.startDate} to {timeRange.endDate}
          </div>
        </div>
      )}

      {/* Data Status Indicator */}
      {!isLoading && lastFetchTime && (
        <div className="absolute top-4 right-4 z-[1000] bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center text-green-800">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm font-medium">Data Updated</span>
          </div>
          <div className="text-xs text-green-600 mt-1">
            Last fetch: {lastFetchTime}
          </div>
          
        </div>
      )}

      <MapContainer 
        center={[51.505, -0.09]} 
        zoom={13} 
        style={{ minHeight: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <LeafletDrawControl />
        
        {polygons.map((polygon) => (
          <Polygon
            key={polygon.id}
            positions={polygon.points}
            pathOptions={getPolygonStyle(polygon)}
          >
            <Tooltip 
              permanent={false} 
              sticky={true}
              direction="top"
              offset={[0, -10]}
              className="custom-tooltip"
            >
              {getTooltipContent(polygon)}
            </Tooltip>
          </Polygon>
        ))}
      </MapContainer>

      {/* Custom CSS for tooltips */}
      <style>{`
        .custom-tooltip .leaflet-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        
        .custom-tooltip .leaflet-tooltip-top:before {
          display: none !important;
        }
      `}</style>
    </div>
  );
};

export default ReactMap;