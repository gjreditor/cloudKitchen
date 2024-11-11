// Import necessary modules 
const express = require('express');
const turf = require('@turf/turf');

const app = express();
const PORT = 3000;

// Function to calculate a good bounding box with padding
function calculateBoundingBox(points, padding = 0.02) {
    const minLat = Math.min(...points.map(p => p.lat));
    const maxLat = Math.max(...points.map(p => p.lat));
    const minLon = Math.min(...points.map(p => p.lon));
    const maxLon = Math.max(...points.map(p => p.lon));
    
    return [
        minLon - padding, // West (min longitude with padding)
        minLat - padding, // South (min latitude with padding)
        maxLon + padding, // East (max longitude with padding)
        maxLat + padding  // North (max latitude with padding)
    ];
}

// Function to calculate the average center of the points
function calculateCenter(points) {
    const avgLat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
    const avgLon = points.reduce((sum, p) => sum + p.lon, 0) / points.length;
    return [avgLat, avgLon];
}

// Define an endpoint for calculating the optimal point and concave hull
app.get('/calculate', (req, res) => {
    // Parse coordinates from query parameters
    const coordinates = req.query.coords;
    if (!coordinates) {
        return res.status(400).json({ error: 'Please provide coordinates as query parameters.' });
    }

    // Parse the coordinates into an array of places
    try {
        const places = JSON.parse(coordinates).map(coord => ({
            lat: parseFloat(coord.lat),
            lon: parseFloat(coord.lon),
            population: parseInt(coord.population, 10)
        }));

        // Validate that the coordinates have latitude, longitude, and population
        if (places.some(place => isNaN(place.lat) || isNaN(place.lon) || isNaN(place.population))) {
            return res.status(400).json({ error: 'Invalid coordinate format. Ensure lat, lon, and population are numbers.' });
        }

        const bbox = calculateBoundingBox(places);
        const center = calculateCenter(places);

        // Convert place data into GeoJSON points for Turf.js
        const points = places.map(place => {
            return turf.point([place.lon, place.lat], { population: place.population });
        });

        // Create a feature collection from points
        const pointsCollection = turf.featureCollection(points);

        // Calculate the concave hull using Turf.js
        const concaveHull = turf.concave(pointsCollection, { maxEdge: 1.5, units: 'kilometers' });

        // Generate the Voronoi polygons using the bounding box
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

        // Return the results as JSON
        res.json({
            boundingBox: bbox,
            center: center,
            optimalPoint: optimalPoint,
            voronoiPolygons: voronoiPolygons,
            concaveHull: concaveHull
        });

    } catch (error) {
        console.error('Error parsing coordinates:', error);
        res.status(500).json({ error: 'An error occurred while processing the data.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
