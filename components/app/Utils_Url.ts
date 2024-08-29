import { WalkingTrip } from '@/definitions/Walking_View';
import { WalkingPath } from '@/definitions/Walking_View';

import LZString from 'lz-string';

const update_url_based_on_path_string = (trip: WalkingTrip) => {
  // Compress the string
  const path_string_uncompressed = JSON.stringify(trip.paths);
  const path_string_compressed = LZString.compress(path_string_uncompressed);

  //convert to hexadecimal
  const hexString = Array.from(path_string_compressed)

    .map((char) => {
      return char.charCodeAt(0).toString(16);
    })
    .join(' ');

  //clean old url
  //clear the URL and path
  const pre_url_clear = new URL(window.location.href);

  pre_url_clear.searchParams.delete('path');

  window.history.pushState({}, '', pre_url_clear.toString());

  //save the compressed string to the URL
  const url_pre = new URL(window.location.href);

  // URL encode the compressed string
  //no need to URI encode the string

  //const url_encoded = encodeURIComponent(path_string_compressed);

  //push to the URL
  url_pre.searchParams.set('path', hexString);

  window.history.pushState({}, '', url_pre.toString());
};

const retrieve_path_from_url = (): WalkingPath[] => {
  // get the URL parameter path
  const url = new URL(window.location.href);

  console.log('Building Trip From URL');

  // get the path parameter
  const path = url.searchParams.get('path');

  console.log('Path:', path);

  if (!path) return [];

  if (path === '') return [];

  //test 
  try {
    // URL decode the string

    const hexString = path
      .split(' ')
      .map((char) => {
        return String.fromCharCode(parseInt(char, 16));
      })
      .join('');

    // now, decompress the string
    const path_string_uncompressed_new = LZString.decompress(hexString);

    // Parse the JSON
    const path_json_new = JSON.parse(path_string_uncompressed_new);

    if (!path_json_new) {
      return [];
    }

    return path_json_new;
  } catch (e) {
    console.error('Error parsing path:', e);
    return [];
  }
};

export { update_url_based_on_path_string, retrieve_path_from_url };
