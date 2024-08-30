import { FetchError, ofetch } from 'ofetch';
import { joinURL } from 'ufo';
import { uint8ArrayToBase64 } from 'uint8array-extras';

import { magnetDecode } from '@ctrl/magnet-link';
import type {
  AddTorrentOptions as NormalizedAddTorrentOptions,
  AllClientData,
  Label,
  NormalizedTorrent,
  TorrentClient,
  TorrentSettings,
} from '@ctrl/shared-torrent';

import { normalizeTorrentData } from './normalizeTorrentData.js';
import type {
  AddTorrentOptions,
  AddTorrentResponse,
  DefaultResponse,
  FreeSpaceResponse,
  GetTorrentRepsonse,
  NormalizedTorrentIds,
  RenamePathOptions,
  SessionArguments,
  SessionResponse,
  SetTorrentOptions,
  TorrentIds,
} from './types.js';

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
    return res._data;
  }

  async setSession(args: Partial<SessionArguments>): Promise<SessionResponse> {
    const res = await this.request<SessionResponse>('session-set', args);
    return res._data;
  }

  async queueTop(id: NormalizedTorrentIds): Promise<DefaultResponse> {
    const ids = this._handleNormalizedIds(id);
    const res = await this.request<DefaultResponse>('queue-move-top', { ids });
    return res._data;
  }

  async queueBottom(id: NormalizedTorrentIds): Promise<DefaultResponse> {
    const ids = this._handleNormalizedIds(id);
    const res = await this.request<DefaultResponse>('queue-move-bottom', { ids });
    return res._data;
  }

  async queueUp(id: NormalizedTorrentIds): Promise<DefaultResponse> {
    const ids = this._handleNormalizedIds(id);
    const res = await this.request<DefaultResponse>('queue-move-up', { ids });
    return res._data;
  }

  async queueDown(id: NormalizedTorrentIds): Promise<DefaultResponse> {
    const ids = this._handleNormalizedIds(id);
    const res = await this.request<DefaultResponse>('queue-move-down', { ids });
    return res._data;
  }

  async freeSpace(path = '/downloads/complete'): Promise<FreeSpaceResponse> {
    const res = await this.request<FreeSpaceResponse>('free-space', { path });
    return res._data;
  }

  async pauseTorrent(id: NormalizedTorrentIds): Promise<DefaultResponse> {
    const ids = this._handleNormalizedIds(id);
    const res = await this.request<DefaultResponse>('torrent-stop', { ids });
    return res._data;
  }

  async resumeTorrent(id: NormalizedTorrentIds): Promise<DefaultResponse> {
    const ids = this._handleNormalizedIds(id);
    const res = await this.request<DefaultResponse>('torrent-start', { ids });
    return res._data;
  }

  async verifyTorrent(id: NormalizedTorrentIds): Promise<DefaultResponse> {
    const ids = this._handleNormalizedIds(id);
    const res = await this.request<DefaultResponse>('torrent-verify', { ids });
    return res._data;
  }

  /**
   * ask tracker for more peers
   */
  async reannounceTorrent(id: NormalizedTorrentIds): Promise<DefaultResponse> {
    const ids = this._handleNormalizedIds(id);
    const res = await this.request<DefaultResponse>('torrent-reannounce', { ids });
    return res._data;
  }

  async moveTorrent(id: NormalizedTorrentIds, location: string): Promise<DefaultResponse> {
    const ids = this._handleNormalizedIds(id);
    const res = await this.request<DefaultResponse>('torrent-set-location', {
      ids,
      move: true,
      location,
    });
    return res._data;
  }

  /**
   * Torrent Mutators
   */
  async setTorrent(
    id: NormalizedTorrentIds,
    options: Partial<SetTorrentOptions> = {},
  ): Promise<DefaultResponse> {
    const ids = this._handleNormalizedIds(id);
    options.ids = ids;
    const res = await this.request<DefaultResponse>('torrent-set', options);
    return res._data;
  }

  /**
   * Renaming a Torrent's Path
   */
  async renamePath(
    id: NormalizedTorrentIds,
    options: Partial<RenamePathOptions> = {},
  ): Promise<DefaultResponse> {
    const ids = this._handleNormalizedIds(id);
    options.ids = ids;
    const res = await this.request<DefaultResponse>('torrent-rename-path', options);
    return res._data;
  }

  /**
   * Removing a Torrent
   * @param removeData (default: false) If true, remove the downloaded data.
   */
  async removeTorrent(id: NormalizedTorrentIds, removeData = false): Promise<AddTorrentResponse> {
    const ids = this._handleNormalizedIds(id);
    const res = await this.request<AddTorrentResponse>('torrent-remove', {
      ids,
      'delete-local-data': removeData,
    });
    return res._data;
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
    return res._data;
  }

  /**
   * Adding a torrent
   * @param torrent a stream of file content or contents of the file as base64 string
   */
  async addTorrent(
    torrent: string | Uint8Array,
    options: Partial<AddTorrentOptions> = {},
  ): Promise<AddTorrentResponse> {
    const args: AddTorrentOptions = {
      'download-dir': '/downloads',
      paused: false,
      ...options,
    };

    if (typeof torrent === 'string') {
      args.metainfo = torrent;
    } else {
      args.metainfo = uint8ArrayToBase64(torrent);
    }

    const res = await this.request<AddTorrentResponse>('torrent-add', args);
    return res._data;
  }

  async normalizedAddTorrent(
    torrent: string | Uint8Array,
    options: Partial<NormalizedAddTorrentOptions> = {},
  ): Promise<NormalizedTorrent> {
    const torrentOptions: Partial<AddTorrentOptions> = {};
    if (options.startPaused) {
      torrentOptions.paused = true;
    }

    let torrentHash: string | undefined;
    if (typeof torrent === 'string' && torrent.startsWith('magnet:')) {
      torrentHash = magnetDecode(torrent).infoHash;
      if (!torrentHash) {
        throw new Error('Magnet did not contain hash');
      }

      await this.addMagnet(torrent, torrentOptions);
    } else {
      if (!Buffer.isBuffer(torrent)) {
        torrent = Buffer.from(torrent);
      }

      const res = await this.addTorrent(torrent, torrentOptions);
      torrentHash = res.arguments['torrent-added'].hashString;
    }

    if (options.label) {
      await this.setTorrent(torrentHash, { labels: [options.label] });
    }

    return this.getTorrent(torrentHash);
  }

  async getTorrent(id: NormalizedTorrentIds): Promise<NormalizedTorrent> {
    const result = await this.listTorrents(id);
    if (!result.arguments.torrents || result.arguments.torrents.length === 0) {
      throw new Error('Torrent not found');
    }

    return normalizeTorrentData(result.arguments.torrents[0]);
  }

  async getAllData(): Promise<AllClientData> {
    const listTorrents = await this.listTorrents();
    const torrents = listTorrents.arguments.torrents.map(n => normalizeTorrentData(n));
    const labels: Label[] = [];
    for (const torrent of torrents) {
      if (!torrent.label) {
        continue;
      }

      const existing = labels.find(n => n.id === torrent.label);
      if (existing) {
        existing.count += 1;
        continue;
      }

      labels.push({ id: torrent.label, name: torrent.label, count: 1 });
    }

    const results: AllClientData = {
      torrents,
      labels,
      raw: listTorrents,
    };
    return results;
  }

  async listTorrents(
    id?: NormalizedTorrentIds,
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
    const args: Record<string, string[] | NormalizedTorrentIds> = { fields };
    if (id) {
      const ids = this._handleNormalizedIds(id);
      args.ids = ids;
    }

    const res = await this.request<GetTorrentRepsonse>('torrent-get', args);
    return res._data;
  }

  async request<T>(method: string, args: any = {}): Promise<ReturnType<typeof ofetch.raw<T>>> {
    if (!this.sessionId && method !== 'session-get') {
      await this.getSession();
    }

    const headers: Record<string, string | undefined> = {
      'X-Transmission-Session-Id': this.sessionId,
      'Content-Type': 'application/json',
    };
    if (this.config.username || this.config.password) {
      const str = `${this.config.username ?? ''}:${this.config.password ?? ''}`;
      headers.Authorization = 'Basic ' + Buffer.from(str).toString('base64');
    }

    const url = joinURL(this.config.baseUrl, this.config.path);

    try {
      const res = await ofetch.raw<T>(url, {
        method: 'POST',
        body: JSON.stringify({
          method,
          arguments: args,
        }),
        headers,
        retry: 0,
        // allow proxy agent
        timeout: this.config.timeout,
        responseType: 'json',
        parseResponse(body) {
          try {
            return JSON.parse(body);
          } catch (error) {
            return body;
          }
        },
        // @ts-expect-error agent is not in the type
        agent: this.config.agent,
      });

      return res;
    } catch (error: any) {
      if (error instanceof FetchError && error.response.status === 409) {
        this.sessionId = error.response.headers.get('x-transmission-session-id');
        // eslint-disable-next-line no-return-await, @typescript-eslint/return-await
        return await this.request<T>(method, args);
      }

      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      throw error;
    }
  }

  private _handleNormalizedIds(ids: NormalizedTorrentIds): TorrentIds {
    if (typeof ids === 'string' && ids !== 'recently-active') {
      return [ids];
    }

    return ids;
  }
}
