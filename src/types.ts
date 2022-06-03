export interface DefaultResponse {
  arguments: any;
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  result: 'success' | string;
}

export interface AddTorrentOptions {
  /**
   * base64 encoded torrent file contents
   */
  metainfo?: string;
  'download-dir': string;
  paused: boolean;
  /**
   * Magent link
   */
  filename?: string;
}

export interface AddTorrentResponse extends DefaultResponse {
  arguments: {
    'torrent-added': {
      id: number;
      hashString: string;
      name: string;
    };
  };
}

export interface FreeSpaceResponse extends DefaultResponse {
  arguments: {
    path: string;
    'size-bytes': number;
  };
}

export interface SessionResponse extends DefaultResponse {
  arguments: SessionArguments;
}

export interface FreeSpaceResponse extends DefaultResponse {
  path: string;
  'size-bytes': number;
}

/**
 * "ids", which specifies which torrents to use.
 * All torrents are used if the "ids" argument is omitted.
 *
 * "ids" should be one of the following:
 * 1. an integer referring to a torrent id
 * 2. a list of torrent id numbers, sha1 hash strings, or both
 * 3. a string, "recently-active", for recently-active torrents
 */
export type TorrentIds = number | 'recently-active' | Array<number | string>;

/**
 * Allows the user to pass a single hash, this will be converted to an array
 */
// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
export type NormalizedTorrentIds = TorrentIds | string;

export interface GetTorrentRepsonse extends DefaultResponse {
  arguments: {
    removed: Torrent[];
    torrents: Torrent[];
  };
}

export interface Torrent {
  id: number;
  name: string;
  downloadDir: string;
  /**
   * When the torrent was first added
   */
  addedDate: number;
  /**
   * When the torrent finished downloading.
   */
  doneDate: number;
  comment: string;
  /**
   * Defines what kind of text is in errorString.
   */
  error: number;
  /**
   * A warning or error message regarding the torrent.
   */
  errorString: string;
  /**
   * If downloading, estimated number of seconds left until the torrent is done.
   * If seeding, estimated number of seconds left until seed ratio is reached.
   */
  eta: number;
  /**
   * If seeding, number of seconds left until the idle time limit is reached.
   */
  etaIdle: number;
  isFinished: boolean;
  isDownloading: boolean;
  isPrivate: boolean;
  /**
   * True if the torrent is running, but has been idle for long enough to be considered stalled.
   */
  isStalled: boolean;
  /**
   * Byte count of how much data is left to be downloaded until we've got all the pieces that we want.
   */
  leftUntilDone: number;
  magnetLink: string;
  /**
   * How much of the metadata the torrent has. For torrents added from a .torrent this will always be 1. For magnet links, this number will from from 0 to 1 as the metadata is downloaded.
   */
  metadataPercentComplete: number;
  peers: Peers[];
  peersFrom: PeersFrom[];
  priorities: number[];
  wanted: number[];
  webseeds: string[];
  /**
   * Number of peers that we're connected to
   */
  peersConnected: number;
  /**
   * Number of peers that we're sending data to
   */
  peersGettingFromUs: number;
  /**
   * Number of peers that are sending data to us.
   */
  peersSendingToUs: number;
  /**
   * How much has been downloaded of the files the user wants. This differs from percentComplete if the user wants only some of the torrent's files. Range is [0..1]
   */
  percentDone: number;
  /**
   * This torrent's queue position. All torrents have a queue position, even if it's not queued.
   */
  queuePosition: number;
  rateDownload: number;
  rateUpload: number;
  recheckProgress: number;
  seedRatioLimit: number;
  seedIdleLimit: number;
  seedRatioMode: number;
  sizeWhenDone: number;
  totalSize: number;
  status: number;
  trackers: Tracker[];
  files: Files[];
  fileStats: FileStats[];
  hashString: string;
  creator: string;
  /**
   * Byte count of all the piece data we want and don't have yet, but that a connected peer does have.
   */
  desiredAvailable: string;
  uploadRatio: number;
  /**
   * Byte count of all data you've ever uploaded for this torrent.
   */
  uploadedEver: number;
  /**
   * Byte count of all the non-corrupt data you've ever downloaded for this torrent. If you deleted the files and downloaded a second time, this will be 2*totalSize.
   */
  downloadedEver: number;
  /**
   * Byte count of all the corrupt data you've ever downloaded for this torrent. If you're on a poisoned torrent, this number can grow very large.
   */
  downloadLimit: number;
  downloadLimited: boolean;
  corruptEver: number;
  /**
   * Number of webseeds that are sending data to us.
   */
  webseedsSendingToUs: number;
  /**
   * Byte count of all the partial piece data we have for this torrent. As pieces become complete, this value may decrease as portions of it are moved to 'corrupt' or 'haveValid'.
   */
  haveUnchecked: number;
  haveValid: number;
  honorsSessionLimits: boolean;
  labels: string[];
  /**
   * time when one or more of the torrent's trackers will allow you to manually ask for more peers, or 0 if you can't
   */
  manualAnnounceTime: number;
  maxConnectedPeers: number;
  /**
   * Cumulative seconds the torrent's ever spent downloading
   */
  secondsDownloading: number;
  /**
   * Cumulative seconds the torrent's ever spent seeding
   */
  secondsSeeding: number;
  /**
   * The last time we uploaded or downloaded piece data on this torrent.
   */
  activityDate: number;
  'peer-limit': number;
}

