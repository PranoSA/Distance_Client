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
import { fromLonLat, Projection, toLonLat } from 'ol/proj';
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
    update_url_based_on_path_string(trip);
    console.log('Trip has changed', trip);
  }, [trip]);

  //append a coordinate to the path
  const appendCoordinate = (lat: number, long: number) => {
    if (trip) {
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

    const old_coordinate = {
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
        }),
      });

      //new layer
      const vectorSource = new VectorSource();

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
          const index = tripRef.current.paths.findIndex(
            (path) =>
              path.lat === coordinates[1] && path.long === coordinates[0]
          );

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

      // Draw interaction to add points by dragging
      /*const draw = new Draw({
        source: vectorSourceRef.current,
        type: 'LineString',
        freehandCondition: shiftKeyOnly,
      });

      draw.on('drawend', (event) => {
        newCoordinatesFromEdit();
      });

      map.addInteraction(draw);*/

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

        const lineString = new LineString([
          [previous.long, previous.lat],
          [current.long, current.lat],
        ]);

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

        const eucledian_distance_line = Math.sqrt(
          Math.pow(current.lat - previous.lat, 2) +
            Math.pow(current.long - previous.long, 2)
        );

        const lineFeature = new Feature(lineString);

        vectorSourceRef.current.addFeature(lineFeature);

        console.log('Length of Arc:', length_of_arc);
        console.log('Eucledian Distance:', eucledian_distance_line);

        //calculate the gradient difference
        //[y2-y1]/[x2-x1]
        const gradient_of_straight_line =
          (current.lat - previous.lat) / (current.long - previous.long);

        const gradient_start_of_arc =
          (circle_arc_3857[1][1] - circle_arc_3857[0][1]) /
          (circle_arc_3857[1][0] - circle_arc_3857[0][0]);

        //find the angle between the two gradients
        //if the angle is more than 10 degrees, then draw the line

        const angle = Math.atan(
          (gradient_of_straight_line - gradient_start_of_arc) /
            (1 + gradient_of_straight_line * gradient_start_of_arc)
        );

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

        //if the angle difference is more than 20 degrees, then draw the line
        if (angle_difference < 0.17) {
          return;
        }

        /*const ratio = gradient_of_straight_line / gradient_start_of_arc;
        if (Math.abs(ratio - 1) < 0.25) {
          console.log('Ratio:', ratio);
          return;
        }

        //if the gradient is substantially different, then draw the line
        if (Math.abs(gradient_of_straight_line - gradient_start_of_arc) < 0.2) {
          return;
        }

        //if the difference isn't more than 20%, then don't draw the line
        if ((eucledian_distance_line - length_of_arc) / length_of_arc < 0.2) {
          //return;
        }
          */

        //style the arc line
        const new_arc_feature = new Feature(lineString_3857);

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
    }

    // Add line string connecting all points
    /* if (trip.paths.length > 1) {
      const coordinates = trip.paths.map((path) =>
        fromLonLat([path.long, path.lat])
      );

      const lineString = new LineString(coordinates);
      const lineFeature = new Feature(lineString);

      vectorSourceRef.current.addFeature(lineFeature);
    }*/

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

      //create line
      var line = new LineString([coordinate1, coordinate2]);

      //get the distance
      var distanceLine = getLength(line, {
        projection: Mercator,
      });

      distance += distanceLine;
    }

    return distance;
  };

  const calculateDistanceOfPath = () => {
    if (trip) {
      let distance = 0;
      for (let i = 1; i < trip.paths.length; i++) {
        const previous = trip.paths[i - 1];
        const current = trip.paths[i];

        //distance between two points
        const distanceBetween = Math.sqrt(
          Math.pow(current.lat - previous.lat, 2) +
            Math.pow(current.long - previous.long, 2)
        );

        //use openlayers to calculate the distance

        distance += distanceBetween;

        //need to map to espg:4326

        // right now its in degrees
        // need to convert to meters

        // distance += distanceBetween;
      }

      return distance;
    }

    return 0;
  };

  const convertDistanceToPrettyString = (distance: number) => {
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
    <div className="h-screen flex flex-wrap flex-col overflow-auto">
      {
        <AddDestinationModal
          handleClose={() => setOpenDestinationModal(false)}
          handleAdd={(destination) => {
            //convert lat and long to 3857
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
          handleOpen={() => setOpenDestinationModal(true)}
        />
      }
      <div ref={mapRef} className="w-full h-[60vh] relative"></div>
      {modalIndexPanel()}
      <div className="flex flex-col">
        <h1 className="text-2xl">
          {' '}
          Distance (Miles) :{' '}
          {(calculateOpenLayerDistanceOfFeature() / 1609).toFixed(3)}
        </h1>
        <h1>
          {' '}
          Distance is {convertDistanceToPrettyString(calculateDistanceOfPath())}
        </h1>
        <h1>
          {' '}
          Other Distnace is{' '}
          {convertDistanceToPrettyString(calculateOpenLayerDistanceOfFeature())}
        </h1>
      </div>
      <button
        className="bg-blue-500 text-white p-2"
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
        className="bg-blue-500 text-white p-2"
        onClick={() => zoomToPath()}
      >
        Zoom To Path
      </button>
    </div>
  );
};

export default WalkinPathPage;
