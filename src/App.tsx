import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet/dist/leaflet.css';
import './App.css';
import LeafletDrawMap from './components/Map';
import PolygonSidebar from './components/PolygonSidebar';
import TimelineSlider from './components/slider';
import { AppProvider } from './context/PolygonContext';

function App() {
  return (
    <div className="flex flex-col h-screen">
      <AppProvider>
      {/* Timeline Slider at the top */}
      <div className="bg-gray-50 border-b">
        <TimelineSlider range={true} />
      </div>
      
      {/* Main content area */}
      <div className="flex flex-1">
        <div className="w-3/4">
          <LeafletDrawMap />
        </div>
        <div className="w-1/4">
          <PolygonSidebar />
        </div>
      </div>
      </AppProvider>
    </div>
  );
}

export default App;