export interface FileStats {
  bytesCompleted: number;
  priority: number;
  wanted: boolean;
}

export interface Files {
  bytesCompleted: number;
  length: number;
  name: string;
}

export interface Tracker {
  announce: string;
  id: number;
  scrape: string;
  tier: number;
}

export interface Peers {
  address: string;
  clientName: string;
  clientIsChoked: boolean;
  clientIsInterested: boolean;
  flagStr: string;
  isDownloadingFrom: boolean;
  isEncrypted: boolean;
  isIncoming: boolean;
  isUploadingTo: boolean;
  isUTP: boolean;
  peerIsChoked: boolean;
  peerIsInterested: boolean;
  port: number;
  progress: number;
  rateToClient: number;
  rateToPeer: number;
}

export interface PeersFrom {
  fromCache: number;
  fromDht: number;
  fromIncoming: number;
  fromLpd: number;
  fromLtep: number;
  fromPex: number;
  fromTracker: number;
}

export interface SessionArguments {
  /**
   * max global download speed (KBps)
   */
  'alt-speed-down': number;
  /**
   * true means use the alt speeds
   */
  'alt-speed-enabled': boolean;
  /**
   * when to turn on alt speeds (units: minutes after midnight)
   */
  'alt-speed-time-begin': number;
  /**
   * what day(s) to turn on alt speeds (look at tr_sched_day)
   */
  'alt-speed-time-day': number;
  /**
   * true means the scheduled on/off times are used
   */
  'alt-speed-time-enabled': boolean;
  /**
   * when to turn off alt speeds (units: same)
   */
  'alt-speed-time-end': number;
  /**
   * max global upload speed (KBps)
   */
  'alt-speed-up': number;
  /**
   * true means enabled
   */
  'blocklist-enabled': boolean;
  /**
   * number of rules in the blocklist
   */
  'blocklist-size': number;
  /**
   * location of the blocklist to use for "blocklist-update"
   */
  'blocklist-url': string;
  /**
   * maximum size of the disk cache (MB)
   */
  'cache-size-mb': number;
  /**
   * location of transmission's configuration directory
   */
  'config-dir': string;
  /**
   * true means allow dht in public torrents
   */
  'dht-enabled': boolean;
  /**
   * default path to download torrents
   */
  'download-dir': string;
  'download-dir-free-space': number;
  /**
   * if true, limit how many torrents can be downloaded at once
   */
  'download-queue-enabled': boolean;
  /**
   * max number of torrents to download at once (see download-queue-enabled)
   */
  'download-queue-size': number;
  /**
   * "required", "preferred", "tolerated"
   */
  encryption: string;
  /**
   * torrents we're seeding will be stopped if they're idle for this long
   */
  'idle-seeding-limit': number;
  /**
   * true if the seeding inactivity limit is honored by default
   */
  'idle-seeding-limit-enabled': boolean;
  /**
   * path for incomplete torrents, when enabled
   */
  'incomplete-dir': string;
  /**
   * true means keep torrents in incomplete-dir until done
   */
  'incomplete-dir-enabled': boolean;
  /**
   * true means allow Local Peer Discovery in public torrents
   */
  'lpd-enabled': boolean;
  /**
   * maximum global number of peers
   */
  'peer-limit-global': number;
  /**
   * maximum global number of peers
   */
  'peer-limit-per-torrent': number;
  /**
   * port number
   */
  'peer-port': number;
  /**
   * true means pick a random peer port on launch
   */
  'peer-port-random-on-start': boolean;
  /**
   * true means allow pex in public torrents
   */
  'pex-enabled': boolean;
  /**
   * true means enabled
   */
  'port-forwarding-enabled': boolean;
  /**
   * whether or not to consider idle torrents as stalled
   */
  'queue-stalled-enabled': boolean;
  /**
   * torrents that are idle for N minuets aren't counted toward seed-queue-size or download-queue-size
   */
  'queue-stalled-minutes': number;
  /**
   * true means append ".part" to incomplete files
   */
  'rename-partial-files': boolean;
  /**
   * the current RPC API version
   */
  'rpc-version': number;
  /**
   * the minimum RPC API version supported
   */
  'rpc-version-minimum': number;
  /**
   * whether or not to call the "done" script
   */
  'script-torrent-done-enabled': boolean;
  /**
   * filename of the script to run
   */
  'script-torrent-done-filename': string;
  /**
   * if true, limit how many torrents can be uploaded at once
   */
  'seed-queue-enabled': boolean;
  /**
   * max number of torrents to uploaded at once (see seed-queue-enabled)
   */
  'seed-queue-size': number;
  /**
   * the default seed ratio for torrents to use
   */
  seedRatioLimit: number;
  /**
   * true if seedRatioLimit is honored by default
   */
  seedRatioLimited: boolean;
  /**
   * max global download speed (KBps)
   */
  'speed-limit-down': number;
  /**
   * true means enabled
   */
  'speed-limit-down-enabled': boolean;
  /**
   * max global upload speed (KBps)
   */
  'speed-limit-up': number;
  /**
   * true means enabled
   */
  'speed-limit-up-enabled': boolean;
  /**
   * true means added torrents will be started right away
   */
  'start-added-torrents': boolean;
  /**
   * true means the .torrent file of added torrents will be deleted
   */
  'trash-original-torrent-files': boolean;
  units: Units;
  /**
   * true means allow utp
   */
  'utp-enabled': boolean;
  /**
   * long version string "$version ($revision)"
   */
  version: string;
}

