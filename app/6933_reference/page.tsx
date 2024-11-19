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

import { AddDestinationModal } from '@/components/AddDestinationModa';

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

  const [sliderOrInput, setSliderOrInput] = useState<'slider' | 'input'>(
    'slider'
  );

  const [inputMeterOrKm, setInputMeterOrKm] = useState<'m' | 'km'>('km');

  const [showDestinationModal, setShowDestinationModal] =
    useState<boolean>(false);

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
        coords.push(fromLonLat([lon, lat], 'EPSG:6933'));
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
        new_style.setStroke(new Stroke({ color: 'yellow', width: 2 }));
      }

      if (lat === 30 || lat === -30) {
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
        coords.push(fromLonLat([lon, lat], 'EPSG:6933'));
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
        new_style.setStroke(new Stroke({ color: 'yellow', width: 2 }));
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

      //default to the extent of the map
      //proj6933.setExtent([-17367530.45, -7314540.66, 17367530.45, 7314540.66]);
      var top_most_coordiante = -7314540.66;
      var bottom_most_coordinate = 7314540.66;
      var right_most_coordinate = -17367530.45;
      var left_most_coordinate = 17367530.45;

      const circle_points = circle.geometry.coordinates[0].map((coord) => {
        const new_point = fromLonLat(coord, 'EPSG:6933');
        if (new_point[0] > right_most_coordinate) {
          right_most_coordinate = new_point[0];
        }
        if (new_point[0] < left_most_coordinate) {
          left_most_coordinate = new_point[0];
        }

        if (new_point[1] < bottom_most_coordinate) {
          bottom_most_coordinate = new_point[1];
        }

        if (new_point[1] > top_most_coordiante) {
          top_most_coordiante = new_point[1];
        }

        return new_point;
      });

      // convert the circle to a vector layer
      const circleFeature3035 = new Feature({
        geometry: new Polygon([circle_points]),
      });

      if (!circleVectorLayer.current.getSource()) return;

      // add the circle to the vector layer
      //@ts-ignore
      circleVectorLayer.current.getSource().clear();

      const new_point = new Feature({
        geometry: new Point(coordinates),
      });

      const projected_area = circleFeature3035.getGeometry()?.getArea() || 0;

      const prettify = (num: number) => {
        if (num < 1000) {
          return num.toFixed(0) + 'm ';
        }
        return (num / 1000).toFixed(0) + 'km ';
      };

      new_point.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 5,
            fill: new Fill({ color: 'black' }),
          }),
          text: new Text({
            font: '12px Calibri,sans-serif',
            text: `${prettify(
              right_most_coordinate - left_most_coordinate
            )} ${' '} X ${prettify(
              top_most_coordiante - bottom_most_coordinate
            )} ${'\n'} Area Ratio : ${(
              projected_area /
              (Math.PI * circle_radius * circle_radius)
            ).toFixed(2)}`,
            offsetY: -15,
            fill: new Fill({ color: 'black' }),
          }),
        })
      );

      //@ts-ignore
      circleVectorLayer.current.getSource().addFeature(new_point);

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
          gridVectorLayer.current,
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

        const inter = toLonLat(clickedCoordinate, 'EPSG:6933');

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
    <div className="w-full flex flex-wrap flex-row  h-[100vh]">
      <div
        ref={mapRef}
        style={{ width: '100%', height: 'calc(100% - 150px)' }}
      ></div>
      <div className="w-full flex flex-wrap flex-row justify-center">
        <AddDestinationModal
          show={showDestinationModal}
          handleClose={() => setShowDestinationModal(false)}
          handleOpen={() => setShowDestinationModal(true)}
          handleAdd={(destination) => {
            //set the coordinates
            const lat = destination.lat;
            const lon = destination.long;

            setCoordinates(fromLonLat([lon, lat]));

            //close the modal
            setShowDestinationModal(false);
          }}
        />
      </div>

      <div className="w-1/2 p-2 flex flex-wrap">
        {/* Toggle To Set Whether slider or input */}
        <div className="w-full flex flex-row items-center space-x-4">
          <label
            className={`${
              sliderOrInput === 'slider'
                ? 'text-gray-700 dark:text-gray-200'
                : 'text-gray-200 dark:text-gray-700'
            }`}
          >
            Slider
          </label>
          <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
            <input
              type="checkbox"
              name="toggle"
              id="toggle"
              className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
              checked={sliderOrInput === 'input'}
              onChange={() => {
                {
                  console.log('SLIDER');
                  setSliderOrInput(
                    sliderOrInput === 'slider' ? 'input' : 'slider'
                  );
                }
              }}
            />
            <label
              htmlFor="toggle"
              className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
            ></label>
          </div>
          <label
            className={`${
              sliderOrInput === 'input'
                ? 'text-gray-700 dark:text-gray-200'
                : 'text-gray-200 dark:text-gray-700'
            }`}
          >
            Input
          </label>
        </div>
        {sliderOrInput === 'input' ? (
          <>
            {/* Input to set the circle radius */}
            <label className="dark:text-white pr-4">
              Circle Radius ({inputMeterOrKm === 'm' ? 'Meters' : 'Kilometers'}
              ):
            </label>

            <input
              type="number"
              className="dark:text-gray-800 bg-white "
              step={1}
              min={0}
              value={
                inputMeterOrKm === 'km'
                  ? Math.round(circle_radius / 1000)
                  : circle_radius
              }
              onChange={(event) => {
                set_circle_radius(
                  inputMeterOrKm === 'km'
                    ? (parseFloat(event.target.value) || 0) * 1000
                    : parseFloat(event.target.value) || 0
                );
              }}
            />

            {/* Toggle to set whether input is in meters or kilometers */}
            <div className="w-full flex flex-row items-center space-x-4">
              <label
                className={`${
                  inputMeterOrKm === 'm'
                    ? 'text-gray-700 dark:text-gray-200'
                    : 'text-gray-200 dark:text-gray-700'
                }`}
              >
                Meters
              </label>
              <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                <input
                  type="checkbox"
                  name="toggle_m_or_km"
                  id="toggle_m_or_km"
                  className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                  checked={inputMeterOrKm === 'km'}
                  onChange={(e) => {
                    e.stopPropagation();
                    setInputMeterOrKm(inputMeterOrKm === 'm' ? 'km' : 'm');
                    set_circle_radius(
                      inputMeterOrKm === 'm'
                        ? Math.round(circle_radius / 1000)
                        : circle_radius * 1000
                    );
                  }}
                />
                <label
                  htmlFor="toggle_m_or_km"
                  className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
                ></label>
              </div>
              <label
                className={`${
                  inputMeterOrKm === 'km'
                    ? 'text-gray-700 dark:text-gray-200'
                    : 'text-gray-200 dark:text-gray-700'
                }`}
              >
                Kilometers
              </label>
            </div>
          </>
        ) : null}
        {sliderOrInput === 'slider' ? (
          /* Slider to set the circle radius */

          <>
            <div className="w-full flex flex-wrap">
              <div className="flex flex-row justify-between">
                <p>0</p>
              </div>
              <input
                type="range"
                min="0"
                max="10000000"
                value={circle_radius}
                className="dark:text-gray-500 bg-white"
                onChange={(event) => {
                  set_circle_radius(parseFloat(event.target.value) || 0);
                }}
              />
              <div className="flex flex-row justify-between">
                <p>10,000,000</p>
              </div>
            </div>
            <div className="w-full">
              <p>
                Circle Radius:{' '}
                {circle_radius > 1000
                  ? `${circle_radius / 1000} km`
                  : `${circle_radius} meters`}{' '}
              </p>
            </div>
          </>
        ) : null}
      </div>
      {coordinates && (
        <div className="w-1/2  md:w-1/2 flex flex-col">
          <div className="w-full">
            <p>Coordinates (EPSG:3035):</p>
            <p>
              [{coordinates[0].toFixed(3)}, {coordinates[1].toFixed(3)}]
            </p>
          </div>

          <div className="w-full">
            <p> Coordinates (ESPG:4326) </p>
            <p>
              [{toLonLat(coordinates, 'EPSG:6933')[0].toFixed(4)},{' '}
              {toLonLat(coordinates, 'EPSG:6933')[1].toFixed(4)}]
            </p>
          </div>
        </div>
      )}
      <div className="w-1/2 flex flex-wrap flex-col">
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
