import { Transmission } from '../src';

const baseUrl = 'http://localhost:9091/';
const deluge = new Transmission({ baseUrl });

(async () => {
  const results = await deluge.getAllData();
  console.log(results);
  // console.log(await deluge.getTorrent('b713511b5655a63b0b9e574d30e0fa19facc63d7'));
})();
