# transmission [![npm](https://img.shields.io/npm/v/@ctrl/transmission.svg?maxAge=3600)](https://www.npmjs.com/package/@ctrl/transmission) [![build status](https://travis-ci.com/TypeCtrl/transmission.svg?branch=master)](https://travis-ci.org/typectrl/transmission) [![coverage status](https://codecov.io/gh/typectrl/transmission/branch/master/graph/badge.svg)](https://codecov.io/gh/typectrl/transmission)

> TypeScript api wrapper for [transmission](https://transmissionbt.com/) using [got](https://github.com/sindresorhus/got)

### Install

```bash
npm install @ctrl/transmission
```

### Use

```ts
import { Transmission } from '@ctrl/transmission';

const transmission = new Transmission({
  baseURL: 'http://localhost:9091/',
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
