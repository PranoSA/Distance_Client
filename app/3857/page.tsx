'use client';
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
import { distance } from 'ol/coordinate';
import { getLength } from 'ol/sphere';
import { shiftKeyOnly } from 'ol/events/condition';

import * as turf from '@turf/turf';
import { buffer } from 'stream/consumers';

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

  const mapRef = useRef<HTMLDivElement>(null);
  const vectorSourceRef = useRef<VectorSource>(new VectorSource());
  const arcSourceRef = useRef<VectorSource>(new VectorSource());
  const mapInstanceRef = useRef<OLMap | null>(null);

  const [modalIndex, setModalIndex] = useState<number | null>(null);

  //on mount useEffect, un compress the path to the coordinate
  useEffect(() => {
    // get the URL parameter path
    const url = new URL(window.location.href);

    console.log('Building Trip From URL');

    // get the path parameter
    const path = url.searchParams.get('path');

    console.log('Path:', path);

    if (!path) return;

    if (path === '') return;

    try {
      // URL decode the string
      const url_decoded = decodeURIComponent(path);

      // Decode the base64 string to a binary string
      const binaryString = atob(url_decoded);

      // Convert binary string to Uint8Array
      const uint8Array = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i);
      }

      console.log('Uint8Array:', uint8Array);
      // Decode the Uint8Array to a compressed string
      const compressedString = new TextDecoder().decode(uint8Array);

      console.log('I saw this compressed string: ');
      console.log(compressedString);

      // Decompress the string
      const path_string_uncompressed = LZString.decompress(compressedString);

      // Parse the JSON
      const path_json = JSON.parse(path_string_uncompressed);

      if (!path_json) {
        return;
      }

      console.log('Path JSON:', path_json);

      // Set the trip
      setTrip({
        ...trip,
        name: 'Loaded From URL',
        paths: path_json,
      });

      //trip ref
      tripRef.current = {
        ...tripRef.current,
        name: 'Loaded From URL',
        paths: path_json,
      };
    } catch (error) {
      console.error('Error decoding path:', error);
    }
  }, []);

  //see when trip has changed
  useEffect(() => {
    console.log('Trip has changed', trip);
  }, [trip]);

  // compress the path, and save it to the url
  useEffect(() => {
    //don't do this on the first render

    //compress the path
    console.log('Saving Trip To URL');

    // Compress the string
    const path_string_uncompressed = JSON.stringify(tripRef.current.paths);
    const path_string_compressed = LZString.compress(path_string_uncompressed);

    console.log('I want to see this compressed :');
    console.log(path_string_compressed);
    // Encode the compressed string to a Uint8Array
    const uint8Array = new TextEncoder().encode(path_string_compressed);

    //turn uint8Array into number array
    const numberArray = Array.from(uint8Array);

    // Convert Uint8Array to base64
    const base64Encoded = btoa(String.fromCharCode.apply(null, numberArray));

    // URL encode the base64 string
    const url_encoded = encodeURIComponent(base64Encoded);

    // Save it to the URL
    const url = new URL(window.location.href);
    url.searchParams.set('path', url_encoded);
    window.history.pushState({}, '', url.toString());
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

      console.log('Trip ahs been updated', new_trip);

      setTrip(new_trip);

      tripRef.current = new_trip;
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

      /*if (
        old_coordinate.lat === coordinates[1] &&
        old_coordinate.long === coordinates[0]
      ) {
        return;
      }*/
      changed_coordinate.lat = coordinates[1];
      changed_coordinate.long = coordinates[0];
      //old_paths[i] = { lat: coordinates[1], long: coordinates[0] };
      //return { lat: coordinates[1], long: coordinates[0] };
    });

    //place changed_coordinate into the old_paths at the unfound index

    const unfound_index = found_index.findIndex((found) => {
      return !found;
    });

    if (unfound_index !== -1) {
      old_paths[unfound_index] = changed_coordinate;
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

      const map = new OLMap({
        target: mapRef.current,
        layers: [
          new TileLayer({
            source: new OSM(),
          }),
          vectorLayer,
          arcLayer,
        ],

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

        //if the difference isn't more than 20%, then don't draw the line
        if ((eucledian_distance_line - length_of_arc) / length_of_arc < 0.2) {
          return;
        }

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
    <div className="h-screen flex flex-col">
      <h1>Walking Path</h1>
      <div ref={mapRef} className="w-full h-full flex-grow relative"></div>
      {modalIndexPanel()}
      <h1>
        {' '}
        Distance is {convertDistanceToPrettyString(calculateDistanceOfPath())}
      </h1>
      <h1>
        {' '}
        Other Distnace is{' '}
        {convertDistanceToPrettyString(calculateOpenLayerDistanceOfFeature())}
      </h1>
      <h1 className="text-2xl">
        {' '}
        Distance (Miles) :{' '}
        {(calculateOpenLayerDistanceOfFeature() / 1609).toFixed(3)}
      </h1>
      <button
        className="bg-blue-500 text-white p-2"
        onClick={() => {
          setTrip({
            ...trip,
            paths: [],
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
        onClick={() => {
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
        }}
      >
        Zoom To Path
      </button>
    </div>
  );
};

export default WalkinPathPage;
