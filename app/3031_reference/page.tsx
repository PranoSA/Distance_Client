'use client';

import React, { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import { Feature, Graticule, Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat, toLonLat } from 'ol/proj';
import { click } from 'ol/events/condition';
import { Select } from 'ol/interaction';
import { Coordinate } from 'ol/coordinate';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import * as turf from '@turf/turf';
import { Geometry, LineString, Point, Polygon } from 'ol/geom';

import proj4 from 'proj4';
import { get as getProjection } from 'ol/proj.js';
import { register } from 'ol/proj/proj4.js';
import { Fill, Stroke, Style, Text } from 'ol/style';
import { Control } from 'ol/control';
import CircleStyle from 'ol/style/Circle';

proj4.defs(
  'EPSG:3031',
  '+proj=stere +lat_0=-90 +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs'
);

//Proj4js.defs["EPSG:3031"] = "+proj=laea +lat_0=52 +lon_0=10 +x_0=4321000 +y_0=3210000 +ellps=GRS80 +units=m +no_defs";
register(proj4);

const proj3031 = getProjection('EPSG:3031');

if (!proj3031) {
  throw new Error('Projection not found');
}

proj3031.setExtent([-210000000, -210000000, 210000000, 210000000]);

const MapComponent: React.FC = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [coordinates, setCoordinates] = useState<Coordinate | null>(null);

  const [circle_radius, set_circle_radius] = useState<number>(0.0);

  const circleVectorLayer = useRef<VectorLayer | null>(null);

  const gridVectorLayer = useRef<VectorLayer<VectorSource> | null>(null);

  const [sliderOrInput, setSliderOrInput] = useState<'slider' | 'input'>(
    'slider'
  );

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
        coords.push(fromLonLat([lon, lat], 'EPSG:3031'));
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
        new_style.setStroke(new Stroke({ color: 'red', width: 4 }));
      }

      if (lat === 30 || lat === -30) {
        new_style.setStroke(new Stroke({ color: 'green', width: 2 }));
      }

      if (lat === 60 || lat === -60) {
        new_style.setStroke(new Stroke({ color: 'yellow', width: 2 }));
      }

      //add style to feature
      new_feature.setStyle(new_style);

      features.push(new_feature);
    });

    // Create longitude lines
    longitudes.forEach((lon) => {
      const coords = [];
      for (let lat = -80; lat <= 80; lat += 1) {
        coords.push(fromLonLat([lon, lat], 'EPSG:3031'));
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

      if (lon === 0 || lon === 180 || lon === -180) {
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

  // when circle_radius, or coordinates change, update the circle
  useEffect(() => {
    if (coordinates && circleVectorLayer.current) {
      //convert 3031 coordinate to 4326
      const convert_3031_to_4326 = (coordinate: Coordinate): Coordinate => {
        return toLonLat(coordinate, 'EPSG:3031');
      };
      // use turf to create a circle
      const circle = turf.circle(
        convert_3031_to_4326(coordinates),
        circle_radius,
        {
          steps: 64,
          units: 'meters',
        }
      );

      const circle_points = circle.geometry.coordinates[0].map((coord) => {
        return fromLonLat(coord, 'EPSG:3031');
      });

      // convert the circle to a vector layer
      const circleFeature3031 = new Feature({
        geometry: new Polygon([circle_points]),
      });

      if (!circleVectorLayer.current.getSource()) return;

      // add the circle to the vector layer
      //@ts-ignore
      circleVectorLayer.current.getSource().clear();

      //@ts-ignore
      circleVectorLayer.current.getSource().addFeature(circleFeature3031);

      const projected_area = circleFeature3031.getGeometry()?.getArea() || 0;
      const actual_area = Math.PI * circle_radius * circle_radius;

      const area_ratio_string = `${(projected_area / actual_area).toFixed(2)}`;

      const projected_arc_radius = Math.sqrt(
        coordinates[0] * coordinates[0] + coordinates[1] * coordinates[1]
      );

      const angel_rad_coordinate =
        (Math.PI / 180) * toLonLat(coordinates, 'EPSG:3031')[0];

      const actual_arc_length =
        Math.cos(angel_rad_coordinate) * 6371000 * Math.PI * 2;

      const arc_proportion = projected_arc_radius / actual_arc_length;

      //add center point
      //const centerPoint = new Point(coordinates);

      const dimensional_growth_approx = Math.sqrt(projected_area / actual_area);

      const center_point = new Feature({
        geometry: new Point(coordinates),
      });

      //style solid
      center_point.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 5,
            fill: new Fill({ color: 'black' }),
          }),
          text: new Text({
            font: '12px Calibri,sans-serif',
            fill: new Fill({ color: '#000' }),
            stroke: new Stroke({
              color: '#fff',
              width: 2,
            }),
            text: `Area Ratio :${area_ratio_string} ${'\n'} Dimensional Growth: ${dimensional_growth_approx.toFixed(
              2
            )} ${'\n'}`,
            offsetX: 0,
            offsetY: 0,
            rotation: 0,
            scale: 1,
            textAlign: 'center',
            textBaseline: 'middle',
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
          gridVectorLayer.current,
        ],
        view: new View({
          center: fromLonLat([0, 0]),
          zoom: 2,
          //projection: 'EPSG:3031',
          projection: 'EPSG:3031',
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

        const inter = toLonLat(clickedCoordinate, 'EPSG:3031');

        //return if either is NaN, null, or undefined
        if (inter[0] === null || inter[1] === null) return;
        if (inter[0] === undefined || inter[1] === undefined) return;
        if (isNaN(inter[0]) || isNaN(inter[1])) return;

        setCoordinates(clickedCoordinate);
      });

      return () => {
        map.setTarget('');
      };
    }
  }, []);

  return (
    <div className="w-full flex flex-wrap flex-row">
      <div ref={mapRef} style={{ width: '100%', height: '400px' }}></div>
      <div className="w-1/2 p-5 flex flex-wrap">
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
        <div className="w-full md:w-1/2">
          <p>Coordinates (EPSG:3031):</p>
          <p>
            {coordinates[0].toFixed(0)}, {coordinates[1].toFixed(0)}
          </p>
          <p> Coordinates (EPSG:4326):</p>
          <p>
            [{toLonLat(coordinates, 'EPSG:3031')[0].toFixed(6)},
            {toLonLat(coordinates, 'EPSG:3031')[1].toFixed(6)}]
          </p>
        </div>
      )}
      <div className="w-full flex flex-wrap flex-col">
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
