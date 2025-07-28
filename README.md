# Water Level Map Demo

This demo fetches nearby water level sensors from Taiwan's Civil IoT (SensorThings API) and visualizes them on a Leaflet map. Users can click the button to locate themselves and display the latest water level readings from sensors within a 5 km radius..

The data is retrieved from the Civil IoT FROST server. Update `API_BASE` in `public/script.js` if the endpoint changes.

## Usage

Open `public/index.html` in a browser. The page requires internet access to load map tiles and query the Civil IoT API.
