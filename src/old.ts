let http = require('http');
let https = require('https');
let util = require('util');
let fs = require('fs');
let events = require('events');
let async = require('async');

let uuid = require('./utils').uuid;

let Transmission = (module.exports = function(options) {
  events.EventEmitter.call(this);

  options = options || {};
  this.url = options.url || '/transmission/rpc';
  this.host = options.host || 'localhost';
  this.port = options.port || 9091;
  this.ssl = options.ssl === true ? true : false;
  this.key = null;

  if (options.username) {
    this.authHeader =
      'Basic ' +
      new Buffer(options.username + (options.password ? ':' + options.password : '')).toString(
        'base64',
      );
  }
});
// So will act like an event emitter
util.inherits(Transmission, events.EventEmitter);

Transmission.prototype.set = function(ids, options, callback) {
  ids = Array.isArray(ids) ? ids : [ids];
  const args = { ids };

  if (typeof options === 'function') {
    callback = options;
  } else {
    if (typeof options === 'object') {
      const keys = Object.keys(options);
      for (let i = 0; i < keys.length; i++) {
        args[keys[i]] = options[keys[i]];
      }
    } else {
      callback(new Error('Arguments mismatch for "bt.set"'));
    }
  }

  this.callServer(
    {
      arguments: args,
      method: this.methods.torrents.set,
      tag: uuid(),
    },
    function(err) {
      callback(err);
    },
  );
};

Transmission.prototype.add = function(path, options, callback) {
  // For retro-compatibility with old function
  this.addUrl(path, options, callback);
};

Transmission.prototype.addFile = function(filePath, options, callback) {
  const self = this;
  fs.readFile(filePath, function(err, data) {
    if (err) {
      throw err;
    }
    const fileContentBase64 = new Buffer(data).toString('base64');
    const args = {};
    args.metainfo = fileContentBase64;
    self.addTorrentDataSrc(args, options, callback);
  });
};

Transmission.prototype.addBase64 = function(fileb64, options, callback) {
  const args = {};
  args.metainfo = fileb64;
  this.addTorrentDataSrc(args, options, callback);
};

Transmission.prototype.addUrl = function(url, options, callback) {
  const args = {};
  args.filename = url;
  this.addTorrentDataSrc(args, options, callback);
};

Transmission.prototype.addTorrentDataSrc = function(args, options, callback) {
  if (typeof options === 'function') {
    callback = options;
  } else {
    if (typeof options === 'object') {
      const keys = Object.keys(options);
      for (let i = 0; i < keys.length; i++) {
        args[keys[i]] = options[keys[i]];
      }
    } else {
      callback(new Error('Arguments mismatch for "bt.add"'));
    }
  }
  this.callServer(
    {
      arguments: args,
      method: this.methods.torrents.add,
      tag: uuid(),
    },
    function(err, result) {
      if (err) {
        return callback(err);
      }
      const torrent = result['torrent-duplicate']
        ? result['torrent-duplicate']
        : result['torrent-added'];
      callback(err, torrent);
    },
  );
};

Transmission.prototype.remove = function(ids, del, callback) {
  ids = Array.isArray(ids) ? ids : [ids];
  if (typeof del === 'function') {
    callback = del;
    del = false;
  }
  const options = {
    arguments: {
      ids,
      'delete-local-data': !!del,
    },
    method: this.methods.torrents.remove,
    tag: uuid(),
  };
  this.callServer(options, callback);
};

Transmission.prototype.move = function(ids, location, move, callback) {
  ids = Array.isArray(ids) ? ids : [ids];
  if (typeof move === 'function') {
    callback = move;
    move = true;
  }
  const options = {
    arguments: {
      ids,
      location,
      move,
    },
    method: this.methods.torrents.location,
    tag: uuid(),
  };
  this.callServer(options, callback);
};

Transmission.prototype.rename = function(ids, path, name, callback) {
  ids = Array.isArray(ids) ? ids : [ids];
  const options = {
    arguments: {
      ids,
      path,
      name,
    },
    method: this.methods.torrents.rename,
    tag: uuid(),
  };
  this.callServer(options, callback);
};

