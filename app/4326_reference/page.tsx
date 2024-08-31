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
import { LineString, Polygon } from 'ol/geom';

const MapComponent: React.FC = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [coordinates, setCoordinates] = useState<Coordinate | null>(null);

  const [circle_radius, set_circle_radius] = useState<number>(0.0);

  const circleVectorLayer = useRef<VectorLayer | null>(null);

  const gridVectorLayer = useRef<VectorLayer<VectorSource> | null>(null);

  // when circle_radius, or coordinates change, update the circle
  useEffect(() => {
    if (coordinates && circleVectorLayer.current) {
      // use turf to create a circle
      const circle = turf.circle(coordinates, circle_radius, {
        steps: 64,
        units: 'meters',
      });

      // convert the circle to a vector layer
      const circleFeature = new Feature({
        geometry: new Polygon(circle.geometry.coordinates),
      });

      if (!circleVectorLayer.current.getSource()) return;

      // add the circle to the vector layer
      //@ts-ignore
      circleVectorLayer.current.getSource().clear();

      //@ts-ignore
      circleVectorLayer.current.getSource().addFeature(circleFeature);
    }
  }, [coordinates, circle_radius]);

  const createLatLonLines = () => {
    const features = [];
    for (let i = -180; i <= 180; i += 30) {
      const coords = [];
      for (let j = -90; j <= 90; j += 30) {
        coords.push(fromLonLat([i, j], 'EPSG:4326'));
      }
      features.push(
        new Feature({
          geometry: new LineString(coords),
        })
      );
    }
    for (let i = -90; i <= 90; i += 30) {
      const coords = [];
      for (let j = -180; j <= 180; j += 30) {
        coords.push(fromLonLat([j, i]));
      }
      features.push(
        new Feature({
          geometry: new LineString(coords),
        })
      );
    }
    return features;
  };

  useEffect(() => {
    if (mapRef.current) {
      circleVectorLayer.current = new VectorLayer({
        source: new VectorSource(),
      });

      const gridLayer = new VectorLayer({
        source: new VectorSource(),
      });

      const features = createLatLonLines();

      //add the features to the grid layer
      //@ts-ignore
      gridLayer.getSource().addFeatures(features);

      const map = new Map({
        target: mapRef.current,
        layers: [
          new TileLayer({
            source: new OSM(),
          }),
          circleVectorLayer.current,
          gridLayer,
        ],
        view: new View({
          center: fromLonLat([0, 0]),
          zoom: 2,
          projection: 'EPSG:4326',
          extent: [-360, -90, 360, 90],
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
          <p>Coordinates (EPSG:4326):</p>
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
