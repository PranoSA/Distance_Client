'use client';

//import tailwind globals next.js
import '@/app/globals.css';
import LZString from 'lz-string';
import React, { useEffect, useRef, useState } from 'react';

import { WalkingTrip, WalkingPath } from '@/definitions/Walking_View';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { Circle, Fill, Stroke, Style } from 'ol/style';
import { buffer as OLBuffer } from 'ol/extent';

import { Feature, Map as OLMap, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import { fromLonLat, Projection, toLonLat, getUserProjection } from 'ol/proj';
import { OSM } from 'ol/source';
import { Geometry, LineString, Point } from 'ol/geom';
import Modify, { ModifyEvent } from 'ol/interaction/Modify';
import Draw from 'ol/interaction/Draw';

import { getDistance } from 'ol/sphere';
import { Coordinate, distance } from 'ol/coordinate';
import { getLength } from 'ol/sphere';
import { shiftKeyOnly } from 'ol/events/condition';

import * as turf from '@turf/turf';
import { buffer } from 'stream/consumers';

import { Destination } from '@/definitions/Destinations';
import { AddDestinationModal } from '@/components/AddDestinationModa';

import {
  update_url_based_on_path_string,
  retrieve_path_from_url,
} from '@/components/app/Utils_Url';

import { normalizeCoordinate } from '@/components/app/Coordinates_Utils';

const WalkinPathPage: React.FC = () => {
  const [trip, setTrip] = useState<WalkingTrip>({
    id: 1,
    name: 'Trip 1',
    paths: [],
    description: 'This is a trip',
    start_date: '2021-09-01',
    end_date: '2021-09-10',
  });

  const [milesOrKm, setMilesOrKm] = useState<'miles' | 'km'>('miles');

  const tripRef = useRef<WalkingTrip>({
    id: 1,
    name: 'Trip 1',
    paths: [],
    description: 'This is a trip',
    start_date: '2021-09-01',
    end_date: '2021-09-10',
  });

  type EditAction = {
    type: 'add' | 'remove' | 'edit' | 'clear';
    index: number; //only applicable to edit (for now) and later remove
    coordinate: Coordinate[]; //only applicable to reset
  };

  const editHistory = useRef<EditAction[]>([]);

  const [distanceTo, setDistanceTo] = useState<number[]>([]);
  const [nonProjectedDistance, setNonProjectedDistance] = useState<number[]>(
    []
  );

  const distanceAlongLineString = (lineString: LineString): number => {
    // split the line string into 100 points
    const points = lineString.getCoordinates();

    //split the line string into 100 points

    const num_steps = 2500;
    const gradient =
      (points[1][1] - points[0][1]) / (points[1][0] - points[0][0]);
    const step = (points[1][0] - points[0][0]) / (num_steps - 1);

    const new_points: Coordinate[] = [];

    for (let i = 0; i < num_steps; i++) {
      new_points.push([
        points[0][0] + i * step,
        points[0][1] + i * gradient * step,
      ]);
    }

    // return distance along the new line string
    return new_points.reduce((acc, point, index) => {
      if (index === 0) {
        return 0;
      }

      const current_point_4326 = toLonLat([point[0], point[1]]);
      const previous_point_4326 = toLonLat([
        new_points[index - 1][0],
        new_points[index - 1][1],
      ]);

      return acc + getDistance(previous_point_4326, current_point_4326);
    }, 0);

    //get the distance of each point to the next point
    const distances = points.map((point, index) => {
      if (index === points.length - 1) {
        return 0;
      }

      // transform to 4326??

      const point_4326 = toLonLat([point[0], point[1]]);
      const next_point_4326 = toLonLat([
        points[index + 1][0],
        points[index + 1][1],
      ]);

      return getDistance(point_4326, next_point_4326);
    });

    //sum the distances
    const total_distance = distances.reduce((acc, distance) => {
      return acc + distance;
    }, 0);

    return total_distance;
  };

  const previousShortestDistanceArc = useRef<Feature | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.ctrlKey && event.key === 'z') {
        const last_action = editHistory.current.pop();

        if (!last_action) return;

        if (last_action.type === 'add') {
          setTrip({
            ...tripRef.current,
            paths: tripRef.current.paths.slice(
              0,
              tripRef.current.paths.length - 1
            ),
          });

          tripRef.current = {
            ...tripRef.current,
            paths: tripRef.current.paths.slice(
              0,
              tripRef.current.paths.length - 1
            ),
          };
        }

        if (last_action.type === 'clear') {
          //get the coordinate
          const coordinate = last_action.coordinate;

          //get the index
          const index = last_action.index;

          //replace the newer coordinate with the stored old coordinate in histroy
          const old_coordinate = last_action.coordinate;

          const new_trip: WalkingTrip = {
            ...tripRef.current,
            paths: old_coordinate.map((coord) => {
              return { lat: coord[1], long: coord[0] };
            }),
          };

          setTrip(new_trip);

          tripRef.current = new_trip;
        }

        if (last_action.type === 'edit') {
          //get the coordinate
          const coordinate = last_action.coordinate;

          //get the index
          const index = last_action.index;

          //replace the newer coordinate with the stored old coordinate in histroy
          const old_coordinate = last_action.coordinate[0];

          const new_trip: WalkingTrip = {
            ...tripRef.current,
            paths: [
              ...tripRef.current.paths.slice(0, index),
              { lat: old_coordinate[1], long: old_coordinate[0] },
              ...tripRef.current.paths.slice(index + 1),
            ],
          };

          setTrip(new_trip);

          tripRef.current = new_trip;
        }
      } else if (event.key === 'Backspace') {
        if (openDestinationModal) {
          return;
        }
        if (searchRef.current) {
          return;
        }

        console.log('Backspace Pressed');

        //return if search Index Modal is open
        if (modalIndex !== null) {
          return;
        }
        // Handle Backspace
        setTrip({
          ...tripRef.current,
          paths: tripRef.current.paths.slice(0, trip.paths.length - 1),
        });

        tripRef.current = {
          ...tripRef.current,
          paths: tripRef.current.paths.slice(
            0,
            tripRef.current.paths.length - 1
          ),
        };
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Clean up event listener on unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const mapRef = useRef<HTMLDivElement>(null);
  const vectorSourceRef = useRef<VectorSource>(new VectorSource());
  const arcSourceRef = useRef<VectorSource>(new VectorSource());
  const mapInstanceRef = useRef<OLMap | null>(null);

  const [modalIndex, setModalIndex] = useState<number | null>(null);

  const [openDestinationModal, setOpenDestinationModal] =
    useState<boolean>(false);

  const searchRef = useRef<boolean>(false);

  type WhatToDo = 'subtract' | 'none' | 'add';

  const findOutWhatToDoFromPoints = (
    lat1: number,
    long1: number,
    lat2: number,
    long2: number
  ): WhatToDo => {
    //

    return 'none';
  };

  //on mount useEffect, un compress the path to the coordinate
  useEffect(() => {
    //get the path from the URL
    const path_json_new = retrieve_path_from_url();

    //set history
    path_json_new.forEach((path) => {
      editHistory.current.push({
        type: 'add',
        index: tripRef.current.paths.length - 1,
        coordinate: [[path.long, path.lat]],
      });
    });

    // Set the trip
    setTrip({
      ...trip,
      name: 'Loaded From URL',
      paths: path_json_new,
    });

    //trip ref
    tripRef.current = {
      ...tripRef.current,
      name: 'Loaded From URL',
      paths: path_json_new,
    };

    return;
  }, []);

  // compress the path, and save it to the url
  useEffect(() => {
    //take trip to be th tripRef.current for now on

    update_url_based_on_path_string(tripRef.current);
    console.log('Trip has changed', trip);
  }, [trip]);

  //append a coordinate to the path
  const appendCoordinate = (lat: number, long: number) => {
    if (trip) {
      if (tripRef.current.paths.length > 0) {
        const naive_eucledian_distance = Math.sqrt(
          Math.pow(
            lat - tripRef.current.paths[tripRef.current.paths.length - 1].lat,
            2
          ) +
            Math.pow(
              long -
                tripRef.current.paths[tripRef.current.paths.length - 1].long,
              2
            )
        );

        const circumfrence_earth = 40075000;

        //

        const what_to_do = findOutWhatToDoFromPoints(
          tripRef.current.paths[tripRef.current.paths.length - 1].lat,
          tripRef.current.paths[tripRef.current.paths.length - 1].long,
          lat,
          long
        );

        if (what_to_do === 'subtract') {
          long -= 20037508.34 * 2;
        }

        if (what_to_do === 'add') {
          long += 20037508.34 * 2;
        }
      }

      const new_trip = {
        ...tripRef.current,
        name: 'Trip Been Updated',
        paths: [...tripRef.current.paths, { lat, long }],
      };

      tripRef.current = new_trip;

      setTrip(new_trip);

      tripRef.current = new_trip;
      //append to history
      editHistory.current.push({
        type: 'add',
        index: tripRef.current.paths.length - 1,
        coordinate: [[long, lat]],
      });
    }
  };

  const zoomToPath = () => {
    {
      if (mapInstanceRef.current) {
        const coordinates = trip.paths.map((path) => [path.long, path.lat]);

        const lineString = new LineString(coordinates);

        const extent = lineString.getExtent();

        // 30% buffer
        const expandedExtent = OLBuffer(extent, 0.7);

        mapInstanceRef.current.getView().fit(expandedExtent, {
          padding: [100, 100, 100, 100],
        });
      }
    }
  };

  //Call this with the list of point geometries to update the path
  const newCoordinatesFromEdit = () => {
    //const featureArray = Array.from(features);
    const features = vectorSourceRef.current.getFeatures();

    const newPaths: {
      lat: number;
      long: number;
    }[] = [];

    const old_paths = tripRef.current.paths;

    //filter features to only get the points
    const points: Feature<Geometry>[] = features.filter((feature) => {
      // @ts-ignore
      return feature.getGeometry().getType() === 'Point';
    });

    const found_index: boolean[] = old_paths.map((path) => {
      return false;
    });

    const changed_coordinate = {
      lat: 0,
      long: 0,
    };

    points.forEach((feature, i) => {
      // Get all features from the vector source
      //const features = vectorSourceRef.current.getFeatures();

      const type = feature.getGeometry()?.getType();

      if (type !== 'Point') return;

      // @ts-ignore
      const coordinates = feature.getGeometry().getCoordinates();

      newPaths.push({ lat: coordinates[1], long: coordinates[0] });

      //see if its different from the old path
      //if it is, then update the path

      const old_coordinate = old_paths[i];

      if (!old_coordinate) {
        return;
      }

      //if there is a coordinate and it is the same as the new coordinate

      const existingCoordinate = old_paths.find((path) => {
        return path.lat === coordinates[1] && path.long === coordinates[0];
      });

      //find the index and mark it as found
      const found_index_ter = old_paths.findIndex((path) => {
        return path.lat === coordinates[1] && path.long === coordinates[0];
      });

      found_index[found_index_ter] = true;

      if (existingCoordinate) {
        return;
      }
      changed_coordinate.lat = coordinates[1];
      changed_coordinate.long = coordinates[0];
    });

    //place changed_coordinate into the old_paths at the unfound index

    const unfound_index = found_index.findIndex((found) => {
      return !found;
    });

    if (unfound_index !== -1) {
      const old_coordinate = old_paths[unfound_index];

      old_paths[unfound_index] = changed_coordinate;

      //make a copy of the old long and lat
      const old_long = old_coordinate.long;
      const old_lat = old_coordinate.lat;

      //update history with old coordinate
      editHistory.current.push({
        type: 'edit',
        index: unfound_index,
        coordinate: [[old_long, old_lat]],
      });
    }

    setTrip({
      ...trip,
      paths: old_paths,
    });

    tripRef.current = {
      ...tripRef.current,
      paths: old_paths,
    };

    return;
  };

  const modifyStart = () => {
    //find all the feature of type point and print them
    const features = vectorSourceRef.current.getFeatures();

    features.forEach((feature) => {
      const type = feature.getGeometry()?.getType();

      if (type !== 'Point') return;

      // @ts-ignore
      const coordinates = feature.getGeometry().getCoordinates();
    });
  };

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      const vectorLayer = new VectorLayer({
        source: vectorSourceRef.current,
        style: new Style({
          image: new Circle({
            radius: 5,
            fill: new Fill({ color: 'red' }),
          }),
          stroke: new Stroke({
            color: 'blue',
            width: 2,
          }),
        }),
      });

      const arcLayer = new VectorLayer({
        source: arcSourceRef.current,
        style: new Style({
          stroke: new Stroke({
            color: 'yellow',
            width: 6,
          }),
        }),
      });

      //create OSM layer
      //clean it up, because the markings are taking up too much space
      // and I can't click on points on the top third of the screen

      const OSM_layer = new TileLayer({
        source: new OSM(),
        //@ts-ignore
        wrapX: false,
      });

      //OSM layer is blocking interaction with the map
      // z-index is 0, still doing it

      //OSM_layer.getAttributions().fill('SOME ATTRIBUTION');

      OSM_layer.setZIndex(0);
      arcLayer.setZIndex(1);
      vectorLayer.setZIndex(2);

      //get rid of copyright
      // and the attributions

      const map = new OLMap({
        target: mapRef.current,
        layers: [OSM_layer, vectorLayer, arcLayer],
        view: new View({
          center: fromLonLat([0, 0]),
          zoom: 2,
          multiWorld: false,
          extent: [-20037508.34, -20048966.1, 20037508.34, 20048966.1],
          //@ts-ignore
          wrapX: true,
          projection: new Projection({
            code: 'EPSG:3857',
            units: 'm',
            axisOrientation: 'neu',
            global: true,
            metersPerUnit: 1,
            worldExtent: [-20037508.34, -20037508.34, 20037508.34, 20037508.34],
            extent: [-20037508.34, -20037508.34, 20037508.34, 20037508.34],
          }),
        }),
      });

      //new layer
      const vectorSource = new VectorSource({
        features: [],
        wrapX: true,
      });

      //add styling to the line
      const mevectorLayer = new VectorLayer({
        source: vectorSource,

        style: new Style({
          stroke: new Stroke({
            color: 'red',
            width: 9,
          }),
        }),
      });

      //add the layer to the map
      map.addLayer(mevectorLayer);

      //draw it now

      mapInstanceRef.current = map;

      // Click handler to add a new point
      map.on('singleclick', (event) => {
        console.log('YO I SEE A SINGLE CLICK >>> WOOOT!!!!');
        if (shiftKeyOnly(event)) {
          //find the point feature on the vectorSourceRef that was clicked

          const features = vectorSourceRef.current.getFeatures();

          // Find the feature that was clicked
          const clickedFeature = map.forEachFeatureAtPixel(
            event.pixel,
            (feature) => {
              const geometry = feature.getGeometry();
              if (!geometry) return null;
              if (geometry.getType() === 'Point') {
                return feature;
              }
              return null;
            }
          );

          if (!clickedFeature) {
            setModalIndex(null);
            return;
          }

          //if type array, then select the first element

          const point = clickedFeature?.getGeometry();

          //get the coordinates of the point
          // @ts-ignore
          const coordinates = point?.getCoordinates();

          //find the index of the point in the trip.paths
          let index = tripRef.current.paths.findIndex(
            (path) =>
              path.lat === coordinates[1] && path.long === coordinates[0]
          );

          //now try offset by 2*20037508.34
          if (index === -1) {
            let index = tripRef.current.paths.findIndex(
              (path) =>
                path.lat === coordinates[1] &&
                path.long + 20037508.34 === coordinates[0]
            );
          }

          //now try offset by -2*20037508.34
          if (index === -1) {
            let index = tripRef.current.paths.findIndex(
              (path) =>
                path.lat === coordinates[1] &&
                path.long - 20037508.34 === coordinates[0]
            );
          }

          if (index === -1) {
            setModalIndex(null);
            return;
          }

          setModalIndex(index);

          return;
        }

        const coordinates = event.coordinate;
        const point = new Point(coordinates);
        const feature = new Feature(point);
        vectorSourceRef.current.addFeature(feature);

        appendCoordinate(coordinates[1], coordinates[0]);
      });

      map.on('dblclick', (event) => {
        //find the point feature on the vectorSourceRef that was clicked

        const features = vectorSourceRef.current.getFeatures();

        // Find the feature that was clicked
        const clickedFeature = map.forEachFeatureAtPixel(
          event.pixel,
          (feature) => {
            const geometry = feature.getGeometry();
            if (!geometry) return null;
            if (geometry.getType() === 'Point') {
              return feature;
            }
            return null;
          }
        );

        if (!clickedFeature) {
          setModalIndex(null);
          return;
        }

        //if type array, then select the first element

        const point = clickedFeature?.getGeometry();

        //get the coordinates of the point
        // @ts-ignore
        const coordinates = point?.getCoordinates();

        //find the index of the point in the trip.paths
        const index = tripRef.current.paths.findIndex(
          (path) => path.lat === coordinates[1] && path.long === coordinates[0]
        );

        if (index === -1) {
          setModalIndex(null);
          return;
        }

        setModalIndex(index);
      });

      // Modify interaction to drag and edit points
      const modify = new Modify({
        source: vectorSourceRef.current,
        insertVertexCondition: shiftKeyOnly,
      });

      modify.on('modifystart', (event) => {
        const number_map_features =
          vectorSourceRef.current.getFeatures().length;

        modifyStart();
      });

      modify.on('modifyend', (event) => {
        //print information about the feature
        const feature_event = event.features.getArray();

        for (let i = 0; i < feature_event.length; i++) {
          const feature = feature_event[i];
          const type = feature.getGeometry()?.getType();

          //if type line string, then add the

          //don't return, go to next iteration
          if (type !== 'Point') continue;

          // @ts-ignore
          const coordinates = feature.getGeometry().getCoordinates();
        }

        const number_map_features =
          vectorSourceRef.current.getFeatures().length;

        newCoordinatesFromEdit();
      });

      map.addInteraction(modify);
    }
  }, [mapRef.current]);

  useEffect(() => {
    // Clear existing features
    vectorSourceRef.current.clear();
    arcSourceRef.current.clear();
    console.log('Features Cleared');

    // Add new features for each path
    const features = trip.paths.map((path) => {
      const point = new Point(fromLonLat([path.long, path.lat], 'EPSG:4326'));
      return new Feature(point);
    });

    vectorSourceRef.current.addFeatures(features);

    const projectedDistance: number[] = [];
    const unProjectedDistance: number[] = [];

    //calcualte the line string by iterating starting from
    // 0-1, 1-2
    if (trip.paths.length > 1) {
      // do not uyse fromLonLat, I want to keep the coordinates in the same format
      // you need to draw the line from the previous coordinate to the current coordinate
      // and then from the current coordinate to the next coordinate
      trip.paths.forEach((path, index) => {
        if (index === 0) return;

        const previous = trip.paths[index - 1];
        const current = trip.paths[index];

        //const too_long = length_line > cirumfrence_average_between_ends / 2;

        //if too lng, subtract 20037508.34*2 from the longitudes
        // and then draw the line

        // if its ahead of the previous point, then subtract
        // if its behind the previous point, then add

        const what_to_do = findOutWhatToDoFromPoints(
          previous.lat,
          previous.long,
          current.lat,
          current.long
        );

        if (what_to_do === 'subtract') {
          current.long -= 20037508.34 * 2;
        }

        if (what_to_do === 'add') {
          current.long += 20037508.34 * 2;
        }

        if (what_to_do !== 'none') {
          tripRef.current = {
            ...tripRef.current,
            paths: [
              ...tripRef.current.paths.slice(0, index),
              { lat: current.lat, long: current.long },
              ...tripRef.current.paths.slice(index + 1),
            ],
          };

          setTrip({
            ...trip,
            paths: [
              ...trip.paths.slice(0, index),
              { lat: current.lat, long: current.long },
              ...trip.paths.slice(index + 1),
            ],
          });
        }

        const lineString = new LineString([
          [previous.long, previous.lat],
          [current.long, current.lat],
        ]);

        const color_red = Math.floor((255 * (index + 1)) / trip.paths.length);

        const color = `rgb(${color_red},${255 - color_red}, ${
          255 - color_red
        })`;

        //along side, draw the shortest path between the two points
        //using turf and openlayers

        //convert to 4326 for turf
        const prev_4326 = toLonLat([previous.long, previous.lat]);
        const current_4326 = toLonLat([current.long, current.lat]);

        const circle_arc = turf.greatCircle(
          turf.point(prev_4326),
          turf.point(current_4326)
          //[previous.long, previous.lat],
          //[current.long, current.lat]
        );

        //convert to 3857
        const circle_arc_3857 = circle_arc.geometry.coordinates.map((coord) =>
          // its laready in 3857
          //@ts-ignore
          fromLonLat(coord)
        );
        //print length of arc

        //convert to coordinate

        const lineString_3857 = new LineString(circle_arc_3857);

        const length_of_arc = turf.length(circle_arc, {
          units: 'meters',
        });

        const lineFeature = new Feature(lineString);

        let crosses_meridian = circle_arc_3857.length === 2;

        //What's another way to tell if it crosses the meridian?
        if (!crosses_meridian) {
          //tell if circler arc goes from
          if (previous.long > 0) {
            //draw a line that crosses the meridian and see if its shorter
            const distance_to_meridian = 20037508.34 - previous.long;
            const meridian_to_current = 20037508.34 + current.long;

            const gradient =
              (current.lat - previous.lat) /
              (meridian_to_current + distance_to_meridian);

            //create the first line segment using the gradient to the meridian
            const coord_part_1 = [
              [previous.long, previous.lat],
              [20037508.34, previous.lat + gradient * distance_to_meridian],
            ];

            //create the second line segment using the gradient to the meridian
            const coord_part_2 = [
              [-20037508.34, current.lat - gradient * meridian_to_current],
              [current.long, current.lat],
            ];

            // create the line strings to measure the length
            const lineString_3857_part_1 = new LineString(coord_part_1);

            const lineString_3857_part_2 = new LineString(coord_part_2);

            //set distance on point by adding length of the two line segments
            const distance_of_line_1_euclidean = Math.sqrt(
              Math.pow(coord_part_1[0][0] - coord_part_1[1][0], 2) +
                Math.pow(coord_part_1[0][1] - coord_part_1[1][1], 2)
            );

            const distance_of_line_2_euclidean = Math.sqrt(
              Math.pow(coord_part_2[0][0] - coord_part_2[1][0], 2) +
                Math.pow(coord_part_2[0][1] - coord_part_2[1][1], 2)
            );
            const distance =
              distance_of_line_1_euclidean + distance_of_line_2_euclidean;

            const distance_eucledian_of_single_line = Math.sqrt(
              Math.pow(previous.long - current.long, 2) +
                Math.pow(previous.lat - current.lat, 2)
            );

            if (distance < distance_eucledian_of_single_line) {
              //add the line string to the vector source
              //vectorSourceRef.current.addFeature(lineFeature);

              crosses_meridian = true;

              //style feature according to this
            }
          }
          if (previous.long < 0) {
            const distance_to_meridian = 20037508.34 + previous.long;
            const meridian_to_current = 20037508.34 - current.long;

            const gradient =
              (current.lat - previous.lat) /
              (meridian_to_current + distance_to_meridian);

            //create the first line segment using the gradient to the meridian
            const coord_part_1 = [
              [previous.long, previous.lat],
              [-20037508.34, previous.lat + gradient * distance_to_meridian],
            ];

            //create the second line segment using the gradient to the meridian
            const coord_part_2 = [
              [20037508.34, current.lat - gradient * meridian_to_current],
              [current.long, current.lat],
            ];

            //add feature and vector source
            const lineString_3857_part_1 = new LineString(
              coord_part_1.map((coord) => coord)
            );

            const lineString_3857_part_2 = new LineString(
              coord_part_2.map((coord) => coord)
            );

            //set distance on point by adding length of the two line segments
            const distance_of_line_1_euclidean = Math.sqrt(
              Math.pow(coord_part_1[0][0] - coord_part_1[1][0], 2) +
                Math.pow(coord_part_1[0][1] - coord_part_1[1][1], 2)
            );

            const distance_of_line_2_euclidean = Math.sqrt(
              Math.pow(coord_part_2[0][0] - coord_part_2[1][0], 2) +
                Math.pow(coord_part_2[0][1] - coord_part_2[1][1], 2)
            );

            const distance =
              distance_of_line_1_euclidean + distance_of_line_2_euclidean;

            const distance_eucledian_of_single_line = Math.sqrt(
              Math.pow(previous.long - current.long, 2) +
                Math.pow(previous.lat - current.lat, 2)
            );

            if (distance < distance_eucledian_of_single_line) {
              //add the line string to the vector source
              //vectorSourceRef.current.addFeature(lineFeature);

              crosses_meridian = true;

              //style feature according to this
            }
          }
        }

        if (crosses_meridian) {
          // if coordinate 1 is [-180,0] then clearly it crosses the [-180 ] meridian
          //if coordinate 2 is [180,0] then clearly it crosses the [180] meridian

          //stop using the circle_arc, that has nothing to do with this

          //just use the line line coordiantes

          if (previous.long > 0) {
            ///add the distance of the current coordinate to the meridian
            // and the distance of the previous coordinate to the meridian
            const distance_to_meridian = 20037508.34 - previous.long;
            const meridian_to_current = 20037508.34 + current.long;

            const gradient =
              (current.lat - previous.lat) /
              (meridian_to_current + distance_to_meridian);

            //create the first line segment using the gradient to the meridian
            const coord_part_1 = [
              [previous.long, previous.lat],
              [20037508.34, previous.lat + gradient * distance_to_meridian],
            ];

            //create the second line segment using the gradient to the meridian
            const coord_part_2 = [
              [-20037508.34, current.lat - gradient * meridian_to_current],
              [current.long, current.lat],
            ];

            //add feature and vector source
            const lineString_3857_part_1 = new LineString(coord_part_1);

            const lineString_3857_part_2 = new LineString(coord_part_2);

            const lineFeature_1 = new Feature(lineString_3857_part_1);

            const lineFeature_2 = new Feature(lineString_3857_part_2);

            //style feature according to this

            //divide 255 by the current index divided by the length of the path
            // so that the color is more intense at the start and less intense at the end

            //style
            lineFeature_1.setStyle(
              new Style({
                stroke: new Stroke({
                  color: color,
                  width: 6,
                }),
              })
            );

            lineFeature_2.setStyle(
              new Style({
                stroke: new Stroke({
                  color: color,
                  width: 6,
                }),
              })
            );

            vectorSourceRef.current.addFeature(lineFeature_1);

            vectorSourceRef.current.addFeature(lineFeature_2);

            //set distance on point by adding length of the two line segments
            const distance_of_line_1 = getLength(lineString_3857_part_1, {
              projection: 'EPSG:3857',
            });

            const distance_of_line_2 = getLength(lineString_3857_part_2, {
              projection: 'EPSG:3857',
            });
            const dist = distance_of_line_1 + distance_of_line_2;

            //const new_distance_list: number[] = distanceTo.slice(0, index);
            //new_distance_list.push(dist);

            //set distance on point by adding length of the two line segments
            const distance_of_line_1_euclidean = Math.sqrt(
              Math.pow(coord_part_1[0][0] - coord_part_1[1][0], 2) +
                Math.pow(coord_part_1[0][1] - coord_part_1[1][1], 2)
            );

            const distance_of_line_2_euclidean = Math.sqrt(
              Math.pow(coord_part_2[0][0] - coord_part_2[1][0], 2) +
                Math.pow(coord_part_2[0][1] - coord_part_2[1][1], 2)
            );

            const new_distance_list: number[] = distanceTo.slice(0, index);
            new_distance_list.push(
              distance_of_line_1_euclidean + distance_of_line_2_euclidean
            );

            //set the distance on the point

            projectedDistance.push(
              distance_of_line_1_euclidean + distance_of_line_2_euclidean
            );

            //const
            const non_projected_distance =
              distance_of_line_1 + distance_of_line_2;

            /*unProjectedDistance.push(
              lineString_3857_part_1.getLength() +
                lineString_3857_part_2.getLength()
            );*/
            const distance_lines =
              distanceAlongLineString(lineString_3857_part_1) +
              distanceAlongLineString(lineString_3857_part_2);

            unProjectedDistance.push(distance_lines);

            // unProjectedDistance.push(non_projected_distance);
          }

          //if the previous coordinate is less than 0
          if (previous.long < 0) {
            ///add the distance of the current coordinate to the meridian
            // and the distance of the previous coordinate to the meridian
            const distance_to_meridian = 20037508.34 + previous.long;
            const meridian_to_current = 20037508.34 - current.long;

            const gradient =
              (current.lat - previous.lat) /
              (meridian_to_current + distance_to_meridian);

            //create the first line segment using the gradient to the meridian
            const coord_part_1 = [
              [previous.long, previous.lat],
              [-20037508.34, previous.lat + gradient * distance_to_meridian],
            ];

            //create the second line segment using the gradient to the meridian
            const coord_part_2 = [
              [20037508.34, current.lat - gradient * meridian_to_current],
              [current.long, current.lat],
            ];

            //add feature and vector source
            const lineString_3857_part_1 = new LineString(
              coord_part_1.map((coord) => coord)
            );

            const lineString_3857_part_2 = new LineString(
              coord_part_2.map((coord) => coord)
            );

            const lineFeature_1 = new Feature(lineString_3857_part_1);

            const lineFeature_2 = new Feature(lineString_3857_part_2);

            //style
            lineFeature_1.setStyle(
              new Style({
                stroke: new Stroke({
                  color: color,
                  width: 6,
                }),
              })
            );

            lineFeature_2.setStyle(
              new Style({
                stroke: new Stroke({
                  color: color,
                  width: 6,
                }),
              })
            );

            const length_combined_line =
              getLength(lineString_3857_part_1, {
                projection: 'EPSG:3857',
              }) +
              getLength(lineString_3857_part_2, {
                projection: 'EPSG:3857',
              });

            vectorSourceRef.current.addFeature(lineFeature_1);

            vectorSourceRef.current.addFeature(lineFeature_2);

            //set distance on point by adding length of the two line segments
            const distance_of_line_1_euclidean = Math.sqrt(
              Math.pow(coord_part_1[0][0] - coord_part_1[1][0], 2) +
                Math.pow(coord_part_1[0][1] - coord_part_1[1][1], 2)
            );

            const distance_of_line_2_euclidean = Math.sqrt(
              Math.pow(coord_part_2[0][0] - coord_part_2[1][0], 2) +
                Math.pow(coord_part_2[0][1] - coord_part_2[1][1], 2)
            );

            const new_distance_list: number[] = distanceTo.slice(0, index);
            new_distance_list.push(
              distance_of_line_1_euclidean + distance_of_line_2_euclidean
            );

            //set the distance on the point
            projectedDistance.push(
              distance_of_line_1_euclidean + distance_of_line_2_euclidean
            );

            /*unProjectedDistance.push(
              lineString_3857_part_1.getLength() +
                lineString_3857_part_2.getLength()
            );*/
            const distance_lines =
              distanceAlongLineString(lineString_3857_part_1) +
              distanceAlongLineString(lineString_3857_part_2);

            unProjectedDistance.push(distance_lines);
          }
        } else {
          //style line feature
          if (!crosses_meridian) {
          }

          /*          const distance_of_line = getLength(lineString_3857, {
            projection: 'EPSG:3857',
          });
*/

          const distance_of_line_euclidean = Math.sqrt(
            Math.pow(previous.long - current.long, 2) +
              Math.pow(previous.lat - current.lat, 2)
          );
          //set the distance on the point

          projectedDistance.push(distance_of_line_euclidean);

          //set projection

          if (lineString === null) {
            console.log('WHAT THE HECK!!!');
          }

          lineFeature.setStyle(
            new Style({
              stroke: new Stroke({
                color: color,
                width: 6,
              }),
            })
          );

          vectorSourceRef.current.addFeature(lineFeature);

          const outer_non_projected_distance = getLength(lineString, {
            projection: 'EPSG:3857',
          });

          //set the distance on the point
          //unProjectedDistance.push(lineString.getLength());
          const distance_lines = distanceAlongLineString(lineString);
          //unProjectedDistance.push(outer_non_projected_distance);
          unProjectedDistance.push(distance_lines);
        }

        console.log('Length of Arc:', length_of_arc);

        //calculate the gradient difference
        //[y2-y1]/[x2-x1]
        const gradient_of_straight_line =
          (current.lat - previous.lat) / (current.long - previous.long);

        const gradient_start_of_arc =
          (circle_arc_3857[1][1] - circle_arc_3857[0][1]) /
          (circle_arc_3857[1][0] - circle_arc_3857[0][0]);

        //find the angle between the two gradients
        //if the angle is more than 10 degrees, then draw the line

        //add reasoning for the direction of the angle

        //atan might be [-pi/2, pi/2]
        //reason if its actually [pi/2, 3pi/2]

        // if these are opposite, always print the angle

        const angle_straight_line = Math.atan(gradient_of_straight_line);

        const angle_start_of_arc = Math.atan(gradient_start_of_arc);

        /* console.log('Angle:', angle);

        //if the angle is more than 20 degrees, then draw the line
        if (Math.abs(angle) < 0.17) {
          return;
        }*/

        const angle_difference = Math.abs(
          angle_straight_line - angle_start_of_arc
        );

        console.log('Angle Difference:', angle_difference);

        //const lineString_3857 = new LineString(circle_arc_3857);
        //style the arc line
        const new_arc_feature = new Feature(lineString_3857);

        //check if the arc is pslit intwo two columns
        // if it is , draw both

        if (circle_arc_3857.length === 2) {
          const coord_part_1 = circle_arc_3857[0].filter((coord, i) => {
            //if either [0] or [1] is NaN, then remove

            //@ts-ignore
            if (isNaN(coord[0])) {
              return false;
            }
            //@ts-ignore
            if (isNaN(coord[1])) {
              return false;
            }
            return true;
          });

          //trimp out any long or

          //convert to 3857
          const coord_part_1_3857 = coord_part_1.map((coord) =>
            // @ts-ignore
            fromLonLat(coord)
          );

          const coord_part_2 = circle_arc_3857[1].filter((coord, i) => {
            //if either [0] or [1] is NaN, then remove
            //@ts-ignore
            if (isNaN(coord[0])) {
              return false;
            }
            //@ts-ignore
            if (isNaN(coord[1])) {
              return false;
            }
            return true;
          });

          //convert to 3857
          const coord_part_2_3857 = coord_part_2.map((coord) =>
            // @ts-ignore
            fromLonLat(coord)
          );

          //if there  is a split, there shold also be a split with the line

          //do another check for angle difference
          const gradient_start_of_arc_1 =
            (coord_part_1_3857[1][1] - coord_part_1_3857[0][1]) /
            (coord_part_1_3857[1][0] - coord_part_1_3857[0][0]);

          const new_angle_difference = Math.abs(
            Math.atan(gradient_of_straight_line) -
              Math.atan(gradient_start_of_arc_1)
          );

          console.log('New angle difference:', new_angle_difference);
          if (new_angle_difference < 0.17) {
            console.log('');
            return;
          }

          const arc_feature_1 = new Feature(new LineString(coord_part_1_3857));

          const arc_feature_2 = new Feature(new LineString(coord_part_2_3857));

          arc_feature_1.setStyle(
            new Style({
              stroke: new Stroke({
                color: 'yellow',
                width: 6,
              }),
            })
          );

          arc_feature_2.setStyle(
            new Style({
              stroke: new Stroke({
                color: 'yellow',
                width: 6,
              }),
            })
          );

          arcSourceRef.current.addFeature(arc_feature_1);
          arcSourceRef.current.addFeature(arc_feature_2);

          return;
        }

        if (angle_difference < 0.17) {
          return;
        }

        //style the arc line lightyellow
        new_arc_feature.setStyle(
          new Style({
            stroke: new Stroke({
              color: 'yellow',
              width: 6,
            }),
          })
        );

        arcSourceRef.current.addFeature(new_arc_feature);

        //add the line string to the vector source
        //vectorSourceRef.current.addFeature(new_arc_feature);
      });

      setDistanceTo(projectedDistance);
      setNonProjectedDistance(unProjectedDistance);
    }

    //add the vector source to the map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.addLayer(
        new VectorLayer({
          source: vectorSourceRef.current,
          style: new Style({
            image: new Circle({
              radius: 5,
              fill: new Fill({ color: 'blue' }),
            }),
            stroke: new Stroke({
              color: 'red',
              width: 6,
            }),
          }),
        })
      );
    }
  }, [trip]);

  const shortestPathStartToEnd = () => {
    if (trip.paths.length < 2) return 0;
    const point_1 = trip.paths[0];

    const point_2 = trip.paths[trip.paths.length - 1];

    //convert to 4326 for turf
    const point_1_4326 = toLonLat([point_1.long, point_1.lat]);

    const point_2_4326 = toLonLat([point_2.long, point_2.lat]);

    const circle_arc = turf.greatCircle(
      turf.point(point_1_4326),
      turf.point(point_2_4326)
    );

    //convert to 3857
    const circle_arc_3857 = circle_arc.geometry.coordinates.map((coord) =>
      // its laready in 3857
      //@ts-ignore
      fromLonLat(coord)
    );

    if (previousShortestDistanceArc.current) {
      //remove the previous shortest distance arc
      arcSourceRef.current.removeFeature(previousShortestDistanceArc.current);
    }

    //print length of arc
    const length_of_arc = turf.length(circle_arc, {
      units: 'meters',
    });

    //maybe add arc to map with different styling, maybe light green
    //add the line string to the vector source

    //
    if (circle_arc_3857.length === 2) {
      const circle_arc_coverted_1 = circle_arc_3857[0]
        .filter((coord, i) => {
          //if either [0] or [1] is NaN, then remove
          //@ts-ignore
          if (isNaN(coord[0])) {
            return false;
          }
          //@ts-ignore
          if (isNaN(coord[1])) {
            return false;
          }
          return true;
        })

        .map((coord) =>
          // @ts-ignore
          fromLonLat(coord)
        );

      const circle_arc_coverted_2 = circle_arc_3857[1]
        .filter((coord, i) => {
          //if either [0] or [1] is NaN, then remove
          //@ts-ignore
          if (isNaN(coord[0])) {
            return false;
          }
          //@ts-ignore
          if (isNaN(coord[1])) {
            return false;
          }
          return true;
        })
        .map((coord) =>
          // @ts-ignore
          fromLonLat(coord)
        );
      //its splitting the merdiian
      const new_arc_feature_1 = new Feature(
        //@ts-ignore
        new LineString(circle_arc_coverted_1)
      );

      const new_arc_feature_2 = new Feature(
        //@ts-ignore
        new LineString(circle_arc_coverted_2)
      );

      new_arc_feature_1.setStyle(
        new Style({
          stroke: new Stroke({
            color: 'lightgreen',
            width: 6,
          }),
        })
      );

      new_arc_feature_2.setStyle(
        new Style({
          stroke: new Stroke({
            color: 'lightgreen',
            width: 6,
          }),
        })
      );

      //add the line string to the vector source
      arcSourceRef.current.addFeature(new_arc_feature_1);

      arcSourceRef.current.addFeature(new_arc_feature_2);
    } else {
      const new_arc_feature = new Feature(new LineString(circle_arc_3857));

      new_arc_feature.setStyle(
        new Style({
          stroke: new Stroke({
            color: 'lightgreen',
            width: 6,
          }),
        })
      );

      //style the arc line lightyellow
      previousShortestDistanceArc.current = new_arc_feature;

      arcSourceRef.current.addFeature(new_arc_feature);
    }

    return length_of_arc;
  };

  const calculateOpenLayerDistanceOfFeature = () => {
    var Geographic = new Projection({ code: 'EPSG:4326' });
    var Mercator = new Projection({ code: 'EPSG:900913' });

    //iterate through paths
    //calculate distance between two points

    //use openlayers to calculate the distance

    // DO NOT CONVERT INTO DEGREES< DO NOT !!!!!!!!!!!!!!!!!!!
    // DO NOT EVEN THINK ABOUT IT

    // right now it is in meters, keep it that way

    var distance = 0;

    for (let i = 1; i < trip.paths.length; i++) {
      const previous = trip.paths[i - 1];
      const current = trip.paths[i];

      var coordinate1 = [previous.long, previous.lat];
      var point1 = new Point(coordinate1);

      var coordinate2 = [current.long, current.lat];
      var point2 = new Point(coordinate2);

      //distanceTo but specify 300913

      //use turf to calculate the distance

      const point_1_4326 = toLonLat([previous.long, previous.lat]);

      const point_2_4326 = toLonLat([current.long, current.lat]);

      const circle_arc = turf.greatCircle(
        turf.point(point_1_4326),
        turf.point(point_2_4326)
      );

      //convert to 3857
      const circle_arc_3857 = circle_arc.geometry.coordinates.map((coord) =>
        // its laready in 3857
        //@ts-ignore
        fromLonLat(coord)
      );

      const length_of_arc = turf.length(circle_arc, {
        units: 'meters',
      });

      //return length_of_arc;
      distance += length_of_arc;
      //create line
      var line = new LineString([coordinate1, coordinate2]);

      //get the distance
      var distanceLine = getLength(line, {
        projection: Mercator,
      });

      //distance += distanceLine;
    }

    return distance;
  };

  const calculateDistanceOfPath = () => {
    if (trip) {
      const index = distanceTo.length - 1;

      if (distanceTo.length < 1) return 0;

      //sum up all from 1 to index
      const total_distance = distanceTo.reduce((acc, curr, i) => {
        //if (i > index) return acc;
        return acc + curr;
      });
      return total_distance;
    }

    return 0;
  };

  const convertDistanceToPrettyString = (distance: number) => {
    if (milesOrKm === 'miles') {
      if (distance < 1609) {
          return `${(Math.floor(distance/1609*5280)} ft`;
      }
      if (distance < 1609 * 10) {
        return (
          `${Math.floor(distance / 1609)} miles` +
          ` + ${Math.floor(((distance % 1609) / 1609) * 5280)} ft`
        );
      }
      return `${Math.floor(distance / 1609)} miles`;
    }

    if (distance < 1000) {
      return `${Math.floor(distance)} meters`;
    }

    if (distance < 1000000) {
      return `${Math.floor(distance / 1000)} kilometers + ${Math.floor(
        distance % 1000
      )} meters`;
    }

    return `${Math.floor(distance / 1000)} kilometers`;
  };

  const convertMilesToPrettyString = (miles: number) => {
    return `${miles.toFixed(3)} miles`;
  };

  const modalIndexPanel = () => {
    if (modalIndex === null) return null;

    const trip_path_to_index = trip.paths.slice(modalIndex);

    const distance_to_point = 0;

    var Geographic = new Projection({ code: 'EPSG:4326' });
    var Mercator = new Projection({ code: 'EPSG:900913' });

    //iterate through paths
    //calculate distance between two points

    //use openlayers to calculate the distance

    // DO NOT CONVERT INTO DEGREES< DO NOT !!!!!!!!!!!!!!!!!!!
    // DO NOT EVEN THINK ABOUT IT

    // right now it is in meters, keep it that way

    var distance = 0;

    for (let i = 1; i < modalIndex + 1; i++) {
      const previous = trip.paths[i - 1];
      const current = trip.paths[i];

      var coordinate1 = [previous.long, previous.lat];
      var point1 = new Point(coordinate1);

      var coordinate2 = [current.long, current.lat];
      var point2 = new Point(coordinate2);

      //distanceTo but specify 300913

      //create line
      var line = new LineString([coordinate1, coordinate2]);

      line.getLength();

      //get the distance
      var distanceLine = getLength(line, {
        projection: Mercator,
      });

      distance += distanceLine;
    }

    /**
     *
     * Display panel to close it (setModalIndex(null))
     * and Display distance up to point
     */
    return (
      <div>
        <h1>Distance to Point: {convertDistanceToPrettyString(distance)}</h1>
        <h1> Index #{modalIndex}</h1>
        <button onClick={() => setModalIndex(null)}>Close</button>
      </div>
    );
  };

  return (
    <div className="flex flex-wrap flex-col overflow-auto overflow-y-auto">
      {
        <AddDestinationModal
          handleClose={() => {
            setOpenDestinationModal(false);
            searchRef.current = false;
          }}
          handleAdd={(destination) => {
            const coordinates = fromLonLat([destination.long, destination.lat]);

            //add the coordinate to the trip
            setTrip({
              ...trip,
              paths: [
                ...trip.paths,
                { lat: coordinates[1], long: coordinates[0] },
              ],
            });

            tripRef.current = {
              ...tripRef.current,
              paths: [
                ...tripRef.current.paths,
                { lat: coordinates[1], long: coordinates[0] },
              ],
            };
            //push history
            editHistory.current.push({
              type: 'add',
              index: tripRef.current.paths.length - 1,
              coordinate: [[destination.long, destination.lat]],
            });
            setOpenDestinationModal(false);
          }}
          show={openDestinationModal}
          handleOpen={() => {
            setOpenDestinationModal(true);
            searchRef.current = true;
          }}
        />
      }
      <div ref={mapRef} className="w-full h-[60vh] relative"></div>
      {modalIndexPanel()}
      <div className="flex flex-col">
        <h1>
          Distance is{' '}
          {convertDistanceToPrettyString(calculateOpenLayerDistanceOfFeature())}
          <span className="line yellow-line"></span>
        </h1>
        <h1>
          Distance Along Straight Red Lines{' '}
          {convertDistanceToPrettyString(
            Math.round(
              nonProjectedDistance.reduce((acc, curr) => acc + curr, 0)
            )
          )}
          <span className="line red-line"></span>
        </h1>
        <h1>
          Direct Distance Start To End{' '}
          {convertDistanceToPrettyString(shortestPathStartToEnd())}
          <span className="line green-line"></span>
        </h1>
        <h1>
          Projected Coordinate System Distance{' '}
          {convertDistanceToPrettyString(calculateDistanceOfPath())}
          <span className="line red-line"></span>
        </h1>

        <div className="toggle-container">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={milesOrKm === 'miles'}
              onChange={() => {
                setMilesOrKm(milesOrKm === 'miles' ? 'km' : 'miles');
              }}
            />
            <span className="toggle-slider"></span>
          </label>
          <span>{milesOrKm === 'km' ? 'Kilometers' : 'Miles'}</span>
        </div>
      </div>
      <div className="flex flex-row w-full space-around">
        <button
          className="bg-blue-500 flex text-white p-2 w-1/2 m-5 "
          onClick={() => {
            setTrip({
              ...trip,
              paths: [],
            });

            //reset URL
            const url_clear = new URL(window.location.href);
            url_clear.searchParams.delete('path');

            //push history
            editHistory.current.push({
              type: 'clear',
              index: 0,
              coordinate: trip.paths.map((path) => {
                return [path.long, path.lat];
              }),
            });

            tripRef.current = {
              ...tripRef.current,
              paths: [],
            };
          }}
        >
          Reset
        </button>
        {/* Zoom To Path */}
        <button
          className="bg-blue-500 flex text-white p-2 w-1/2 m-5"
          onClick={() => zoomToPath()}
        >
          Zoom To Path
        </button>
      </div>
    </div>
  );
};

export default WalkinPathPage;