Transmission.prototype.get = function(ids, callback) {
  const options = {
    arguments: {
      fields: this.methods.torrents.fields,
      ids,
    },
    method: this.methods.torrents.get,
    tag: uuid(),
  };

  if (typeof ids === 'function') {
    callback = ids;
    delete options.arguments.ids;
  } else {
    options.arguments.ids = Array.isArray(ids) ? ids : [ids];
  }

  this.callServer(options, callback);
  return this;
};

Transmission.prototype.waitForState = function(id, targetState, callback) {
  const self = this;
  let latestState = 'unknown';
  let latestTorrent = null;
  async.whilst(
    function(a) {
      return latestState !== targetState;
    },
    function(whilstCb) {
      self.get(id, function(err, result) {
        if (err) {
          return whilstCb(err);
        }
        const torrent = result.torrents[0];

        if (!torrent) {
          return callback(new Error('No id (' + id + ') found for torrent'));
        }

        latestTorrent = torrent;
        latestState = self.statusArray[torrent.status];
        if (latestState === targetState) {
          whilstCb(null, torrent);
        } else {
          setTimeout(whilstCb, 1000);
        }
      });
    },
    function(err) {
      if (err) {
        return callback(err);
      }
      callback(null, latestTorrent);
    },
  );
};

Transmission.prototype.peers = function(ids, callback) {
  ids = Array.isArray(ids) ? ids : [ids];
  const options = {
    arguments: {
      fields: ['peers', 'hashString', 'id'],
      ids,
    },
    method: this.methods.torrents.get,
    tag: uuid(),
  };

  this.callServer(options, function(err, result) {
    if (err) {
      return callback(err);
    }
    callback(null, result.torrents);
  });
  return this;
};

Transmission.prototype.files = function(ids, callback) {
  ids = Array.isArray(ids) ? ids : [ids];
  const options = {
    arguments: {
      fields: ['files', 'fileStats', 'hashString', 'id'],
      ids,
    },
    method: this.methods.torrents.get,
    tag: uuid(),
  };

  this.callServer(options, function(err, result) {
    if (err) {
      return callback(err);
    }
    callback(null, result.torrents);
  });
  return this;
};

Transmission.prototype.fast = function(ids, callback) {
  ids = Array.isArray(ids) ? ids : [ids];
  const options = {
    arguments: {
      fields: [
        'id',
        'error',
        'errorString',
        'eta',
        'isFinished',
        'isStalled',
        'leftUntilDone',
        'metadataPercentComplete',
        'peersConnected',
        'peersGettingFromUs',
        'peersSendingToUs',
        'percentDone',
        'queuePosition',
        'rateDownload',
        'rateUpload',
        'recheckProgress',
        'seedRatioMode',
        'seedRatioLimit',
        'sizeWhenDone',
        'status',
        'trackers',
        'uploadedEver',
        'uploadRatio',
      ],
      ids,
    },
    method: this.methods.torrents.get,
    tag: uuid(),
  };
  this.callServer(options, function(err, result) {
    if (err) {
      return callback(err);
    }
    callback(null, result.torrents);
  });
  return this;
};

Transmission.prototype.stop = function(ids, callback) {
  ids = Array.isArray(ids) ? ids : [ids];
  this.callServer(
    {
      arguments: {
        ids,
      },
      method: this.methods.torrents.stop,
      tag: uuid(),
    },
    callback,
  );
  return this;
};

Transmission.prototype.stopAll = function(callback) {
  this.callServer(
    {
      method: this.methods.torrents.stop,
    },
    callback,
  );
  return this;
};

Transmission.prototype.start = function(ids, callback) {
  ids = Array.isArray(ids) ? ids : [ids];
  this.callServer(
    {
      arguments: {
        ids,
      },
      method: this.methods.torrents.start,
      tag: uuid(),
    },
    callback,
  );
  return this;
};

Transmission.prototype.startAll = function(callback) {
  this.callServer(
    {
      method: this.methods.torrents.start,
    },
    callback,
  );
  return this;
};

