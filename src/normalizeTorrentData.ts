import { TorrentState, type NormalizedTorrent } from '@ctrl/shared-torrent';

import type { Torrent } from './types.js';

export function normalizeTorrentData(torrent: Torrent): NormalizedTorrent {
  const dateAdded = new Date(torrent.addedDate * 1000).toISOString();
  // doneDate is 0 until the torrent finishes
  const dateCompleted =
    torrent.doneDate > 0 ? new Date(torrent.doneDate * 1000).toISOString() : undefined;

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

  const isCompleted = torrent.leftUntilDone < 1;
  // peers with every piece are seeds, swarm counts come from tracker scrapes (-1 until scraped)
  const connectedSeeds = torrent.peers.filter(peer => peer.progress === 1).length;
  const totalSeeds = Math.max(0, ...torrent.trackerStats.map(tracker => tracker.seederCount));
  const totalPeers = Math.max(0, ...torrent.trackerStats.map(tracker => tracker.leecherCount));

  return {
    id: torrent.hashString,
    name: torrent.name,
    state,
    isCompleted,
    stateMessage: torrent.errorString,
    progress: torrent.percentDone,
    // -1 is not available and -2 is infinite
    ratio: Math.max(torrent.uploadRatio, 0),
    dateAdded,
    dateCompleted,
    label: torrent.labels?.length ? torrent.labels[0] : undefined,
    savePath: torrent.downloadDir,
    uploadSpeed: torrent.rateUpload,
    downloadSpeed: torrent.rateDownload,
    // -1 is not available and -2 is unknown
    eta: isCompleted ? 0 : Math.max(torrent.eta, -1),
    // transmission's queue position starts at 0
    queuePosition: torrent.queuePosition + 1,
    connectedPeers: torrent.peersConnected - connectedSeeds,
    connectedSeeds,
    totalPeers,
    totalSeeds,
    totalSelected: torrent.sizeWhenDone,
    totalSize: torrent.totalSize,
    totalUploaded: torrent.uploadedEver,
    totalDownloaded: torrent.downloadedEver,
    raw: torrent,
  };
}
