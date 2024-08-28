type Destination = {
  name: string;
  long: number;
  lat: number;
  code_names?: string[];
};

const InternalAirports: Destination[] = [
  {
    name: 'Los Angeles International Airport',
    long: -118.4085,
    lat: 33.9416,
    code_names: ['LAX'],
  },
  {
    name: 'John F. Kennedy International Airport',
    long: -73.7781,
    lat: 40.6413,
    code_names: ['JFK'],
  },
  { name: 'Heathrow Airport', long: -0.4543, lat: 51.47, code_names: ['LHR'] },
  { name: 'Tokyo Haneda Airport', long: 139.7798, lat: 35.5494 },
  { name: 'Dubai International Airport', long: 55.3644, lat: 25.2532 },
  { name: 'Charles de Gaulle Airport', long: 2.55, lat: 49.0097 },
  { name: 'Singapore Changi Airport', long: 103.994, lat: 1.3644 },
  { name: 'Hong Kong International Airport', long: 113.9185, lat: 22.308 },
  { name: 'Frankfurt Airport', long: 8.5705, lat: 50.0379 },
  { name: 'Sydney Kingsford Smith Airport', long: 151.1772, lat: -33.9399 },
  {
    name: 'Beijing Capital International Airport',
    long: 116.4074,
    lat: 40.0801,
    code_names: ['PEK'],
  },
  {
    name: 'San Francisco International Airport',
    long: -122.379,
    lat: 37.6213,
    code_names: ['SFO'],
  },
  {
    name: 'Toronto Pearson International Airport',
    long: -79.6306,
    lat: 43.6777,
    code_names: ['YYZ'],
  },
  { name: 'Amsterdam Schiphol Airport', long: 4.7634, lat: 52.3105 },
  { name: 'Incheon International Airport', long: 126.4505, lat: 37.4602 },
  { name: 'Munich Airport', long: 11.7861, lat: 48.3538 },
  { name: 'Zurich Airport', long: 8.5492, lat: 47.4581 },
  { name: 'Madrid-Barajas Airport', long: -3.5676, lat: 40.4983 },
  { name: 'Miami International Airport', long: -80.2906, lat: 25.7959 },
  {
    name: 'São Paulo-Guarulhos International Airport',
    long: -46.4731,
    lat: -23.4356,
  },
  { name: 'Mexico City International Airport', long: -99.0721, lat: 19.4362 },
  {
    name: 'Buenos Aires Ministro Pistarini International Airport',
    long: -58.5358,
    lat: -34.8221,
  },
  {
    name: 'Lima Jorge Chávez International Airport',
    long: -77.1143,
    lat: -12.0218,
  },
];

const InternalDestinations: Destination[] = [
  { name: 'San Francisco International Airport', long: -122.379, lat: 37.6213 },
  {
    name: 'Toronto Pearson International Airport',
    long: -79.6306,
    lat: 43.6777,
  },
  { name: 'Amsterdam Schiphol Airport', long: 4.7634, lat: 52.3105 },
  { name: 'Incheon International Airport', long: 126.4505, lat: 37.4602 },
  { name: 'Munich Airport', long: 11.7861, lat: 48.3538 },
  { name: 'Zurich Airport', long: 8.5492, lat: 47.4581 },
  { name: 'Madrid-Barajas Airport', long: -3.5676, lat: 40.4983 },
  { name: 'Miami International Airport', long: -80.2906, lat: 25.7959 },
  {
    name: 'São Paulo-Guarulhos International Airport',
    long: -46.4731,
    lat: -23.4356,
  },
];

const MajorCities: Destination[] = [
  // Latin America
  { name: 'Mexico City', long: -99.1332, lat: 19.4326 },
  { name: 'Buenos Aires', long: -58.3816, lat: -34.6037 },
  { name: 'São Paulo', long: -46.6333, lat: -23.5505 },
  { name: 'Lima', long: -77.0428, lat: -12.0464 },
  { name: 'Bogotá', long: -74.0721, lat: 4.711 },

  // Middle East
  { name: 'Dubai', long: 55.2708, lat: 25.2048 },
  { name: 'Riyadh', long: 46.6753, lat: 24.7136 },
  { name: 'Istanbul', long: 28.9784, lat: 41.0082 },
  { name: 'Tehran', long: 51.389, lat: 35.6892 },
  { name: 'Cairo', long: 31.2357, lat: 30.0444 },

  // Southeast Asia
  { name: 'Bangkok', long: 100.5018, lat: 13.7563 },
  { name: 'Jakarta', long: 106.8456, lat: -6.2088 },
  { name: 'Manila', long: 120.9842, lat: 14.5995 },
  { name: 'Kuala Lumpur', long: 101.6869, lat: 3.139 },
  { name: 'Ho Chi Minh City', long: 106.6297, lat: 10.8231 },

  // East Asia
  { name: 'Tokyo', long: 139.6917, lat: 35.6895 },
  { name: 'Seoul', long: 126.978, lat: 37.5665 },
  { name: 'Beijing', long: 116.4074, lat: 39.9042 },
  { name: 'Shanghai', long: 121.4737, lat: 31.2304 },
  { name: 'Hong Kong', long: 114.1694, lat: 22.3193 },

  // Europe
  { name: 'London', long: -0.1276, lat: 51.5074 },
  { name: 'Paris', long: 2.3522, lat: 48.8566 },
  { name: 'Berlin', long: 13.405, lat: 52.52 },
  { name: 'Madrid', long: -3.7038, lat: 40.4168 },
  { name: 'Rome', long: 12.4964, lat: 41.9028 },

  // North America
  { name: 'New York City', long: -74.006, lat: 40.7128 },
  { name: 'Los Angeles', long: -118.2437, lat: 34.0522 },
  { name: 'Chicago', long: -87.6298, lat: 41.8781 },
  { name: 'Houston', long: -95.3698, lat: 29.7604 },
  { name: 'Toronto', long: -79.3832, lat: 43.6532 },
];

export const Destinations: Destination[] = [
  ...InternalAirports,
  ...InternalDestinations,
  ...MajorCities,
];

export type { Destination };