Transmission.prototype.startNow = function(ids, callback) {
  ids = Array.isArray(ids) ? ids : [ids];
  this.callServer(
    {
      arguments: {
        ids,
      },
      method: this.methods.torrents.startNow,
      tag: uuid(),
    },
    callback,
  );
  return this;
};

Transmission.prototype.verify = function(ids, callback) {
  ids = Array.isArray(ids) ? ids : [ids];
  this.callServer(
    {
      arguments: {
        ids,
      },
      method: this.methods.torrents.verify,
      tag: uuid(),
    },
    callback,
  );
  return this;
};

Transmission.prototype.reannounce = function(ids, callback) {
  ids = Array.isArray(ids) ? ids : [ids];
  this.callServer(
    {
      arguments: {
        ids,
      },
      method: this.methods.torrents.reannounce,
      tag: uuid(),
    },
    callback,
  );
  return this;
};

Transmission.prototype.all = function(callback) {
  this.callServer(
    {
      arguments: {
        fields: this.methods.torrents.fields,
      },
      method: this.methods.torrents.get,
      tag: uuid(),
    },
    callback,
  );
  return this;
};

Transmission.prototype.active = function(callback) {
  const options = {
    arguments: {
      fields: this.methods.torrents.fields,
      ids: 'recently-active',
    },
    method: this.methods.torrents.get,
    tag: uuid(),
  };
  this.callServer(options, callback);
  return this;
};

Transmission.prototype.session = function(data, callback) {
  let options = {};
  if (typeof data !== 'function') {
    const keys = Object.keys(data);
    let key;
    for (let i = 0; i < keys.length; i++) {
      key = keys[i];
      if (!this.methods.session.setTypes[key]) {
        const error = new Error('Cant set type ' + key);
        // Error.result = page; // FIXME: page not defined
        callback(error);
        return this;
      }
    }
    options = {
      arguments: data,
      method: this.methods.session.set,
      tag: uuid(),
    };
    this.callServer(options, callback);
  } else {
    callback = data;
    options = {
      method: this.methods.session.get,
      tag: uuid(),
    };
    this.callServer(options, callback);
  }
  return this;
};

Transmission.prototype.sessionStats = function(callback) {
  const options = {
    method: this.methods.session.stats,
    tag: uuid(),
  };
  this.callServer(options, callback);
};

Transmission.prototype.freeSpace = function(path, callback) {
  this.callServer(
    {
      arguments: {
        path,
      },
      method: this.methods.other.freeSpace,
    },
    callback,
  );
  return this;
};

Transmission.prototype.callServer = function(query, callBack) {
  const self = this;
  const queryJsonify = JSON.stringify(query);
  const options = {
    host: this.host,
    path: this.url,
    port: this.port,
    method: 'POST',
    headers: {
      Time: new Date(),
      Host: this.host + ':' + this.port,
      'X-Requested-With': 'Node',
      'X-Transmission-Session-Id': this.key || '',
      'Content-Length': queryJsonify.length,
      'Content-Type': 'application/json',
    },
  };

  if (this.authHeader) {
    options.headers.Authorization = this.authHeader;
  }

  function onResponse(response) {
    let page = [];

    function onData(chunk) {
      page.push(chunk);
    }

    function onEnd() {
      let json, error;
      if (response.statusCode === 409) {
        self.key = response.headers['x-transmission-session-id'];
        return self.callServer(query, callBack);
      } else if (response.statusCode === 200) {
        page = page.join('');
        try {
          json = JSON.parse(page);
        } catch (err) {
          return callBack(err);
        }

        if (json.result === 'success') {
          callBack(null, json.arguments);
        } else {
          error = new Error(json.result);
          error.result = page;
          callBack(error);
        }
      } else {
        error = new Error('Status code mismatch: ' + response.statusCode);
        error.result = page;
        callBack(error);
      }
    }

    response.setEncoding('utf8');
    response.on('data', onData);
    response.on('end', onEnd);
  }

  const res = (this.ssl ? https : http).request(options, onResponse);
  res.on('error', callBack).end(queryJsonify, 'utf8');
};

Transmission.prototype.statusArray = [
  'STOPPED',
  'CHECK_WAIT',
  'CHECK',
  'DOWNLOAD_WAIT',
  'DOWNLOAD',
  'SEED_WAIT',
  'SEED',
  'ISOLATED',
];
Transmission.prototype.status = {};

