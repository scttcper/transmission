import { describe, afterEach, it, expect } from '@jest/globals';
import fs from 'fs';
import pWaitFor from 'p-wait-for';
import path from 'path';

import { Transmission } from '../src/index';
import { TorrentState } from '@ctrl/shared-torrent';

const baseUrl = 'http://localhost:9091/';
const torrentName = 'ubuntu-18.04.1-desktop-amd64.iso';
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
    const transmission = new Transmission({ baseUrl });
    const res = await transmission.listTorrents();
    // clean up all torrents
    for (const torrent of res.arguments.torrents) {
      // eslint-disable-next-line no-await-in-loop
      await transmission.removeTorrent(torrent.id, false);
    }
  });
  it('should be instantiable', () => {
    const transmission = new Transmission({ baseUrl });
    expect(transmission).toBeTruthy();
  });
  it('should add torrent from file path string', async () => {
    const transmission = new Transmission({ baseUrl });
    const res = await transmission.addTorrent(torrentFile);
    expect(res.result).toBe('success');
  });
  it('should add magnet link', async () => {
    const magnet =
      'magnet:?xt=urn:btih:B0B81206633C42874173D22E564D293DAEFC45E2&dn=Ubuntu+11+10+Alternate+Amd64+Iso&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969%2Fannounce&tr=udp%3A%2F%2F9.rarbg.to%3A2710%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.open-internet.nl%3A6969%2Fannounce&tr=udp%3A%2F%2Fopen.demonii.si%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.pirateparty.gr%3A6969%2Fannounce&tr=udp%3A%2F%2Fdenis.stalker.upeer.me%3A6969%2Fannounce&tr=udp%3A%2F%2Fp4p.arenabg.com%3A1337%2Fannounce&tr=udp%3A%2F%2Fexodus.desync.com%3A6969%2Fannounce';
    const client = new Transmission({ baseUrl });
    const res = await client.addMagnet(magnet);
    expect(res.result).toBe('success');
  });
  it('should add torrent from file buffer', async () => {
    const transmission = new Transmission({ baseUrl });
    const res = await transmission.addTorrent(fs.readFileSync(torrentFile));
    expect(res.result).toBe('success');
  });
  it('should add torrent from file contents base64', async () => {
    const transmission = new Transmission({ baseUrl });
    const contents = Buffer.from(fs.readFileSync(torrentFile)).toString('base64');
    const res = await transmission.addTorrent(contents);
    expect(res.result).toBe('success');
  });
  it('should get torrents', async () => {
    const transmission = new Transmission({ baseUrl });
    await setupTorrent(transmission);
    const res = await transmission.listTorrents(undefined, ['id']);
    expect(res.arguments.torrents).toHaveLength(1);
  });
  it('should get normalized all torrent data', async () => {
    const transmission = new Transmission({ baseUrl });
    await setupTorrent(transmission);
    const res = await transmission.getAllData();
    expect(res.torrents).toHaveLength(1);
    expect(res.torrents[0].name).toBe(torrentName);
  });
  it('should get normalized torrent data', async () => {
    const transmission = new Transmission({ baseUrl });
    const id = await setupTorrent(transmission);
    const res = await transmission.getTorrent(id);
    expect(res.name).toBe(torrentName);
  });
  it('should remove torrent', async () => {
    const transmission = new Transmission({ baseUrl });
    const key = await setupTorrent(transmission);
    await transmission.removeTorrent(key, false);
  });
  it('should verify torrent', async () => {
    const transmission = new Transmission({ baseUrl });
    const key = await setupTorrent(transmission);
    await transmission.verifyTorrent(key);
  });
  it('should move in queue', async () => {
    const transmission = new Transmission({ baseUrl });
    const key = await setupTorrent(transmission);
    await transmission.queueUp(key);
    await transmission.queueDown(key);
    await transmission.queueTop(key);
    await transmission.queueBottom(key);
  });
  it('should report free space', async () => {
    const transmission = new Transmission({ baseUrl });
    const p = '/downloads';
    const res = await transmission.freeSpace(p);
    expect(res.result).toBe('success');
    expect(res.arguments.path).toBe(p);
    expect(typeof res.arguments['size-bytes']).toBe('number');
  });
  it('should report free space', async () => {
    const transmission = new Transmission({ baseUrl });
    const res = await transmission.addUrl(
      'https://releases.ubuntu.com/20.10/ubuntu-20.10-desktop-amd64.iso.torrent',
    );
    expect(res.result).toBe('success');
  });
  it('should add torrent with normalized response', async () => {
    const client = new Transmission({ baseUrl });

    const torrent = await client.normalizedAddTorrent(fs.readFileSync(torrentFile), {
      label: 'test',
    });
    expect(torrent.connectedPeers).toBe(0);
    expect(torrent.connectedSeeds).toBe(0);
    expect(torrent.downloadSpeed).toBe(0);
    expect(torrent.eta).toBe(-1);
    expect(torrent.isCompleted).toBe(false);
    expect(torrent.label).toBe('test');
    expect(torrent.name).toBe(torrentName);
    expect(torrent.progress).toBeGreaterThanOrEqual(0);
    expect(torrent.queuePosition).toBe(0);
    // expect(torrent.ratio).toBe(0);
    expect(torrent.savePath).toBe('/downloads');
    expect(torrent.state).toBe(TorrentState.checking);
    expect(torrent.stateMessage).toBe('');
    expect(torrent.totalDownloaded).toBe(0);
    expect(torrent.totalPeers).toBe(0);
    expect(torrent.totalSeeds).toBe(0);
    expect(torrent.totalSelected).toBe(1953349632);
    // expect(torrent.totalSize).toBe(undefined);
    expect(torrent.totalUploaded).toBe(0);
    expect(torrent.uploadSpeed).toBe(0);
  });
});
