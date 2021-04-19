import { existsSync, readFileSync } from 'fs';

import got, { Response } from 'got';
import { urlJoin } from '@ctrl/url-join';
import {
  AddTorrentOptions as NormalizedAddTorrentOptions,
  AllClientData,
  Label,
  NormalizedTorrent,
  TorrentClient,
  TorrentSettings,
  TorrentState,
} from '@ctrl/shared-torrent';

import {
  AddTorrentOptions,
  AddTorrentResponse,
  DefaultResponse,
  FreeSpaceResponse,
  GetTorrentRepsonse,
  RenamePathOptions,
  SessionArguments,
  SessionResponse,
  SetTorrentOptions,
  Torrent,
  TorrentIds,
} from './types';

const defaults: TorrentSettings = {
  baseUrl: 'http://localhost:9091/',
  path: '/transmission/rpc',
  username: '',
  password: '',
  timeout: 5000,
};

export class Transmission implements TorrentClient {
  config: TorrentSettings;

  sessionId?: string;

  constructor(options: Partial<TorrentSettings> = {}) {
    this.config = { ...defaults, ...options };
  }

  async getSession(): Promise<SessionResponse> {
    const res = await this.request<SessionResponse>('session-get');
    return res.body;
  }

  async setSession(args: Partial<SessionArguments>): Promise<SessionResponse> {
    const res = await this.request<SessionResponse>('session-set', args);
    return res.body;
  }

  async queueTop(ids: TorrentIds): Promise<DefaultResponse> {
    const res = await this.request<DefaultResponse>('queue-move-top', { ids });
    return res.body;
  }

  async queueBottom(ids: TorrentIds): Promise<DefaultResponse> {
    const res = await this.request<DefaultResponse>('queue-move-bottom', { ids });
    return res.body;
  }

  async queueUp(ids: TorrentIds): Promise<DefaultResponse> {
    const res = await this.request<DefaultResponse>('queue-move-up', { ids });
    return res.body;
  }

  async queueDown(ids: TorrentIds): Promise<DefaultResponse> {
    const res = await this.request<DefaultResponse>('queue-move-down', { ids });
    return res.body;
  }

  async freeSpace(path = '/downloads/complete'): Promise<FreeSpaceResponse> {
    const res = await this.request<FreeSpaceResponse>('free-space', { path });
    return res.body;
  }

  async pauseTorrent(ids: TorrentIds): Promise<DefaultResponse> {
    const res = await this.request<DefaultResponse>('torrent-stop', { ids });
    return res.body;
  }

  async resumeTorrent(ids: TorrentIds): Promise<DefaultResponse> {
    const res = await this.request<DefaultResponse>('torrent-start', { ids });
    return res.body;
  }

  async verifyTorrent(ids: TorrentIds): Promise<DefaultResponse> {
    const res = await this.request<DefaultResponse>('torrent-verify', { ids });
    return res.body;
  }

  /**
   * ask tracker for more peers
   */
  async reannounceTorrent(ids: TorrentIds): Promise<DefaultResponse> {
    const res = await this.request<DefaultResponse>('torrent-reannounce', { ids });
    return res.body;
  }

  async moveTorrent(ids: TorrentIds, location: string): Promise<DefaultResponse> {
    const res = await this.request<DefaultResponse>('torrent-set-location', {
      ids,
      move: true,
      location,
    });
    return res.body;
  }

  /**
   * Torrent Mutators
   */
  async setTorrent(
    ids: TorrentIds,
    options: Partial<SetTorrentOptions> = {},
  ): Promise<DefaultResponse> {
    options.ids = ids;
    const res = await this.request<DefaultResponse>('torrent-set', options);
    return res.body;
  }

  /**
   * Renaming a Torrent's Path
   */
  async renamePath(
    ids: TorrentIds,
    options: Partial<RenamePathOptions> = {},
  ): Promise<DefaultResponse> {
    options.ids = ids;
    const res = await this.request<DefaultResponse>('torrent-rename-path', options);
    return res.body;
  }

  /**
   * Removing a Torrent
   */
  async removeTorrent(ids: TorrentIds, removeData = true): Promise<AddTorrentResponse> {
    const res = await this.request<AddTorrentResponse>('torrent-remove', {
      ids,
      'delete-local-data': removeData,
    });
    return res.body;
  }

  /**
   * An alias for {@link Transmission.addMagnet}
   */
  async addUrl(...args: Parameters<Transmission['addMagnet']>) {
    return this.addMagnet(...args);
  }

  /**
   * note: This is the same "torrent-add" action with different options,
   * less confusing to add it as its own method
   * @param url magnet link
   * @param options
   */
  async addMagnet(
    url: string,
    options: Partial<AddTorrentOptions> = {},
  ): Promise<AddTorrentResponse> {
    const args: AddTorrentOptions = {
      'download-dir': '/downloads',
      paused: false,
      ...options,
    };

    args.filename = url;

    const res = await this.request<AddTorrentResponse>('torrent-add', args);
    return res.body;
  }