Transmission.prototype.statusArray.forEach(function(status, i) {
  Transmission.prototype.status[status] = i;
});

Transmission.prototype.methods = {
  torrents: {
    stop: 'torrent-stop',
    start: 'torrent-start',
    startNow: 'torrent-start-now',
    verify: 'torrent-verify',
    reannounce: 'torrent-reannounce',
    set: 'torrent-set',
    setTypes: {
      bandwidthPriority: true,
      downloadLimit: true,
      downloadLimited: true,
      'files-wanted': true,
      'files-unwanted': true,
      honorsSessionLimits: true,
      ids: true,
      location: true,
      'peer-limit': true,
      'priority-high': true,
      'priority-low': true,
      'priority-normal': true,
      seedRatioLimit: true,
      seedRatioMode: true,
      uploadLimit: true,
      uploadLimited: true,
    },
    add: 'torrent-add',
    addTypes: {
      'download-dir': true,
      filename: true,
      metainfo: true,
      paused: true,
      'peer-limit': true,
      'files-wanted': true,
      'files-unwanted': true,
      'priority-high': true,
      'priority-low': true,
      'priority-normal': true,
    },
    rename: 'torrent-rename-path',
    remove: 'torrent-remove',
    removeTypes: {
      ids: true,
      'delete-local-data': true,
    },
    location: 'torrent-set-location',
    locationTypes: {
      location: true,
      ids: true,
      move: true,
    },
    get: 'torrent-get',
    fields: [
      'activityDate',
      'addedDate',
      'bandwidthPriority',
      'comment',
      'corruptEver',
      'creator',
      'dateCreated',
      'desiredAvailable',
      'doneDate',
      'downloadDir',
      'downloadedEver',
      'downloadLimit',
      'downloadLimited',
      'error',
      'errorString',
      'eta',
      'files',
      'fileStats',
      'hashString',
      'haveUnchecked',
      'haveValid',
      'honorsSessionLimits',
      'id',
      'isFinished',
      'isPrivate',
      'leftUntilDone',
      'magnetLink',
      'manualAnnounceTime',
      'maxConnectedPeers',
      'metadataPercentComplete',
      'name',
      'peer-limit',
      'peers',
      'peersConnected',
      'peersFrom',
      'peersGettingFromUs',
      'peersKnown',
      'peersSendingToUs',
      'percentDone',
      'pieces',
      'pieceCount',
      'pieceSize',
      'priorities',
      'rateDownload',
      'rateUpload',
      'recheckProgress',
      'seedIdleLimit',
      'seedIdleMode',
      'seedRatioLimit',
      'seedRatioMode',
      'sizeWhenDone',
      'startDate',
      'status',
      'trackers',
      'trackerStats',
      'totalSize',
      'torrentFile',
      'uploadedEver',
      'uploadLimit',
      'uploadLimited',
      'uploadRatio',
      'wanted',
      'webseeds',
      'webseedsSendingToUs',
    ],
  },
  session: {
    stats: 'session-stats',
    get: 'session-get',
    set: 'session-set',
    setTypes: {
      'start-added-torrents': true,
      'alt-speed-down': true,
      'alt-speed-enabled': true,
      'alt-speed-time-begin': true,
      'alt-speed-time-enabled': true,
      'alt-speed-time-end': true,
      'alt-speed-time-day': true,
      'alt-speed-up': true,
      'blocklist-enabled': true,
      'dht-enabled': true,
      encryption: true,
      'download-dir': true,
      'peer-limit-global': true,
      'peer-limit-per-torrent': true,
      'pex-enabled': true,
      'peer-port': true,
      'peer-port-random-on-start': true,
      'port-forwarding-enabled': true,
      seedRatioLimit: true,
      seedRatioLimited: true,
      'speed-limit-down': true,
      'speed-limit-down-enabled': true,
      'speed-limit-up': true,
      'speed-limit-up-enabled': true,
    },
  },
  other: {
    blockList: 'blocklist-update',
    port: 'port-test',
    freeSpace: 'free-space',
  },
};
