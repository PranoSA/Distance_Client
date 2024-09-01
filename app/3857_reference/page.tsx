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
import * as turf from '@turf/turf';
import { LineString, Point, Polygon } from 'ol/geom';
import VectorSource from 'ol/source/Vector';
import { Fill, Stroke, Style } from 'ol/style';
import CircleStyle from 'ol/style/Circle';
import { Point as OLPoint } from 'ol/geom';

const MapComponent: React.FC = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [coordinates, setCoordinates] = useState<Coordinate | null>(null);
  const [circle_radius, set_circle_radius] = useState<number>(0.0);

  const circleVectorLayer = useRef<VectorLayer | null>(null);

  const gridLayer = useRef<VectorLayer | null>(null);

  // when circle_radius, or coordinates change, update the circle
  useEffect(() => {
    if (coordinates && circleVectorLayer.current) {
      // use turf to create a circle
      const coordinate_4326 = toLonLat(coordinates);

      const circle = turf.circle(coordinate_4326, circle_radius, {
        steps: 64,
        units: 'meters',
      });

      // Convert the circle coordinates from EPSG:4326 to EPSG:3857
      const circle_3857 = circle.geometry.coordinates[0].map((coord) => {
        return fromLonLat(coord);
      });

      // convert the circle to a vector layer
      const circleFeature = new Feature({
        //@ts-ignore
        geometry: new Polygon([circle_3857]),

        // geometry: new Polygon(circle.geometry.coordinates),
      });

      if (!circleVectorLayer.current.getSource()) return;

      // add the circle to the vector layer
      //@ts-ignore
      circleVectorLayer.current.getSource().clear();

      //@ts-ignore
      circleVectorLayer.current.getSource().addFeature(circleFeature);

      const new_point = new OLPoint(coordinates);

      const new_point_feature = new Feature({
        geometry: new_point,
      });

      new_point_feature.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 5,
            fill: new Fill({ color: 'black' }),
          }),
        })
      );

      //@ts-ignore
      circleVectorLayer.current.getSource().addFeature(new_point_feature);
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
        coords.push(fromLonLat([lon, lat], 'EPSG:3857'));
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

      if (lat === 0) {
        new_style.setStroke(new Stroke({ color: 'red', width: 2 }));
      }

      if (lat === 30 || lat === -30) {
        new_style.setStroke(new Stroke({ color: 'red', width: 1 }));
      }

      if (lat === 45 || lat === -45) {
        new_style.setStroke(new Stroke({ color: 'red', width: 1 }));
      }

      if (lat === 45 || lat === -45) {
        new_style.setStroke(new Stroke({ color: 'red', width: 1 }));
      }

      //add style to feature
      new_feature.setStyle(new_style);

      features.push(new_feature);
    });

    // Create longitude lines
    longitudes.forEach((lon) => {
      const coords = [];
      for (let lat = -90; lat <= 90; lat += 1) {
        coords.push(fromLonLat([lon, lat], 'EPSG:3857'));
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

      if (lon === 0) {
        new_style.setStroke(new Stroke({ color: 'red', width: 2 }));
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

  useEffect(() => {
    circleVectorLayer.current = new VectorLayer({
      source: new VectorSource(),
    });

    gridLayer.current = new VectorLayer({
      source: new VectorSource({
        features: createLatLonLines(),
      }),
    });

    if (mapRef.current) {
      const map = new Map({
        target: mapRef.current,
        layers: [
          new TileLayer({
            source: new OSM(),
          }),
          circleVectorLayer.current,
          gridLayer.current,
        ],
        view: new View({
          center: fromLonLat([0, 0]),
          zoom: 2,
          extent: [-20026376.39 * 2, -20048966.1, 20026376.39 * 2, 20048966.1],
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
          <p>Coordinates (EPSG:3857):</p>
          <p>X: {coordinates[0]}</p>
          <p>Y: {coordinates[1]}</p>
          <p> Coordinates (EPSG:4326):</p>
          <p>
            [{toLonLat(coordinates)[0].toFixed(6)},
            {toLonLat(coordinates)[1].toFixed(6)}]
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
