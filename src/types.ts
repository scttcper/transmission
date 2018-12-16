export interface DefaultResponse {
  arguments: any;
  result: 'success' | string;
}

export interface AddTorrentOptions {
  /**
   * base64 encoded torrent file contents
   */
  metainfo?: string;
  'download-dir': string;
  paused: boolean;
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
 * "ids" should be one of the following:
 * (1) an integer referring to a torrent id
 * (2) a list of torrent id numbers, sha1 hash strings, or both
 * (3) a string, "recently-active", for recently-active torrents
 */
export type TorrentIds = number | 'recently-active' | (number | string)[];

export interface GetTorrentRepsonse extends DefaultResponse {
  arguments: {
    removed: Torrent[];
    torrents: Torrent[];
  };
}

export interface Torrent {
  downloadDir: string;
  error: number;
  errorString: string;
  eta: number;
  id: number;
  isFinished: boolean;
  isStalled: boolean;
  leftUntilDone: number;
  metadataPercentComplete: number;
  peersConnected: number;
  peersGettingFromUs: number;
  peersSendingToUs: number;
  percentDone: number;
  queuePosition: number;
  rateDownload: number;
  rateUpload: number;
  recheckProgress: number;
  seedRatioLimit: number;
  seedRatioMode: number;
  sizeWhenDone: number;
  status: number;
  trackers: Tracker[];
  uploadRatio: number;
  uploadedEver: number;
  webseedsSendingToUs: number;
}

export interface Tracker {
  announce: string;
  id: number;
  scrape: string;
  tier: number;
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