export interface Units {
  /**
   * number of bytes in a KB (1000 for kB; 1024 for KiB)
   */
  'memory-bytes': number;
  /**
   * 4 strings: KB/s, MB/s, GB/s, TB/s
   */
  'memory-units': string[];
  /**
   * number of bytes in a KB (1000 for kB; 1024 for KiB)
   */
  'size-bytes': number;
  /**
   * 4 strings: KB/s, MB/s, GB/s, TB/s
   */
  'size-units': string[];
  /**
   * number of bytes in a KB (1000 for kB; 1024 for KiB)
   */
  'speed-bytes': number;
  /**
   * 4 strings: KB/s, MB/s, GB/s, TB/s
   */
  'speed-units': string[];
}

export interface SetTorrentOptions {
  /**
   * this torrent's bandwidth tr_priority_t
   */
  bandwidthPriority: number;
  /**
   * maximum download speed (KBps)
   */
  downloadLimit: number;
  /**
   * true if "downloadLimit" is honored
   */
  downloadLimited: boolean;
  /**
   * indices of file(s) to download
   */
  'files-wanted': number[];
  /**
   * indices of file(s) to not download
   */
  'files-unwanted': number[];
  /**
   * true if session upload limits are honored
   */
  honorsSessionLimits: boolean;
  /**
   * torrent list, as described in 3.1
   */
  ids: TorrentIds;
  /**
   * array of string labels
   */
  labels: string[];
  /**
   * new location of the torrent's content
   */
  location: string;
  /**
   * maximum number of peers
   */
  'peer-limit': number;
  /**
   * indices of high-priority file(s)
   */
  'priority-high': number[];
  /**
   * indices of low-priority file(s)
   */
  'priority-low': number[];
  /**
   * indices of normal-priority file(s)
   */
  'priority-normal': number[];
  /**
   * position of this torrent in its queue [0...n)
   */
  queuePosition: number;
  /**
   * torrent-level number of minutes of seeding inactivity
   */
  seedIdleLimit: number;
  /**
   * which seeding inactivity to use.  See tr_idlelimit
   */
  seedIdleMode: number;
  /**
   * torrent-level seeding ratio
   */
  seedRatioLimit: number;
  /**
   * which ratio to use.  See tr_ratiolimit
   */
  seedRatioMode: number;
  /**
   * strings of announce URLs to add
   */
  trackerAdd: string[];
  /**
   * ids of trackers to remove
   */
  trackerRemove: number[];
  /**
   * pairs of <trackerId/new announce URLs>
   */
  trackerReplace: any[];
  /**
   * maximum upload speed (KBps)
   */
  uploadLimit: number;
  /**
   * true if "uploadLimit" is honored
   */
  uploadLimited: boolean;
}

export interface RenamePathOptions {
  /**
   * torrent list, as described in 3.1
   */
  ids: TorrentIds;
  /**
   * the path to the file or folder that will be renamed
   */
  path: string;
  /**
   * the file or folder's new name
   */
  name: string;
}
