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
import { Fill, Stroke, Style, Text } from 'ol/style';
import { Point } from 'proj4';
import { Point as OLPoint } from 'ol/geom';
import CircleStyle from 'ol/style/Circle';

const MapComponent: React.FC = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [coordinates, setCoordinates] = useState<Coordinate | null>(null);

  const [circle_radius, set_circle_radius] = useState<number>(0.0);

  const circleVectorLayer = useRef<VectorLayer | null>(null);

  const gridVectorLayer = useRef<VectorLayer<VectorSource> | null>(null);

  const [sliderOrInput, setSliderOrInput] = useState<'slider' | 'input'>(
    'slider'
  );

  // when circle_radius, or coordinates change, update the circle
  useEffect(() => {
    if (coordinates && circleVectorLayer.current) {
      // use turf to create a circle
      const circle = turf.circle(coordinates, circle_radius, {
        steps: 64,
        units: 'meters',
      });

      let right_most_coordinate = -180;
      let left_most_coordinate = 180;
      let top_most_coordinate = -90;
      let bottom_most_coordinate = 90;

      const circle_coordinates: Coordinate[] = circle.geometry.coordinates[0];

      circle_coordinates.forEach((coordinate) => {
        if (coordinate[0] < left_most_coordinate) {
          left_most_coordinate = coordinate[0];
        }
        if (coordinate[0] > right_most_coordinate) {
          right_most_coordinate = coordinate[0];
        }
        if (coordinate[1] < bottom_most_coordinate) {
          bottom_most_coordinate = coordinate[1];
        }
        if (coordinate[1] > top_most_coordinate) {
          top_most_coordinate = coordinate[1];
        }
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

      const projected_area = circleFeature.getGeometry()?.getArea() || 0;

      newFeature.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 5,
            fill: new Fill({ color: 'black' }),
          }),
          text: new Text({
            text: `Spans ${(
              right_most_coordinate - left_most_coordinate
            ).toFixed(2)}° long x ${(
              top_most_coordinate - bottom_most_coordinate
            ).toFixed(2)}° lat ${'\n'}`,
            offsetY: -15,
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

      if (lat === 0) {
        new_style.setStroke(new Stroke({ color: 'red', width: 2 }));
      }

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
          extent: [-180, -90, 180, 90],
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
    <div className="flex flex-wrap flex-row">
      <div ref={mapRef} style={{ width: '100%', height: '400px' }}></div>\
      <div className="w-full md:w-1/2 p-5 flex flex-wrap">
        {/* Toggle To Set Whether slider or input */}
        <div className="w-full flex flex-row items-center space-x-4">
          <label className="text-gray-700">Slider</label>
          <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
            <input
              type="checkbox"
              name="toggle"
              id="toggle"
              className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
              checked={sliderOrInput === 'input'}
              onChange={() => {
                setSliderOrInput(
                  sliderOrInput === 'slider' ? 'input' : 'slider'
                );
              }}
            />
            <label
              htmlFor="toggle"
              className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
            ></label>
          </div>
          <label className="text-gray-700">Input</label>
        </div>
        {sliderOrInput === 'input' ? (
          <input
            type="number"
            value={circle_radius}
            onChange={(event) => {
              set_circle_radius(parseFloat(event.target.value));
            }}
          />
        ) : null}
        {sliderOrInput === 'slider' ? (
          /* Slider to set the circle radius */
          <input
            type="range"
            min="0"
            max="10000000"
            value={circle_radius}
            onChange={(event) => {
              set_circle_radius(parseFloat(event.target.value) || 0);
            }}
          />
        ) : null}
      </div>
      {coordinates && (
        <div className="w-full md:w-1/2 flex flex-col">
          <p>Coordinates (EPSG:4326):</p>
          <p>X: {coordinates[0]}</p>
          <p>Y: {coordinates[1]}</p>
        </div>
      )}
      <div className="flex flex-col w-full md:w-1/2">
        <p>
          Circle Radius:{' '}
          {circle_radius > 1000
            ? `${circle_radius / 1000} km`
            : `${circle_radius} meters`}{' '}
        </p>
        <p>
          Circle Diameter:{' '}
          {circle_radius * 2 > 1000
            ? `${(circle_radius * 2) / 1000} km`
            : `${circle_radius} meters`}{' '}
        </p>
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
