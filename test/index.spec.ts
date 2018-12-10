import path from 'path';
import { Transmission } from '../src/index';

const baseURL = 'http://localhost:9091/';
const torrentFile = path.join(__dirname + '/ubuntu-18.04.1-desktop-amd64.iso.torrent');

describe('Transmission', () => {
  it('should be instantiable', async () => {
    const deluge = new Transmission({ baseURL });
    expect(deluge).toBeTruthy();
  });
});
