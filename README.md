
**Query Parameters:**
- `coords`: A JSON array of objects, where each object contains:
  - `lat`: Latitude of the location (float)
  - `lon`: Longitude of the location (float)
  - `population`: Population or number of incidents at the location (integer)

### Example Request
```url
https://cloudkitchen-2as8.onrender.com/calculate?coords=[
  {"lat":10.0843179, "lon":77.9610158, "population":34},
  {"lat":10.02383, "lon":78.22352, "population":53},
  {"lat":10.0699385, "lon":78.003552, "population":42},
  {"lat":9.46212, "lon":78.5411, "population":78},
  {"lat":9.5694148, "lon":78.4968049, "population":26}
]

### Example Output JSON
{
  "boundingBox": [77.9410158, 9.442120000000001, 78.5611, 10.1043179],
  "center": [9.84192424, 78.24519854],
  "optimalPoint": {
    "lat": 9.472469137191856,
    "lon": 78.48758581837679
  },
  "voronoiPolygons": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": {},
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [[77.99147518823115, 10.1043179], [77.9410158, 9.955048789644628], [77.9410158, 10.1043179], [77.99147518823115, 10.1043179]]
          ]
        }
      },
      ...
    ]
  }
}
