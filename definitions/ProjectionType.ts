type ProjectionType = {
  name: string;
  description: string;
  link: string;
  centers_lat: number;
  centers_lon: number;
  epsg_code: string;
  image_url: string;
};

const ProjectionLists: ProjectionType[] = [
  {
    name: 'Azimuthal Equidistant Projection',
    description: `All Points are at the correct distance from the center point [90,0] or the north pole.
    Geometry at the equator is not stretched or compressed, Points above the equator are compressed and points below the equator are stretched.
    The constant lateral lines are spaced at equal distances from each other [constant incriments].`,
    link: '/54032_reference',
    centers_lat: 0,
    centers_lon: 90,
    epsg_code: 'EPSG:54032',
    image_url: '/images/54032_reference.png',
  },
  {
    name: 'Azimuthal Equal Area Projection',
    description: `The Azimuthal Equal Area projection is an azimuthal map projection.
    This projection keeps the relative size of areas correct, but distorts the shape of areas in the
    souther hemisphere. Compared to the Web Mercator Projection, the center / origin of the projection (North
    Poll in this case), is the only point that is not distorted. The further away from the center point, the more
    distorted the shape of the area becomes. Especially in the lower half, where the length of the constant latitude
    lines are increasing linearly while actually becoming shorter in reality. The area is maintained
    with strong compression.`,

    epsg_code: 'EPSG:3411',
    link: '/3411_reference',
    centers_lat: 0,
    centers_lon: 90,
    image_url: '/images/3411_reference.png',
  },
  {
    name: 'Lambert Equal Area Cylindrical Projection',
    description: `Like other cylindrical projections such as Web Mercator, and Plate Carree 
    (Equirecantular), the Lambert Equal Area Cylindrical projection stretches lengths above and below
    the equator to keep a constant x-coordinate range vertically across the map. This projection
    vertically compressed the map in these areas to keep the area of the map constant. This can be seen
    as the opposite of 3857, which vertically stretches to maintain the same shape.`,
    epsg_code: 'EPSG:6933',
    link: '/6933_reference',
    centers_lat: 0,
    centers_lon: 0,
    image_url: '/images/6933_reference.png',
  },
  {
    name: 'Web Mercator Projection',
    description: `
        A cylindrical map projection that is used in many web mapping applications. It is a conformal projection,
        meaning it preserves the angles between lines on the map. The Web Mercator projection is a variant of the
        Mercator projection, which was developed for navigation purposes. The Web Mercator projection is used by
        popular web mapping services such as Google Maps, OpenStreetMap, and Bing Maps. The Web Mercator projection
        stretches the vertical directions above and below the equator to grow vertical size with lateral size to maintain
        angles between lines and shapes. This projection is also known as EPSG:900913
    `,
    epsg_code: 'EPSG_3857',
    link: '/3857_reference',
    centers_lat: 0,
    centers_lon: 0,
    image_url: '/images/3857_reference.png',
  },
  {
    name: 'Equirectangular Projection',
    description: `
    Projects the globe onto a cylinder, and then unrolls the cylinder to create a flat map.
    The projected map is a rectangular grid with the range [-90,90] in latitude and [-180,180] in longitude
    as its main coordinates, where spaces above and below the equator are stretched horizontally to keep
    the equal lateral difference across longitudes.
    This projection is commonly referred to as "EPSG:4326" or "WitGS 84", although
    neither of these are projections. The Equirectangular projection is useful though because its projected coordinates
    are longitude and latitude, which are the same as the coordinates on the globe.  
    `,
    epsg_code: 'EPSG:4326',
    link: '/4326_reference',
    centers_lat: 0,
    centers_lon: 0,
    image_url: '/images/4326_reference.png',
  },
  {
    name: 'Stereotype (Equal Angle) Polar Projection',
    description: `Stereographic projection is a conformal map projection that maps the entire sphere to a plane, meaning
    it preserves the angles between the lines on the map. This projection is commonly used for mapping the polar regions.
    This one is centered around the South Pole, and is also known as the "Antarctic Polar Stereographic" projection.
    You can see that to preserve angles, the map is greatly stretched near the center point (the distance around on a
    constant latitude lines is much smaller so it vertically is compressed), and the further away from the center point
    there is huge vertical extension to preserve the angles. You can see with the drastic difference
    between the constant latitude lines on the map
    `,
    epsg_code: 'EPSG:3031',
    link: '/3031_reference',
    centers_lat: -90,
    centers_lon: 0,
    image_url: '/images/3031_reference.png',
  },
  {
    name: 'Lazimuthal Equal Area Projection Europe',
    description: `Like the other Azimuthal Equal Area projection, this projection keeps the relative size of areas correct,
    but is now centered around Europe. This translates to shapes around the center [Europe] being preserved, but
    the further away from the center point, the more distorted the shape of the area becomes. The area is maintained
    with strong compression. Its so drastic in fact, that you might notice over 30 degrees of latitude 
    near the north pole [-60,-90] is projecte partially on the bottom of the map. It also distorts 
    the longtiude and latitude lines, which were straight on the Lazimuathal Equal Area projection. centered
    at the North Pole. This is because the growth of vertical compression is longer in the same direction
    as the latitude lines.`,
    epsg_code: 'EPSG:3035',
    link: '/3035_reference',
    centers_lat: 52,
    centers_lon: 10,
    image_url: '/images/3035_reference.png',
  },
];

export type { ProjectionType };

export default ProjectionLists;
