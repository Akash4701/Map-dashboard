import { useContext, useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';
import { AppContext } from '../context/PolygonContext';

// Add leaflet-draw types if missing
declare module 'leaflet' {
  namespace Draw {
    const Event: any;
  }
}

const LeafletDrawControl = () => {
  const map = useMap();
  const { addPolygon, deletePolygon, updatePolygon, dataSources, polygons } = useContext(AppContext)!;
  const drawnItemsRef = useRef<L.FeatureGroup>(new L.FeatureGroup());

  const processedLayers = useRef<Set<number>>(new Set());

  useEffect(() => {
    const drawnItems = drawnItemsRef.current;
    map.addLayer(drawnItems);

    // @ts-ignore
    const drawControl = new (L.Control as any).Draw({
      edit: {
        featureGroup: drawnItems,
        edit: {
          selectedPathOptions: {
            maintainColor: true,
            dashArray: '10,10'
          }
        }
      },
      draw: {
        polygon: {
          allowIntersection: false,
        
          drawError: {
            color: '#e1e100',
            message: '<strong>Polygon drawing error</strong>: Shape edges cannot cross!'
          },
          shapeOptions: {
            color: '#3388ff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.3
          },
        },
        polyline: false,
        rectangle: false,
        circle: false,
        marker: false,
        circlemarker: false,
      },
    });

    map.addControl(drawControl);

    // Custom validation for polygon vertices
    const validatePolygon = (points: L.LatLng[]): boolean => {
      if (points.length < 3) {
        alert('Polygon must have at least 3 vertices!');
        return false;
      }
      if (points.length > 12) {
        alert('Polygon cannot have more than 12 vertices!');
        return false;
      }
      return true;
    };

    map.on(L.Draw.Event.CREATED, (event: any) => {
      const layer = event.layer;
      const points = layer.getLatLngs()[0];
      
      if (!validatePolygon(points)) {
        return; // Don't add invalid polygon
      }

      const layerStamp = L.Util.stamp(layer);
      
      // Prevent duplicate processing
      if (processedLayers.current.has(layerStamp)) {
        return;
      }
      processedLayers.current.add(layerStamp);

      // Generate unique ID using timestamp and random number
      const uniqueId = `polygon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const polygonPoints = points.map((latlng: L.LatLng) => ({ lat: latlng.lat, lng: latlng.lng }));
      
      // Auto-select data source if only one exists
      const dataSource = dataSources.length === 1 ? dataSources[0] : undefined;
      
      // Check if polygon with same coordinates already exists
      const existingPolygon = polygons.find(p => 
        JSON.stringify(p.points) === JSON.stringify(polygonPoints)
      );
      
      if (!existingPolygon) {
        addPolygon({ 
          id: uniqueId, 
          points: polygonPoints,
          dataSource,
          color: '#3388ff'
        });
      }
      
      drawnItems.addLayer(layer);
    });

    map.on(L.Draw.Event.EDITED, (event: any) => {
      event.layers.eachLayer((layer: any) => {
        const points = layer.getLatLngs()[0];
        
        if (!validatePolygon(points)) {
          // Revert changes if invalid
          event.layers.removeLayer(layer);
          return;
        }

        const id = L.Util.stamp(layer).toString();
        const polygonPoints = points.map((latlng: L.LatLng) => ({ lat: latlng.lat, lng: latlng.lng }));
        // Find the existing polygon to get its dataSource
        const existingPolygon = polygons.find(p => p.id === id);
        const dataSource = existingPolygon ? existingPolygon.dataSource : (dataSources.length === 1 ? dataSources[0] : '');
        updatePolygon({ id, points: polygonPoints, dataSource });
      });
    });

    map.on(L.Draw.Event.DELETED, (event: any) => {
      event.layers.eachLayer((layer: any) => {
        const id = L.Util.stamp(layer).toString();
        deletePolygon(id);
      });
    });

    return () => {
      map.removeControl(drawControl);
      map.removeLayer(drawnItems);
    };
  }, [map, addPolygon, deletePolygon, updatePolygon, dataSources]);

  return null;
};

export default LeafletDrawControl;