  /**
   * Adding a torrent
   * @param torrent a string of file path or contents of the file as base64 string
   */
  async addTorrent(
    torrent: string | Buffer,
    options: Partial<AddTorrentOptions> = {},
  ): Promise<AddTorrentResponse> {
    const args: AddTorrentOptions = {
      'download-dir': '/downloads',
      paused: false,
      ...options,
    };

    if (typeof torrent === 'string') {
      args.metainfo = existsSync(torrent)
        ? Buffer.from(readFileSync(torrent)).toString('base64')
        : Buffer.from(torrent, 'base64').toString('base64');
    } else {
      args.metainfo = torrent.toString('base64');
    }

    const res = await this.request<AddTorrentResponse>('torrent-add', args);
    return res.body;
  }

  async normalizedAddTorrent(
    torrent: string | Buffer,
    options: Partial<NormalizedAddTorrentOptions> = {},
  ): Promise<NormalizedTorrent> {
    const torrentOptions: Partial<AddTorrentOptions> = {};
    if (options.startPaused) {
      torrentOptions.paused = true;
    }

    if (!Buffer.isBuffer(torrent)) {
      torrent = Buffer.from(torrent);
    }

    const res = await this.addTorrent(torrent, torrentOptions);
    const torrentId = res.arguments['torrent-added'].id;

    if (options.label) {
      const res = await this.setTorrent(torrentId, { labels: [options.label] });
      console.log(res);
    }

    return this.getTorrent(torrentId);
  }

  async getTorrent(id: TorrentIds): Promise<NormalizedTorrent> {
    const result = await this.listTorrents(id);
    if (!result.arguments.torrents || result.arguments.torrents.length === 0) {
      throw new Error('Torrent not found');
    }

    return this._normalizeTorrentData(result.arguments.torrents[0]);
  }

  async getAllData(): Promise<AllClientData> {
    const listTorrents = await this.listTorrents();
    const torrents = listTorrents.arguments.torrents.map((n) => this._normalizeTorrentData(n));
    const labels: Label[] = [];
    for (const torrent of torrents) {
      if (!torrent.label) {
        continue;
      }

      const existing = labels.find((n) => n.id === torrent.label);
      if (existing) {
        existing.count += 1;
        continue;
      }

      labels.push({ id: torrent.label, name: torrent.label, count: 1 });
    }

    const results: AllClientData = {
      torrents,
      labels,
    };
    return results;
  }

  async listTorrents(
    ids?: TorrentIds,
    additionalFields: string[] = [],
  ): Promise<GetTorrentRepsonse> {
    const fields = [
      'id',
      'addedDate',
      'creator',
      'doneDate',
      'comment',
      'name',
      'totalSize',
      'error',
      'errorString',
      'eta',
      'etaIdle',
      'isFinished',
      'isStalled',
      'isPrivate',
      'files',
      'fileStats',
      'hashString',
      'leftUntilDone',
      'metadataPercentComplete',
      'peers',
      'peersFrom',
      'peersConnected',
      'peersGettingFromUs',
      'peersSendingToUs',
      'percentDone',
      'queuePosition',
      'rateDownload',
      'rateUpload',
      'secondsDownloading',
      'secondsSeeding',
      'recheckProgress',
      'seedRatioMode',
      'seedRatioLimit',
      'seedIdleLimit',
      'sizeWhenDone',
      'status',
      'trackers',
      'downloadDir',
      'downloadLimit',
      'downloadLimited',
      'uploadedEver',
      'downloadedEver',
      'corruptEver',
      'uploadRatio',
      'webseedsSendingToUs',
      'haveUnchecked',
      'haveValid',
      'honorsSessionLimits',
      'manualAnnounceTime',
      'activityDate',
      'desiredAvailable',
      'labels',
      'magnetLink',
      'maxConnectedPeers',
      'peer-limit',
      'priorities',
      'wanted',
      'webseeds',
      ...additionalFields,
    ];
    const args: Record<string, string[] | TorrentIds> = { fields };
    if (ids) {
      args.ids = ids;
    }

    const res = await this.request<GetTorrentRepsonse>('torrent-get', args);
    return res.body;
  }

  // async getTorrent(id: TorrentIds): Promise<NormalizedTorrent> {
  //   const torrent: any = {};
  //   return torrent;
  // }

  async request<T>(method: string, args: any = {}): Promise<Response<T>> {
    if (!this.sessionId && method !== 'session-get') {
      await this.getSession();
    }

    const headers: Record<string, string | undefined> = {
      'X-Transmission-Session-Id': this.sessionId,
    };
    if (this.config.username || this.config.password) {
      const str = `${this.config.username ?? ''}:${this.config.password ?? ''}`;
      headers.Authorization = 'Basic ' + Buffer.from(str).toString('base64');
    }

    const url = urlJoin(this.config.baseUrl, this.config.path);

    try {
      const res = await got.post<T>(url, {
        json: {
          method,
          arguments: args,
        },
        headers,
        retry: 0,
        // allow proxy agent
        agent: this.config.agent,
        timeout: this.config.timeout,
        responseType: 'json',
      });

      return res;
    } catch (error) {
      if (error?.response?.statusCode === 409) {
        this.sessionId = error.response.headers['x-transmission-session-id'];
        // eslint-disable-next-line no-return-await
        return await this.request<T>(method, args);
      }

      throw error;
    }
  }

  private _normalizeTorrentData(torrent: Torrent): NormalizedTorrent {
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

    const result: NormalizedTorrent = {
      id: torrent.id,
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
    };
    return result;
  }
}
