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
  'EPSG:54032',
  '+proj=aeqd +lat_0=90 +lon_0=0  +x_0=0 +y_0=0 +datum=WGS84 +units=m'
  //'+proj=aeqd +lat_0=0 +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs'
  // '+proj=aeqd +lat_0=0 +lon_0=0 +x_0=800 +y_0=800 +ellps=sphere +datum=WGS84 +units=m +no_defs'
);

//Proj4js.defs["EPSG:54032"] = "+proj=laea +lat_0=52 +lon_0=10 +x_0=4321000 +y_0=3210000 +ellps=GRS80 +units=m +no_defs";
register(proj4);

const proj54032 = getProjection('EPSG:54032');

if (!proj54032) {
  throw new Error('Projection not found');
}

//proj54032.setExtent([-10000000, -10000000, 10000000, 10000000]);

const MapComponent: React.FC = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [coordinates, setCoordinates] = useState<Coordinate | null>(null);

  const [circle_radius, set_circle_radius] = useState<number>(0.0);

  const circleVectorLayer = useRef<VectorLayer | null>(null);

  const gridVectorLayer = useRef<VectorLayer<VectorSource> | null>(null);

  const [sliderOrInput, setSliderOrInput] = useState<'slider' | 'input'>(
    'slider'
  );

  const [verticalCircleProjectedDistance, setVerticalCircleProjectedDistance] =
    useState<number>(0.0);
  const [
    horizontalCircleProjectedDistance,
    setHorizontalCircleProjectedDistance,
  ] = useState<number>(0.0);

  const distanceFromNorthPole = (coordinate: Coordinate): number => {
    //convert 54032 coordinate to 4326
    const convert_54032_to_4326 = (coordinate: Coordinate): Coordinate => {
      return toLonLat(coordinate, 'EPSG:54032');
    };

    //const northPole = [0, 90];
    const northPole = convert_54032_to_4326([0, 0]);

    const turf_point = turf.point(convert_54032_to_4326(coordinate));

    //set lon to 0

    const turf_north_pole = turf.point(northPole);

    const distance = turf.distance(turf_point, turf_north_pole, {
      units: 'meters',
    });

    return distance / 1000;
  };

  const eucledeanDistanceToNorthPole = (coordinate: Coordinate): number => {
    const northPole = [0, 90];

    const x1 = coordinate[0];
    const y1 = coordinate[1];

    const north_pool_54032 = toLonLat(northPole, 'EPSG:54032');

    //const x2 = north_pool_54032[0];
    //const y2 = north_pool_54032[1];

    const x2 = 0;
    const y2 = 0;

    const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

    return distance / 1000;
  };

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
        coords.push(fromLonLat([lon, lat], 'EPSG:54032'));
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
        coords.push(fromLonLat([lon, lat], 'EPSG:54032'));
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

      if (lon === -180 || lon === 180) {
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
      //return if Nan, null, or undefined
      if (isNaN(circle_radius)) return;
      //for coordinates
      if (coordinates[0] === null || coordinates[1] === null) return;
      if (coordinates[0] === undefined || coordinates[1] === undefined) return;
      if (isNaN(coordinates[0]) || isNaN(coordinates[1])) return;

      //convert 54032 coordinate to 4326
      const convert_54032_to_4326 = (coordinate: Coordinate): Coordinate => {
        return toLonLat(coordinate, 'EPSG:54032');
      };
      // use turf to create a circle
      const circle = turf.circle(
        convert_54032_to_4326(coordinates),
        circle_radius,
        {
          steps: 64,
          units: 'meters',
        }
      );

      const circle_points = circle.geometry.coordinates[0].map((coord) => {
        return fromLonLat(coord, 'EPSG:54032');
      });

      // convert the circle to a vector layer
      const circleFeature54032 = new Feature({
        geometry: new Polygon([circle_points]),
      });

      //@
      const projectedArea = circleFeature54032.getGeometry()?.getArea() || 0;

      if (!circleVectorLayer.current.getSource()) return;

      // add the circle to the vector layer
      //@ts-ignore
      circleVectorLayer.current.getSource().clear();

      //@ts-ignore
      circleVectorLayer.current.getSource().addFeature(circleFeature54032);

      //add center point
      //const centerPoint = new Point(coordinates);

      const center_point = new Feature({
        geometry: new Point(coordinates),
      });

      /// add line from bottom of circle to top of circleFeature54032

      //get the center coordinate in 4326
      const center_coord_4326 = toLonLat(coordinates, 'EPSG:54032');

      //it will be constant longitude, so add the meters in the direction of positive latitude
      const bearing = 0;

      const distance = circle_radius;

      const destination = turf.destination(
        turf.point(center_coord_4326),
        distance,
        bearing,
        {
          units: 'meters',
        }
      );

      const bearing_south = 180; //south pole, to get bottom of circle
      const destination_south = turf.destination(
        turf.point(center_coord_4326),
        distance,
        bearing_south,
        {
          units: 'meters',
        }
      );

      //draw a line from the top to the bottom
      const line = new Feature({
        geometry: new LineString([
          fromLonLat(destination_south.geometry.coordinates, 'EPSG:54032'),
          fromLonLat(destination.geometry.coordinates, 'EPSG:54032'),
        ]),
      });

      const verticalProjectedDistance = Math.sqrt(
        Math.pow(
          destination.geometry.coordinates[0] -
            destination_south.geometry.coordinates[0],
          2
        ) +
          Math.pow(
            destination.geometry.coordinates[1] -
              destination_south.geometry.coordinates[1],
            2
          )
      );

      setVerticalCircleProjectedDistance(verticalProjectedDistance);

      // to get horizontal projected difference,
      // find the circumfrence of the arc at that center latitude
      // multiply by the span of the circle

      //get the radius of the projection at that latitude, which is  euqal to the eucledian distance fomr the pole

      const lat_rad = (center_coord_4326[1] * Math.PI) / 180;

      const earth_circumfrence_at_lat =
        2 * Math.PI * 6371000 * Math.cos(lat_rad);

      const distance_ratio = circle_radius / earth_circumfrence_at_lat;

      const plus_minus_angle_degrees = distance_ratio * 360; //% of total circumfrence

      const point_1 = [
        center_coord_4326[0] - plus_minus_angle_degrees,
        center_coord_4326[1],
      ];

      const point_2 = [
        center_coord_4326[0] + plus_minus_angle_degrees,
        center_coord_4326[1],
      ];

      // get t
      const radius_at_center = Math.sqrt(
        coordinates[0] * coordinates[0] + coordinates[1] * coordinates[1]
      );

      //multiply by 2* pi * radius
      const horizontalProjectedDistance = 2 * Math.PI * radius_at_center;

      const lat_diff_radians = plus_minus_angle_degrees * (Math.PI / 180) * 2;

      // get the horizontal projected distance
      const horizontalProjectedDistance2 =
        (horizontalProjectedDistance * lat_diff_radians) / (2 * Math.PI);

      setHorizontalCircleProjectedDistance(horizontalProjectedDistance2);

      //draw from left to right
      const line2 = new Feature({
        geometry: new LineString([
          // from left to center, and then from center to right
          fromLonLat([point_1[0], point_1[1]], 'EPSG:54032'),
          fromLonLat(center_coord_4326, 'EPSG:54032'),
          fromLonLat([point_2[0], point_2[1]], 'EPSG:54032'),
        ]),
      });

      const prettifyMeasurement = (distance: number): string => {
        if (distance < 1000) {
          return `${distance.toFixed(0)} meters`;
        } else {
          return `${(distance / 1000).toFixed(2)} km`;
        }
      };

      // Set the style for the line with a label
      line2.setStyle(
        new Style({
          stroke: new Stroke({
            color: 'black',
            width: 2,
          }),
          text: new Text({
            font: '12px Calibri,sans-serif',
            text: `${prettifyMeasurement(
              horizontalProjectedDistance2
            )}X${prettifyMeasurement(2 * circle_radius)}. Area Ratio ${(
              projectedArea /
              (Math.PI * circle_radius * circle_radius)
            ).toFixed(2)} `,
            fill: new Fill({
              color: 'black',
            }),
            stroke: new Stroke({
              color: 'white',
              width: 3,
            }),
            offsetY: -10, // Adjust the label position\
            offsetX: 10,
          }),
        })
      );

      //add line to the vector layer
      //@ts-ignore
      //circleVectorLayer.current.getSource().addFeature(line2);

      center_point.setStyle(
        new Style({
          stroke: new Stroke({
            color: 'black',
            width: 2,
          }),
          text: new Text({
            text: `${verticalProjectedDistance.toFixed(0)} meters`,
            font: '12px Calibri,sans-serif',
            fill: new Fill({
              color: 'black',
            }),
            stroke: new Stroke({
              color: 'white',
              width: 3,
            }),
            offsetY: -10, // Adjust the label position
          }),
        })
      );
      //add line to the vector layer
      //@ts-ignore
      //circleVectorLayer.current.getSource().addFeature(line);

      //style solid
      center_point.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 5,
            fill: new Fill({ color: 'black' }),
          }),
          text: new Text({
            font: '12px Calibri,sans-serif',
            text: `${prettifyMeasurement(
              horizontalProjectedDistance2
            )} X ${prettifyMeasurement(2 * circle_radius)}. Area Ratio ${(
              projectedArea /
              (Math.PI * circle_radius * circle_radius)
            ).toFixed(2)} `,
            fill: new Fill({
              color: 'black',
            }),
            stroke: new Stroke({
              color: 'white',
              width: 3,
            }),
            offsetY: -10, // Adjust the label position\
            offsetX: 10,
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
          //projection: 'EPSG:54032',
          projection: 'EPSG:54032',
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

        const inter = toLonLat(clickedCoordinate, 'EPSG:54032');

        //return if either is NaN, null, or undefined
        if (inter[0] === null || inter[1] === null) return;
        if (inter[0] === undefined || inter[1] === undefined) return;
        if (isNaN(inter[0]) || isNaN(inter[1])) return;

        //round to nearest 3600th of a degree

        const clickedCoordinateDegrees = toLonLat(
          clickedCoordinate,
          'EPSG:54032'
        );

        console.log('Coordinate in degrees');
        console.log(clickedCoordinateDegrees);

        const roundings = 10000;

        clickedCoordinateDegrees[0] =
          Math.round(clickedCoordinateDegrees[0] * roundings) / roundings;

        clickedCoordinateDegrees[1] =
          Math.round(clickedCoordinateDegrees[1] * roundings) / roundings;

        const clickedCoordinate54032 = fromLonLat(
          clickedCoordinateDegrees,
          'EPSG:54032'
        );

        setCoordinates(clickedCoordinate54032);
      });

      return () => {
        map.setTarget('');
      };
    }
  }, []);

  return (
    <div className="w-full flex flex-wrap flex-row">
      <div ref={mapRef} style={{ width: '100%', height: '400px' }}></div>
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
              value={sliderOrInput}
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
        <div className="w-full md:w-1/2 flex flex-row flex-wrap">
          <div className="w-1/2 flex flex-col">
            <p>Coordinates (EPSG:54032) :</p>
            <p>
              [{coordinates[0].toFixed(3)}, {coordinates[1].toFixed(3)}]
            </p>
          </div>
          <div className="w-1/2 flex flex-col">
            <p>
              {' '}
              Coordinates (EPSG:4326) : [
              {toLonLat(coordinates, 'EPSG:54032')[0].toFixed(4)},
              {toLonLat(coordinates, 'EPSG:54032')[1].toFixed(4)}]
            </p>
          </div>

          <div className="w-full flex flex-col pt-5">
            <p>
              {' '}
              Distance to North Pole :{' '}
              {distanceFromNorthPole(coordinates).toFixed(4)} km
            </p>
            <p>
              {' '}
              Eucledean Distance to North Pole :{' '}
              {eucledeanDistanceToNorthPole(coordinates).toFixed(4)} km
            </p>
            <p>
              {' '}
              Ratio of Real Distance / Map Distance :{' '}
              {(
                distanceFromNorthPole(coordinates) /
                eucledeanDistanceToNorthPole(coordinates)
              ).toFixed(3)}
            </p>
          </div>
        </div>
      )}
      <div className="w-full md:w-1/2 flex-col flex">
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
