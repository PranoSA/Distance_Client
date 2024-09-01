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
import { Circle, LineString, Polygon } from 'ol/geom';
import { Fill, Stroke, Style } from 'ol/style';
import { Point } from 'proj4';
import { Point as OLPoint } from 'ol/geom';
import CircleStyle from 'ol/style/Circle';

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

      const newPointF = new OLPoint(coordinates);

      const newFeature = new Feature({
        geometry: newPointF,
      });

      newFeature.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 5,
            fill: new Fill({ color: 'black' }),
          }),
        })
      );

      //@ts-ignore
      circleVectorLayer.current.getSource().addFeature(newFeature);
    }
  }, [coordinates, circle_radius]);

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
        coords.push(fromLonLat([lon, lat], 'EPSG:4326'));
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
          color: 'black',
          width: 1,
        }),
      });

      /*if (lat === -30 || lat === 30) {
        new_style.setStroke(new Stroke({ color: 'red', width: 1 }));
      } else if (lat === -45 || lat === 45) {
        new_style.setStroke(new Stroke({ color: 'green', width: 1 }));
      } else if (lat === -60 || lat === 60) {
        new_style.setStroke(new Stroke({ color: 'blue', width: 1 }));
      } else if (lat === -75 || lat === 75) {
        new_style.setStroke(new Stroke({ color: 'yellow', width: 1 }));
      }*/

      //add style to feature
      new_feature.setStyle(new_style);

      features.push(new_feature);
    });

    // Create longitude lines
    longitudes.forEach((lon) => {
      const coords = [];
      for (let lat = -90; lat <= 90; lat += 1) {
        coords.push(fromLonLat([lon, lat], 'EPSG:4326'));
      }

      //style feature according to this
      // 0  = yellow
      // -180, 180 = black
      // -120, 120 = red
      // -60, 60 = green

      const new_style = new Style({
        stroke: new Stroke({
          color: 'black',
          width: 1,
        }),
      });

      const new_feature = new Feature({
        geometry: new LineString(coords),
      });

      //add style to feature
      new_feature.setStyle(new_style);

      features.push(new_feature);
    });

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
