import fs from 'fs';
import pWaitFor from 'p-wait-for';
import path from 'path';

import { Transmission } from '../src/index';

const host = 'http://localhost:9091/';
const torrentFile = path.join(__dirname, '/ubuntu-18.04.1-desktop-amd64.iso.torrent');

async function setupTorrent(transmission: Transmission) {
  const res = await transmission.addTorrent(torrentFile);
  await pWaitFor(
    async () => {
      const r = await transmission.listTorrents(undefined, ['id']);
      return r.arguments.torrents.length === 1;
    },
    { timeout: 10000, interval: 200 },
  );
  return res.arguments['torrent-added'].id;
}

describe('Transmission', () => {
  afterEach(async () => {
    const transmission = new Transmission({ host });
    const res = await transmission.listTorrents();
    // clean up all torrents
    for (const torrent of res.arguments.torrents) {
      await transmission.removeTorrent(torrent.id, false);
    }
  });
  it('should be instantiable', async () => {
    const transmission = new Transmission({ host });
    expect(transmission).toBeTruthy();
  });
  it('should add torrent from file path string', async () => {
    const transmission = new Transmission({ host });
    const res = await transmission.addTorrent(torrentFile);
    expect(res.result).toBe('success');
  });
  it('should add torrent from file buffer', async () => {
    const transmission = new Transmission({ host });
    const res = await transmission.addTorrent(fs.readFileSync(torrentFile));
    expect(res.result).toBe('success');
  });
  it('should add torrent from file contents base64', async () => {
    const transmission = new Transmission({ host });
    const contents = Buffer.from(fs.readFileSync(torrentFile)).toString('base64');
    const res = await transmission.addTorrent(contents);
    expect(res.result).toBe('success');
  });
  it('should get torrents', async () => {
    const transmission = new Transmission({ host });
    await setupTorrent(transmission);
    const res = await transmission.listTorrents(undefined, ['id']);
    expect(res.arguments.torrents).toHaveLength(1);
  });
  it('should remove torrent', async () => {
    const transmission = new Transmission({ host });
    const key = await setupTorrent(transmission);
    await transmission.removeTorrent(key, false);
  });
  it('should verify torrent', async () => {
    const transmission = new Transmission({ host });
    const key = await setupTorrent(transmission);
    await transmission.verifyTorrent(key);
  });
  it('should move in queue', async () => {
    const transmission = new Transmission({ host });
    const key = await setupTorrent(transmission);
    await transmission.queueUp(key);
    await transmission.queueDown(key);
    await transmission.queueTop(key);
    await transmission.queueBottom(key);
  });
  it('should report free space', async () => {
    const transmission = new Transmission({ host });
    const p = '/downloads';
    const res = await transmission.freeSpace(p);
    expect(res.result).toBe('success');
    expect(res.arguments.path).toBe(p);
    expect(typeof res.arguments['size-bytes']).toBe('number');
  });
});
