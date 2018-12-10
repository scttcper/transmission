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

export interface FreeSpaceOptions {
  path: string;
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
  'cache-size-mb': number;
  /**
   * location of transmission's configuration directory
   */
  'config-dir': string;
  'dht-enabled': boolean;
  'download-dir': string;
  'download-dir-free-space': number;
  'download-queue-enabled': boolean;
  'download-queue-size': number;
  encryption: string;
  'idle-seeding-limit': number;
  'idle-seeding-limit-enabled': boolean;
  'incomplete-dir': string;
  'incomplete-dir-enabled': boolean;
  'lpd-enabled': boolean;
  'peer-limit-global': number;
  'peer-limit-per-torrent': number;
  'peer-port': number;
  'peer-port-random-on-start': boolean;
  'pex-enabled': boolean;
  'port-forwarding-enabled': boolean;
  'queue-stalled-enabled': boolean;
  'queue-stalled-minutes': number;
  'rename-partial-files': boolean;
  'rpc-version': number;
  'rpc-version-minimum': number;
  'script-torrent-done-enabled': boolean;
  'script-torrent-done-filename': string;
  'seed-queue-enabled': boolean;
  'seed-queue-size': number;
  seedRatioLimit: number;
  seedRatioLimited: boolean;
  'speed-limit-down': number;
  'speed-limit-down-enabled': boolean;
  'speed-limit-up': number;
  'speed-limit-up-enabled': boolean;
  'start-added-torrents': boolean;
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
  'memory-bytes': number;
  'memory-units': string[];
  'size-bytes': number;
  'size-units': string[];
  'speed-bytes': number;
  'speed-units': string[];
}
