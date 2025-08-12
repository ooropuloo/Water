# Water Level Map Demo

This demo fetches nearby water level sensors from Taiwan's Civil IoT (SensorThings API) and visualizes them on a Leaflet map. Users can click the button to locate themselves and display the latest water level readings from sensors within a 5 km radius..

The data is retrieved from the Civil IoT FROST server. Update `API_BASE` in `public/script.js` if the endpoint changes.

## Usage

Open `index.html` or `public/index.html` in a browser. The page requires internet access to load map tiles and query the Civil IoT API.

## Prototype Graph API

A minimal prototype graph server and visualization is included as a starting point for a DataWalk-style system. Run the server and open the graph demo:

```bash
node server.js
```

Then browse to `http://localhost:4000/graph.html` to see the sample graph rendered with Cytoscape.js. The server exposes:

- **REST**: `GET /api/graph` returns all nodes and edges.
- **GraphQL**: `POST /graphql` accepts simple queries like `{ nodes { id label } }` or `{ node(id: "1") { id label } }`.
