
# 🌍 Map-based Weather Dashboard

A web-based interactive weather dashboard that allows users to draw polygons on a map, select date ranges, and filter temperature data for specific regions using sliders.

---

## 🚀 Getting Started

### 🧾 Clone the Repository

```bash
git clone https://github.com/Akash4701/Map-dashboard
cd Map-dashboard/dashboard
````

### 📦 Install Dependencies

```bash
yarn install
```

### ▶️ Run the Development Server

```bash
yarn dev
```

---

## 📚 Libraries & Tools Used

* [react-slider](https://www.npmjs.com/package/react-slider) – To create a smooth and intuitive range slider for selecting temperature.
* [leaflet](https://leafletjs.com/) – For rendering interactive maps.
* [react-leaflet](https://react-leaflet.js.org/) – React bindings for Leaflet to simplify integration in React apps.
* [lucide-react](https://www.npmjs.com/package/lucide-react) – For modern and customizable icon components.
* open-meteo – Free weather API used to fetch temperature and forecast data based on geographic coordinates.

---

## 🧠 Remarks on Design / Development

* ✅ Modular Architecture
  The project is cleanly divided into modular components such as `Slider`, `Map`, and `Sidebar` to maintain readability and reusability.

* 🧭 Polygon Selection with Leaflet Draw
  Users can interactively draw polygons on the map to define the region for which weather data should be fetched. The coordinates are captured and used in API calls.

* 📅 Date to Hour Conversion
  A utility function calculates the number of hours since the epoch (used by the Open-Meteo API) for both `startDate` and `endDate`, enabling precise weather queries.

* 🌡️ Temperature Range Filtering
  The slider allows users to filter regions within the selected polygon that fall between the desired temperature range. The filtered areas are visually updated on the map.

* 🌐 Real-time Weather Data
  Weather data is fetched dynamically using `fetchWeather.ts`, converting geographic and date inputs into API-readable parameters.

* ⚙️ Error Handling
  API failures, invalid polygon selections, or empty filters are handled gracefully with UI feedback and fallback states.

## 📸 Screenshots (Optional)


<img width="1919" height="898" alt="image" src="https://github.com/user-attachments/assets/4e736c2f-3802-43e6-961d-faa88e83c5bb" />



```

---

Let me know if you want:
- Screenshots auto-generated with placeholders.
- Deployment steps (e.g., Vercel, Netlify).
- Environment variable setup (if you're adding API keys later).
```
