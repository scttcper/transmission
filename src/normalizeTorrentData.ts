import type { NormalizedTorrent } from '@ctrl/shared-torrent';
import { TorrentState } from '@ctrl/shared-torrent';

import type { Torrent } from './types.js';

export function normalizeTorrentData(torrent: Torrent): NormalizedTorrent {
  const dateAdded = new Date(torrent.addedDate * 1000).toISOString();
  const dateCompleted = new Date(torrent.doneDate * 1000).toISOString();

  // normalize state to enum
  // https://github.com/transmission/transmission/blob/c11f2870fd18ff781ca06ce84b6d43541f3293dd/web/javascript/torrent.js#L18
  let state = TorrentState.unknown;
  if (torrent.status === 6) {
    state = TorrentState.seeding;
  } else if (torrent.status === 4) {
    state = TorrentState.downloading;
  } else if (torrent.status === 0) {
    state = TorrentState.paused;
  } else if (torrent.status === 2) {
    state = TorrentState.checking;
  } else if (torrent.status === 3 || torrent.status === 5) {
    state = TorrentState.queued;
  }

  return {
    id: torrent.hashString,
    name: torrent.name,
    state,
    isCompleted: torrent.leftUntilDone < 1,
    stateMessage: '',
    progress: torrent.percentDone,
    ratio: torrent.uploadRatio,
    dateAdded,
    dateCompleted,
    label: torrent.labels?.length ? torrent.labels[0] : undefined,
    savePath: torrent.downloadDir,
    uploadSpeed: torrent.rateUpload,
    downloadSpeed: torrent.rateDownload,
    eta: torrent.eta,
    queuePosition: torrent.queuePosition,
    connectedPeers: torrent.peersSendingToUs,
    connectedSeeds: torrent.peersGettingFromUs,
    totalPeers: torrent.peersConnected,
    totalSeeds: torrent.peersConnected,
    totalSelected: torrent.sizeWhenDone,
    totalSize: torrent.totalSize,
    totalUploaded: torrent.uploadedEver,
    totalDownloaded: torrent.downloadedEver,
    raw: torrent,
  };
}
