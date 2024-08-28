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
  { name: 'Hanoi', long: 105.8342, lat: 21.0278 },

  //Central Asia
  { name: 'Tashkent', long: 69.2401, lat: 41.2995 },
  { name: 'Almaty', long: 76.9285, lat: 43.222 },
  { name: 'Bishkek', long: 74.5698, lat: 42.8746 },
  { name: 'Dushanbe', long: 68.7734, lat: 38.579 },
  { name: 'Ashgabat', long: 58.3838, lat: 37.9838 },
  { name: 'Nur-Sultan', long: 71.4334, lat: 51.1605 },

  // south asia
  { name: 'Mumbai', long: 72.8777, lat: 19.076 },
  { name: 'Delhi', long: 77.1025, lat: 28.7041 },
  { name: 'Dhaka', long: 90.4125, lat: 23.8103 },
  { name: 'Kolkata', long: 88.3639, lat: 22.5726 },
  { name: 'Karachi', long: 67.0099, lat: 24.8607 },
  { name: 'Lahore', long: 74.3587, lat: 31.5497 },
  { name: 'Colombo', long: 79.8612, lat: 6.9271 },
  { name: 'Kathmandu', long: 85.324, lat: 27.7172 },
  { name: 'Thimphu', long: 89.639, lat: 27.4728 },
  { name: 'Bangaon', long: 88.8235, lat: 23.0487 },

  //Africa
  { name: 'Cairo', long: 31.2357, lat: 30.0444 },
  { name: 'Lagos', long: 3.3792, lat: 6.5244 },
  { name: 'Kinshasa', long: 15.2663, lat: -4.4419 },
  { name: 'Johannesburg', long: 28.0473, lat: -26.2041 },
  { name: 'Nairobi', long: 36.8219, lat: -1.2921 },
  { name: 'Addis Ababa', long: 38.7469, lat: 9.145 },
  { name: 'Khartoum', long: 32.5599, lat: 15.5007 },
  { name: 'Accra', long: -0.1869644, lat: 5.6037 },
  { name: 'Marakkech', long: -7.5898, lat: 31.6295 },
  { name: 'Cape Town', long: 18.4241, lat: -33.9249 },
  { name: 'Casablanca', long: -7.5898, lat: 33.5731 },
  { name: 'Tunis', long: 10.1815, lat: 36.8065 },
  { name: 'Dakar', long: -17.4439, lat: 14.7167 },

  // East Asia
  { name: 'Tokyo', long: 139.6917, lat: 35.6895 },
  { name: 'Nagasaki', long: 129.8787, lat: 32.7503 },
  { name: 'Seoul', long: 126.978, lat: 37.5665 },
  { name: 'Beijing', long: 116.4074, lat: 39.9042 },
  { name: 'Shanghai', long: 121.4737, lat: 31.2304 },
  { name: 'Hong Kong', long: 114.1694, lat: 22.3193 },
  { name: 'Taipei', long: 121.5654, lat: 25.0329 },
  { name: 'Singapore', long: 103.8198, lat: 1.3521 },
  { name: 'Osaka', long: 135.5022, lat: 34.6937 },
  { name: 'Hiroshima', long: 132.4594, lat: 34.3853 },

  { name: 'Guangzhou', long: 113.2644, lat: 23.1291 },
  { name: 'Shenzhen', long: 114.0579, lat: 22.5431 },
  { name: 'Chengdu', long: 104.0667, lat: 30.5728 },
  { name: 'Chongqing', long: 106.5516, lat: 29.563 },
  { name: 'Hangzhou', long: 120.1551, lat: 30.2741 },
  { name: 'Nanjing', long: 118.7969, lat: 32.0603 },
  { name: 'Wuhan', long: 114.3054, lat: 30.5931 },
  { name: "Xi'an", long: 108.9402, lat: 34.3416 },
  { name: 'Changsha', long: 112.9388, lat: 28.2278 },
  { name: 'Qingdao', long: 120.3826, lat: 36.0671 },
  { name: 'Dalian', long: 121.6147, lat: 38.914 },
  { name: 'Xiamen', long: 118.0894, lat: 24.4798 },
  { name: 'Suzhou', long: 120.5853, lat: 31.2989 },

  // Europe
  { name: 'London', long: -0.1276, lat: 51.5074 },
  { name: 'Paris', long: 2.3522, lat: 48.8566 },
  { name: 'Berlin', long: 13.405, lat: 52.52 },
  { name: 'Rome', long: 12.4964, lat: 41.9028 },
  { name: 'Moscow', long: 37.6176, lat: 55.7558 },
  { name: 'Istanbul', long: 28.9784, lat: 41.0082 },
  { name: 'Athens', long: 23.7275, lat: 37.9838 },
  { name: 'Prague', long: 14.4378, lat: 50.0755 },
  { name: 'Vienna', long: 16.3738, lat: 48.2082 },
  { name: 'Stockholm', long: 18.0686, lat: 59.3293 },
  { name: 'Copenhagen', long: 12.5683, lat: 55.6761 },
  { name: 'Helsinki', long: 24.9384, lat: 60.1695 },
  { name: 'Oslo', long: 10.7522, lat: 59.9139 },
  { name: 'Budapest', long: 19.0402, lat: 47.4979 },
  { name: 'Warsaw', long: 21.0122, lat: 52.2297 },
  { name: 'Dublin', long: -6.2603, lat: 53.3498 },
  { name: 'Lisbon', long: -9.1393, lat: 38.7223 },
  { name: 'Zurich', long: 8.5417, lat: 47.3769 },
  { name: 'Geneva', long: 6.1432, lat: 46.2044 },
  { name: 'Brussels', long: 4.3517, lat: 50.8503 },
  { name: 'Amsterdam', long: 4.897975, lat: 52.377956 },
  { name: 'Luxembourg', long: 6.1296, lat: 49.6116 },
  { name: 'Monaco', long: 7.4167, lat: 43.7325 },
  { name: 'Vatican City', long: 12.4534, lat: 41.9029 },
  { name: 'Andorra la Vella', long: 1.5218, lat: 42.5063 },
  { name: 'San Marino', long: 12.4578, lat: 43.9424 },
  { name: 'Reykjavik', long: -21.9426, lat: 64.1466 },
  { name: 'Minsk', long: 27.5615, lat: 53.9045 },
  { name: 'Kyiv', long: 30.5234, lat: 50.4501 },
  { name: 'Madrid', long: -3.7038, lat: 40.4168 },
  { name: 'Saint Petersburg', long: 30.3351, lat: 59.9343 },
  { name: 'Barcelona', long: 2.1734, lat: 41.3851 },

  // North America
  { name: 'New York City', long: -74.006, lat: 40.7128, code_names: ['NYC'] },
  { name: 'Los Angeles', long: -118.2437, lat: 34.0522, code_names: ['LA'] },
  { name: 'Chicago', long: -87.6298, lat: 41.8781, code_names: ['CHI'] },
  { name: 'Houston', long: -95.3698, lat: 29.7604, code_names: ['HOU'] },
  { name: 'Toronto', long: -79.3832, lat: 43.6532, code_names: ['TOR'] },
  { name: 'Mexico City', long: -99.1332, lat: 19.4326 },
  { name: 'Houston', long: -95.3698, lat: 29.7604 },
  { name: 'Havana', long: -82.3666, lat: 23.1136 },
  { name: 'Miami', long: -80.1917902, lat: 25.7616798 },
  { name: 'New Orleans', long: -90.0715323, lat: 29.9510658 },
  { name: 'Seattle', long: -122.3300624, lat: 47.6038321 },
  { name: 'Fairbanks', long: -147.7164, lat: 64.8378 },
  { name: 'Anchorage', long: -149.9003, lat: 61.2181 },
  { name: 'Honolulu', long: -157.8583, lat: 21.3069 },
  { name: 'Phoenix', long: -112.074, lat: 33.4484 },
  { name: 'Las Vegas', long: -115.1398, lat: 36.1699 },
  { name: 'Denver', long: -104.9903, lat: 39.7392 },
  { name: 'Salt Lake City', long: -111.891, lat: 40.7608 },
  { name: 'Dallas', long: -96.7969, lat: 32.7767 },
  { name: 'Atlanta', long: -84.388, lat: 33.749 },
  { name: 'Washington, D.C.', long: -77.0369, lat: 38.9072 },
  { name: 'Boston', long: -71.0589, lat: 42.3601 },
  { name: 'Philadelphia', long: -75.1652, lat: 39.9526 },
  { name: 'Detroit', long: -83.0458, lat: 42.3314 },
  { name: 'Minneapolis', long: -93.265, lat: 44.9778 },
  { name: 'St. Louis', long: -90.1994, lat: 38.627 },
];

export const Destinations: Destination[] = [
  ...InternalAirports,
  ...InternalDestinations,
  ...MajorCities,
];

export type { Destination };
