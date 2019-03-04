# transmission [![npm](https://img.shields.io/npm/v/@ctrl/transmission.svg?maxAge=3600)](https://www.npmjs.com/package/@ctrl/transmission) [![CircleCI](https://circleci.com/gh/TypeCtrl/transmission.svg?style=svg)](https://circleci.com/gh/TypeCtrl/transmission) [![coverage status](https://codecov.io/gh/typectrl/transmission/branch/master/graph/badge.svg)](https://codecov.io/gh/typectrl/transmission)

> TypeScript api wrapper for [transmission](https://transmissionbt.com/) using [got](https://github.com/sindresorhus/got)

### Install

```bash
npm install @ctrl/transmission
```

### Use

```ts
import { Transmission } from '@ctrl/transmission';

const transmission = new Transmission({
  baseUrl: 'http://localhost:9091/',
  password: '',
});

async function main() {
  const res = await transmission.listTorrents();
  console.log(res.result);
}
```

### Api

##### Add torrent
```ts
const transmission = new Transmission();
```

### See Also
deluge - https://github.com/typectrl/deluge
