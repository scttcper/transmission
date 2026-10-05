# transmission [![npm](https://img.shields.io/npm/v/@ctrl/transmission.svg?maxAge=3600)](https://www.npmjs.com/package/@ctrl/transmission)

### Install

```sh
npm install @ctrl/transmission
```

### Use

```ts
import { Transmission } from '@ctrl/transmission';

const client = new Transmission({
  baseUrl: 'http://localhost:9091/',
  password: '',
});

async function main() {
  const res = await client.getAllData();
  console.log(res);
}
```

### Api

Docs: https://transmission.ep.workers.dev  
API Docs: https://github.com/transmission/transmission/blob/main/docs/rpc-spec.md

### Normalized API

These functions are normalized through [@ctrl/shared-torrent](https://github.com/scttcper/shared-torrent), which makes it easier to support multiple torrent clients. See [below](#see-also) for alternative supported torrent clients.

##### getAllData

Returns all torrent data and an array of label objects. Data has been normalized and does not match the output of native `listTorrents()`.

```ts
const data = await client.getAllData();
console.log(data.torrents);
```

##### getTorrent

Returns one torrent data from torrent hash

```ts
const data = await client.getTorrent('torrent-hash');
console.log(data);
```

##### pauseTorrent and resumeTorrent

Pause or resume a torrent

```ts
const paused = await client.pauseTorrent('torrent-hash');
console.log(paused);
const resumed = await client.resumeTorrent('torrent-hash');
console.log(resumed);
```

##### removeTorrent

Remove a torrent. Does not remove data on disk by default.

```ts
// does not remove data on disk
const result = await client.removeTorrent('torrent-hash', false);
console.log(result);

// remove data on disk
const res = await client.removeTorrent('torrent-hash', true);
console.log(res);
```

##### queueUp and queueDown

Move a torrent up or down the queue

```ts
await client.queueUp('torrent-hash');
await client.queueDown('torrent-hash');
```

##### addTorrent

Add a torrent from a magnet link or torrent file, has client specific options. Also see normalizedAddTorrent

```ts
import { readFileSync } from 'node:fs';

const result = await client.addTorrent(new Uint8Array(readFileSync('./linux.torrent')));
console.log(result);
```

##### normalizedAddTorrent

Add a torrent and return normalized torrent data, can start a torrent paused and add label

```ts
const result = await client.normalizedAddTorrent('magnet:?xt=urn:btih:...', {
  startPaused: false,
  label: 'linux',
});
console.log(result);
```

##### export and create from state

If you're shutting down the server often (serverless?) you can export the state

```ts
const state = client.exportState();
const restored = Transmission.createFromState(config, state);
```

### See Also

All of the following npm modules provide the same normalized functions along with supporting the unique apis for each client.

- shared types - [@ctrl/shared-torrent](https://github.com/scttcper/shared-torrent)
- deluge - [@ctrl/deluge](https://github.com/scttcper/deluge)
- qbittorrent - [@ctrl/qbittorrent](https://github.com/scttcper/qbittorrent)
- utorrent - [@ctrl/utorrent](https://github.com/scttcper/utorrent)
- rtorrent - [@ctrl/rtorrent](https://github.com/scttcper/rtorrent)
- rqbit - [@ctrl/rqbit](https://github.com/scttcper/rqbit)

Usenet clients with the same normalized approach:

- usenet shared types - [@ctrl/shared-usenet](https://github.com/scttcper/shared-usenet)
- nzbget - [@ctrl/nzbget](https://github.com/scttcper/nzbget)
- sabnzbd - [@ctrl/sabnzbd](https://github.com/scttcper/sabnzbd)

### Start a test docker container

```
docker run -d \
  --name=transmission \
  -e PUID=1000 \
  -e PGID=1000 \
  -e TZ=Etc/UTC \
  -p 9091:9091 \
  -p 51413:51413 \
  -p 51413:51413/udp \
  -v ~/Documents/transmission/config:/config \
  -v ~/Documents/transmission/downloads:/downloads \
  -v ~/Documents/transmission/watch:/watch \
  --restart unless-stopped \
  lscr.io/linuxserver/transmission:latest
```
