import path from 'path';
import { Transmission } from '../src/index';
import pWaitFor from 'p-wait-for';

const baseURL = 'http://localhost:9091/';
const torrentFile = path.join(__dirname + '/ubuntu-18.04.1-desktop-amd64.iso.torrent');

async function setupTorrent(transmission: Transmission) {
  const res = await transmission.addTorrent(torrentFile);
  await pWaitFor(
    async () => {
      const r = await transmission.listTorrents(undefined, ['id']);
      return r.arguments.torrents.length === 1;
    },
    { timeout: 10000, interval: 10000 },
  );
  return res.arguments['torrent-added'].id;
}

describe('Transmission', () => {
  afterEach(async () => {
    const transmission = new Transmission({ baseURL });
    const res = await transmission.listTorrents();
    for (const torrent of res.arguments.torrents) {
      // clean up all torrents
      await transmission.removeTorrent(torrent.id, false);
    }
  });
  it('should be instantiable', async () => {
    const transmission = new Transmission({ baseURL });
    expect(transmission).toBeTruthy();
  });
  it('should add torrent', async () => {
    const transmission = new Transmission({ baseURL });
    const res = await transmission.addTorrent(torrentFile);
    expect(res.result).toBe('success');
  });
  it('should get torrents', async () => {
    const transmission = new Transmission({ baseURL });
    await setupTorrent(transmission);
    const res = await transmission.listTorrents(undefined, ['id']);
    expect(res.arguments.torrents).toHaveLength(1);
  });
  it('should remove torrent', async () => {
    const transmission = new Transmission({ baseURL });
    await setupTorrent(transmission);
    const res = await transmission.listTorrents();
    expect(res.arguments.torrents).toHaveLength(1);
    await transmission.removeTorrent(res.arguments.torrents[0].id, false);
  });
  it('should move in queue', async () => {
    const transmission = new Transmission({ baseURL });
    await setupTorrent(transmission);
    const res = await transmission.listTorrents();
    const key = res.arguments.torrents[0].id;
    await transmission.queueUp(key);
    await transmission.queueDown(key);
    await transmission.queueTop(key);
    await transmission.queueBottom(key);
  });
  it('should give free space', async () => {
    const transmission = new Transmission({ baseURL });
    const p = '/downloads';
    const res = await transmission.freeSpace(p);
    expect(res.result).toBe('success');
    expect(res.arguments.path).toBe(p);
    expect(typeof res.arguments['size-bytes']).toBe('number');
  });
});
