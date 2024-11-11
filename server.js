// Import necessary modules 
const express = require('express');
const turf = require('@turf/turf');

const app = express();
const PORT = 3000;

// Function to parse and validate coordinates
function parseCoordinates(req, res) {
    const coordinates = req.query.coords;
    if (!coordinates) {
        res.status(400).json({ error: 'Please provide coordinates as query parameters.' });
        return null;
    }

    try {
        const places = JSON.parse(coordinates).map(coord => ({
            lat: parseFloat(coord.lat),
            lon: parseFloat(coord.lon),
            population: parseInt(coord.population, 10)
        }));

        if (places.some(place => isNaN(place.lat) || isNaN(place.lon) || isNaN(place.population))) {
            res.status(400).json({ error: 'Invalid coordinate format. Ensure lat, lon, and population are numbers.' });
            return null;
        }

        return places;
    } catch (err) {
        res.status(400).json({ error: 'Invalid input format or JSON parse error.', details: err.message });
        return null;
    }
}

// Endpoint for concave hull
app.get('/concave-hull', (req, res) => {
    const places = parseCoordinates(req, res);
    if (!places) return;

    const points = places.map(place => turf.point([place.lon, place.lat]));
    const pointsCollection = turf.featureCollection(points);

    const maxEdgeValue = 20; // Adjust this as needed
    const concaveHull = turf.concave(pointsCollection, { maxEdge: maxEdgeValue, units: 'kilometers' });

    if (concaveHull) {
        res.json({ concaveHull });
    } else {
        res.status(400).json({ error: 'Concave hull generation failed. Try increasing the maxEdge value.' });
    }
});

// Endpoint for calculating the optimal point
app.get('/optimal-point', (req, res) => {
    const places = parseCoordinates(req, res);
    if (!places) return;

    const bbox = [
        Math.min(...places.map(p => p.lon)) - 0.02,
        Math.min(...places.map(p => p.lat)) - 0.02,
        Math.max(...places.map(p => p.lon)) + 0.02,
        Math.max(...places.map(p => p.lat)) + 0.02
    ];

    const points = places.map(place => turf.point([place.lon, place.lat], { population: place.population }));
    const pointsCollection = turf.featureCollection(points);

    const voronoiPolygons = turf.voronoi(pointsCollection, { bbox: bbox });
    let optimalPoint = null;

    if (voronoiPolygons) {
        voronoiPolygons.features.forEach((feature, index) => {
            const centroid = turf.centroid(feature);
            const lat = centroid.geometry.coordinates[1];
            const lon = centroid.geometry.coordinates[0];

            const maxPopulation = Math.max(...places.map(p => p.population));
            if (places[index] && places[index].population === maxPopulation) {
                optimalPoint = { lat: lat, lon: lon };
            }
        });
    }

    if (optimalPoint) {
        res.json({ optimalPoint });
    } else {
        res.status(400).json({ error: 'Optimal point calculation failed.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
