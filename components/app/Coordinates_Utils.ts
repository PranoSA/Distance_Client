// keeping coordinate in 3857 between [-20037508.342789244, 20037508.342789244]
// [-180, 180] and [-90, 90] in 4326

import { Coordinate } from 'ol/coordinate';
import { toLonLat } from 'ol/proj';

const normalizeCoordinate3857 = (coordinate: Coordinate): Coordinate => {
  return [
    Math.min(Math.max(coordinate[0], -20037508.342789244), 20037508.342789244),
    Math.min(Math.max(coordinate[1], -20037508.342789244), 20037508.342789244),
  ];
};

const normalizeCoordinate = (coordinate: Coordinate): Coordinate => {
  //transform to 4326
  const transformed_to_4326 = toLonLat(coordinate);

  //holler if not between -180 and 180
  if (transformed_to_4326[0] < -180 || transformed_to_4326[0] > 180) {
    console.log('Longitude out of range:', transformed_to_4326[0]);
  }

  //normalize the coordinate
  const normalized = normalizeCoordinate3857(transformed_to_4326);

  return normalized;
};

export { normalizeCoordinate, normalizeCoordinate3857 };
