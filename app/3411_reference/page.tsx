"use client";

import React, { useEffect, useRef, useState } from "react";
import "ol/ol.css";
import { Feature, Graticule, Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { fromLonLat, toLonLat } from "ol/proj";
import { click } from "ol/events/condition";
import { Select } from "ol/interaction";
import { Coordinate } from "ol/coordinate";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import * as turf from "@turf/turf";
import { Geometry, LineString, Point, Polygon } from "ol/geom";

import proj4 from "proj4";
import { get as getProjection } from "ol/proj.js";
import { register } from "ol/proj/proj4.js";
import { Fill, Stroke, Style, Text } from "ol/style";
import { Control } from "ol/control";

proj4.defs(
  "EPSG:3411",
  "+proj=laea +lat_0=90 +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs"
);

/*// Define the Azimuthal Equal-Area Polar projection for the South Pole
proj4.defs(
  'EPSG:3031',
  '+proj=laea +lat_0=-90 +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs'
);
*/

//Proj4js.defs["EPSG:3411"] = "+proj=laea +lat_0=52 +lon_0=10 +x_0=4321000 +y_0=3210000 +ellps=GRS80 +units=m +no_defs";
register(proj4);

// Use the North Pole projection (EPSG:3411) or South Pole projection (EPSG:3031)
const projPolar = getProjection("EPSG:3411"); // Change to 'EPSG:3031' for South Pole

projPolar?.setExtent([-18000000, -10000000, 18000000, 16000000]);

if (!projPolar) {
  throw new Error("Projection not found");
}

const MapComponent: React.FC = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [coordinates, setCoordinates] = useState<Coordinate | null>(null);

  const [circle_radius, set_circle_radius] = useState<number>(0.0);

  const circleVectorLayer = useRef<VectorLayer | null>(null);

  const gridVectorLayer = useRef<VectorLayer<VectorSource> | null>(null);

  // Function to create latitude and longitude lines
  const createLatLonLines = () => {
    const features: Feature<LineString>[] = [];
    const latitudes = [
      -90, -80, -70, -60, -50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50, 60,
      70, 80, 90,
    ];
    const longitudes = [
      -180, -170, -160, -150, -140, -130, -120, -110, -100, -90, -80, -70, -60,
      -50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110,
      120, 130, 140, 150, 160, 170, 180,
    ];

    // Create latitude lines
    latitudes.forEach((lat) => {
      const coords = [];
      for (let lon = -180; lon <= 180; lon += 1) {
        coords.push(fromLonLat([lon, lat], "EPSG:3411"));
      }
      const new_feature = new Feature({
        geometry: new LineString(coords),
      });

      //style feature according to this
      // 0 = black
      // -30, 30 = red
      // -45, 45 = green
      // -60, 60 = blue
      // -75, 75 = yellow

      const new_style = new Style({
        stroke: new Stroke({
          color: "black",
          width: 1,
        }),
      });

      //add style to feature
      new_feature.setStyle(new_style);

      if (lat === 0) {
        new_style.setStroke(new Stroke({ color: "red", width: 2 }));
      }

      features.push(new_feature);
    });

    // Create longitude lines
    longitudes.forEach((lon) => {
      const coords = [];
      for (let lat = -75; lat <= 90; lat += 1) {
        coords.push(fromLonLat([lon, lat], "EPSG:3411"));
      }

      //style feature according to this
      // 0  = yellow
      // -180, 180 = black
      // -120, 120 = red
      // -60, 60 = green

      const new_style = new Style({
        stroke: new Stroke({
          color: "black",
          width: 1,
        }),
      });

      if (lon === 0 || lon === 180 || lon === -180) {
        new_style.setStroke(new Stroke({ color: "red", width: 2 }));
      }
      const new_feature = new Feature({
        geometry: new LineString(coords),
      });

      //add style to feature
      new_feature.setStyle(new_style);

      features.push(new_feature);
    });

    return features;
  };

  // when circle_radius, or coordinates change, update the circle
  useEffect(() => {
    if (coordinates && circleVectorLayer.current) {
      //convert 3411 coordinate to 4326
      const convert_3411_to_4326 = (coordinate: Coordinate): Coordinate => {
        return toLonLat(coordinate, "EPSG:3411");
      };
      // use turf to create a circle
      const circle = turf.circle(
        convert_3411_to_4326(coordinates),
        circle_radius,
        {
          steps: 64,
          units: "meters",
        }
      );

      const circle_points = circle.geometry.coordinates[0].map((coord) => {
        return fromLonLat(coord, "EPSG:3411");
      });

      // convert the circle to a vector layer
      const circleFeature3411 = new Feature({
        geometry: new Polygon([circle_points]),
      });

      const projectedArea = circleFeature3411.getGeometry()?.getArea() || 0;

      const coordinate_bottom = turf.destination(
        convert_3411_to_4326(coordinates),
        circle_radius,
        180,
        { units: "meters" }
      );

      const coordinate_top = turf.destination(
        convert_3411_to_4326(coordinates),
        circle_radius,
        0,
        { units: "meters" }
      );

      //convert turf bottom to point
      const bottom_point = fromLonLat(
        coordinate_bottom.geometry.coordinates,
        "EPSG:3411"
      );
      const top_point = fromLonLat(
        coordinate_top.geometry.coordinates,
        "EPSG:3411"
      );

      const euclidean_distance = Math.sqrt(
        Math.pow(top_point[0] - bottom_point[0], 2) +
          Math.pow(top_point[1] - bottom_point[1], 2)
      );

      //draw a line from top to bottom
      const line = new Feature({
        geometry: new LineString([top_point, bottom_point]),
      });

      const prettifyMeasurement = (measurement: number) => {
        if (measurement < 1000) {
          return `${measurement.toFixed(0)} meters`;
        }

        return `${(measurement / 1000).toFixed(0)} km`;
      };

      const degrees_lat = toLonLat(coordinates, "EPSG:3411")[1];

      console.log("degrees_lat", degrees_lat);

      const circumfrence_at_lat =
        2 * Math.PI * 6371000 * Math.cos(degrees_lat * (Math.PI / 180));

      //
      const projected_radius = Math.sqrt(
        coordinates[0] * coordinates[0] + coordinates[1] * coordinates[1]
      );

      //conver to +/- degrees
      const proportion_of_circumfrence = circle_radius / circumfrence_at_lat;

      const arc_length_through_center =
        proportion_of_circumfrence * projected_radius * 2 * Math.PI;

      //add styling with descriptive text on area and euclidean distance
      line.setStyle(
        new Style({
          stroke: new Stroke({
            color: "black",
            width: 1,
          }),
          text: new Text({
            text: `
          ${prettifyMeasurement(arc_length_through_center * 2)} hor..
            ${prettifyMeasurement(euclidean_distance)} ${"\n"} Area ${(
              projectedArea / 1000000
            ).toFixed(0)} km sq. `,
            font: "12px Calibri,sans-serif",
            fill: new Fill({
              color: "black",
            }),
            stroke: new Stroke({
              color: "white",
              width: 3,
            }),
            offsetY: -10, // Adjust the label position
          }),
        })
      );

      //get the height of the circle, which you can assume is in straight line

      //stop trying to use turf, this is actual distance. I want to use the projected difference on the map

      //eucledioan distance top and bottom

      if (!circleVectorLayer.current.getSource()) return;

      // add the circle to the vector layer
      //@ts-ignore
      circleVectorLayer.current.getSource().clear();

      //@ts-ignore
      //circleVectorLayer.current.getSource().addFeature(line);

      //@ts-ignore
      circleVectorLayer.current.getSource().addFeature(circleFeature3411);

      //add the center point using open layers point
      //@ts-ignore
      const center_point = new Feature({
        geometry: new Point(coordinates),
      });

      center_point.setStyle(
        new Style({
          text: new Text({
            text: `
          ${prettifyMeasurement(
            arc_length_through_center * 2
          )} X ${prettifyMeasurement(euclidean_distance)} ${"\n"} Area Ratio ${(
              projectedArea /
              (Math.PI * circle_radius * circle_radius)
            ).toFixed(2)} `,
            font: "12px Calibri,sans-serif",
            fill: new Fill({
              color: "black",
            }),
            stroke: new Stroke({
              color: "white",
              width: 3,
            }),
            offsetY: -10, // Adjust the label position
          }),
        })
      );

      //@ts-ignore
      circleVectorLayer.current.getSource().addFeature(center_point);
    }
  }, [coordinates, circle_radius]);

  useEffect(() => {
    if (mapRef.current) {
      circleVectorLayer.current = new VectorLayer({
        source: new VectorSource(),
      });

      const features = createLatLonLines();

      const grid_source = new VectorSource<Feature<Geometry>>({
        features: features,
      });

      gridVectorLayer.current = new VectorLayer({
        source: grid_source,
        style: new Style({
          stroke: new Stroke({
            color: "red",
            width: 1,
          }),
        }),
      });

      const map = new Map({
        target: mapRef.current,
        layers: [
          new TileLayer({
            source: new OSM(),
          }),
          circleVectorLayer.current,
          gridVectorLayer.current,
        ],
        view: new View({
          center: fromLonLat([0, 0]),
          zoom: 2,
          //projection: 'EPSG:3411',
          projection: "EPSG:3411",
          //extent: [-700000, -13000000, 70000000, 130000000],
          //extent: [-360, -90, 360, 90],
          //extent: [0, 0, 700000, 1300000],
        }),
      });

      const selectClick = new Select({
        condition: click,
      });

      map.addInteraction(selectClick);

      map.on("click", (event) => {
        const clickedCoordinate = event.coordinate;
        if (!clickedCoordinate) return;

        //validate coordinate
        const inter = toLonLat(clickedCoordinate, "EPSG:3411");

        //return if either is NaN, null, or undefined
        if (inter[0] === null || inter[1] === null) return;
        if (inter[0] === undefined || inter[1] === undefined) return;
        if (isNaN(inter[0]) || isNaN(inter[1])) return;

        setCoordinates(clickedCoordinate);
      });

      return () => {
        map.setTarget("");
      };
    }
  }, []);

  return (
    <div>
      <div ref={mapRef} style={{ width: "100%", height: "400px" }}></div>
      {coordinates && (
        <div>
          <p>Coordinates (EPSG:3411):</p>
          <p>X: {coordinates[0]}</p>
          <p>Y: {coordinates[1]}</p>
          <p> Coordinates (EPSG:4326):</p>
          <p>
            [{toLonLat(coordinates, "EPSG:3411")[0].toFixed(6)},
            {toLonLat(coordinates, "EPSG:3411")[1].toFixed(6)}]
          </p>
        </div>
      )}
      {
        /* Slider to set the circle radius */

        <input
          type="range"
          min="0"
          max="10000000"
          value={circle_radius}
          onChange={(event) => {
            set_circle_radius(parseFloat(event.target.value));
          }}
        />
      }
      <div style={{ display: "flex", flexDirection: "column" }}>
        <p>Circle Radius: {circle_radius} meters</p>
      </div>
    </div>
  );
};

const HomePage: React.FC = () => {
  return (
    <div>
      <h1>OpenLayers Map with Click Events</h1>
      <MapComponent />
    </div>
  );
};

export default HomePage;
