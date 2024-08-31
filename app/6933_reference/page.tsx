'use client';

import React, { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import { Feature, Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat, toLonLat } from 'ol/proj';
import { click } from 'ol/events/condition';
import { Select } from 'ol/interaction';
import { Coordinate } from 'ol/coordinate';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import * as turf from '@turf/turf';
import { Geometry, LineString, Polygon } from 'ol/geom';

import proj4 from 'proj4';
import { get as getProjection } from 'ol/proj.js';
import { register } from 'ol/proj/proj4.js';
import { Stroke, Style } from 'ol/style';

proj4.defs(
  'EPSG:27700',
  '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 ' +
    '+x_0=400000 +y_0=-100000 +ellps=airy ' +
    '+towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 ' +
    '+units=m +no_defs'
);

proj4.defs(
  'EPSG:3035',
  '+proj=laea +lat_0=52 +lon_0=10 +x_0=4321000 +y_0=3210000 +ellps=GRS80 +units=m +no_defs'
);

//now, 9834
proj4.defs(
  'EPSG:9834',
  '+proj=laea +lat_0=52 +lon_0=10 +x_0=4321000 +y_0=3210000 +ellps=GRS80 +units=m +no_defs'
);

//6933
proj4.defs(
  'EPSG:6933',
  '+proj=cea +lon_0=0 +lat_ts=30 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs'
);

//Proj4js.defs["EPSG:3035"] = "+proj=laea +lat_0=52 +lon_0=10 +x_0=4321000 +y_0=3210000 +ellps=GRS80 +units=m +no_defs";
register(proj4);
const proj27700 = getProjection('EPSG:27700');
if (!proj27700) {
  throw new Error('Projection not found');
}
proj27700.setExtent([0, 0, 700000, 1300000]);
const proj9834 = getProjection('EPSG:9834');
if (!proj9834) {
  throw new Error('Projection not found');
}
proj9834.setExtent([-20037508.34, -20037508.34, 20037508.34, 20037508.34]);

const proj6933 = getProjection('EPSG:6933');
if (!proj6933) {
  throw new Error('Projection not found');
}

proj6933.setExtent([-17367530.45, -7314540.66, 17367530.45, 7314540.66]);

const proj3035 = getProjection('EPSG:3035');

if (!proj3035) {
  throw new Error('Projection not found');
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
    const latitudes = [30, 60, 90];
    const longitudes = [-180, -120, -60, 0, 60, 120, 180];

    // Create latitude lines
    latitudes.forEach((lat) => {
      const coords = [];
      for (let lon = -180; lon <= 180; lon += 1) {
        coords.push(fromLonLat([lon, lat], 'EPSG:6933'));
      }
      features.push(
        new Feature({
          geometry: new LineString(coords),
        })
      );
    });

    // Create longitude lines
    longitudes.forEach((lon) => {
      const coords = [];
      for (let lat = -90; lat <= 90; lat += 1) {
        coords.push(fromLonLat([lon, lat], 'EPSG:6933'));
      }
      features.push(
        new Feature({
          geometry: new LineString(coords),
        })
      );
    });

    return features;
  };

  // when circle_radius, or coordinates change, update the circle
  useEffect(() => {
    if (coordinates && circleVectorLayer.current) {
      //convert 3035 coordinate to 4326
      const convert_3035_to_4326 = (coordinate: Coordinate): Coordinate => {
        return toLonLat(coordinate, 'EPSG:6933');
      };
      // use turf to create a circle
      const circle = turf.circle(
        convert_3035_to_4326(coordinates),
        circle_radius,
        {
          steps: 64,
          units: 'meters',
        }
      );

      const circle_points = circle.geometry.coordinates[0].map((coord) => {
        return fromLonLat(coord, 'EPSG:6933');
      });

      // convert the circle to a vector layer
      const circleFeature3035 = new Feature({
        geometry: new Polygon([circle_points]),
      });

      if (!circleVectorLayer.current.getSource()) return;

      // add the circle to the vector layer
      //@ts-ignore
      circleVectorLayer.current.getSource().clear();

      //@ts-ignore
      circleVectorLayer.current.getSource().addFeature(circleFeature3035);
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
            color: 'red',
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
        ],
        view: new View({
          center: fromLonLat([0, 0]),
          zoom: 2,
          //projection: 'EPSG:3035',
          projection: 'EPSG:6933',
          //extent: [-700000, -13000000, 70000000, 130000000],
          //extent: [-360, -90, 360, 90],
          //extent: [0, 0, 700000, 1300000],
        }),
      });

      const selectClick = new Select({
        condition: click,
      });

      map.addInteraction(selectClick);

      map.on('click', (event) => {
        const clickedCoordinate = event.coordinate;
        if (!clickedCoordinate) return;

        setCoordinates(clickedCoordinate);
      });

      return () => {
        map.setTarget('');
      };
    }
  }, []);

  return (
    <div>
      <div ref={mapRef} style={{ width: '100%', height: '400px' }}></div>
      {coordinates && (
        <div>
          <p>Coordinates (EPSG:3035):</p>
          <p>X: {coordinates[0]}</p>
          <p>Y: {coordinates[1]}</p>
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
      <div style={{ display: 'flex', flexDirection: 'column' }}>
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
