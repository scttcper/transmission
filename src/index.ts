import { resolve } from 'url';
import got, { Response } from 'got';
import fs from 'fs';
import {
  AddTorrentOptions,
  AddTorrentResponse,
  SessionResponse,
  SessionArguments,
  TorrentIds,
  GetTorrentRepsonse,
  DefaultResponse,
  FreeSpaceResponse,
} from './types';

export interface TramissionConfig {
  baseURL: string;
  path: string;
  username: string;
  password: string;
}

const defaults: TramissionConfig = {
  baseURL: 'http://localhost:9091/',
  path: '/transmission/rpc',
  username: '',
  password: '',
};

export class Transmission {
  config: TramissionConfig;
  sessionId?: string;

  constructor(options: Partial<TramissionConfig> = {}) {
    this.config = { ...defaults, ...options };
  }

  async getSession() {
    const res = await this.request<SessionResponse>('session-get');
    return res.body;
  }

  async setSession(args: Partial<SessionArguments>) {
    const res = await this.request<SessionResponse>('session-set', args);
    return res.body;
  }

  async queueTop(ids: TorrentIds) {
    const res = await this.request<DefaultResponse>('queue-move-top', { ids });
    return res.body;
  }

  async queueBottom(ids: TorrentIds) {
    const res = await this.request<DefaultResponse>('queue-move-bottom', { ids });
    return res.body;
  }

  async queueUp(ids: TorrentIds) {
    const res = await this.request<DefaultResponse>('queue-move-up', { ids });
    return res.body;
  }

  async queueDown(ids: TorrentIds) {
    const res = await this.request<DefaultResponse>('queue-move-down', { ids });
    return res.body;
  }

  async freeSpace(path = '/downloads/complete') {
    const res = await this.request<FreeSpaceResponse>('free-space', { path });
    return res.body;
  }

  async pauseTorrent(ids: TorrentIds) {
    const res = await this.request<DefaultResponse>('torrent-stop', { ids });
    return res.body;
  }

  async resumeTorrent(ids: TorrentIds) {
    const res = await this.request<DefaultResponse>('torrent-start', { ids });
    return res.body;
  }

  async verifyTorrent(ids: TorrentIds) {
    const res = await this.request<DefaultResponse>('torrent-verify', { ids });
    return res.body;
  }

  /**
   * ask tracker for more peers
   */
  async reannounceTorrent(ids: TorrentIds) {
    const res = await this.request<DefaultResponse>('torrent-reannounce', { ids });
    return res.body;
  }

  async moveTorrent(ids: TorrentIds, location: string) {
    const res = await this.request<DefaultResponse>('torrent-set-location', {
      ids,
      move: true,
      location,
    });
    return res.body;
  }

  /**
   * Removing a Torrent
   */
  async removeTorrent(ids: TorrentIds, removeData = true) {
    const res = await this.request<AddTorrentResponse>('torrent-remove', {
      ids,
      'delete-local-data': removeData,
    });
    return res.body;
  }

  /**
   * Adding a torrent
   * @param torrent a string of file path or contents of the file as base64 string
   */
  async addTorrent(torrent: string | Buffer, options: Partial<AddTorrentOptions> = {}) {
    const args: AddTorrentOptions = {
      'download-dir': '/downloads',
      paused: false,
      ...options,
    };

    if (typeof torrent === 'string') {
      args.metainfo = fs.existsSync(torrent)
        ? Buffer.from(fs.readFileSync(torrent)).toString('base64')
        : Buffer.from(torrent, 'base64').toString('base64');
    } else {
      args.metainfo = torrent.toString('base64');
    }
    const res = await this.request<AddTorrentResponse>('torrent-add', args);
    return res.body;
  }

  async listTorrents(ids?: TorrentIds, additionalFields: string[] = []) {
    const fields = [
      'id',
      'addedDate',
      'name',
      'totalSize',
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
      'downloadDir',
      'uploadedEver',
      'uploadRatio',
      'webseedsSendingToUs',
      ...additionalFields,
    ];
    const args: any = { fields };
    if (ids) {
      args.ids = ids;
    }
    const res = await this.request<GetTorrentRepsonse>('torrent-get', args);
    return res.body;
  }

  async request<T extends object>(method: string, args: any = {}): Promise<Response<T>> {
    if (!this.sessionId && method !== 'session-get') {
      await this.getSession();
    }
    const headers: any = {
      'X-Transmission-Session-Id': this.sessionId,
    };
    if (this.config.username || this.config.password) {
      const auth = this.config.username + (this.config.password ? `:${this.config.password}` : '');
      headers.Authorization = 'Basic ' + Buffer.from(auth).toString('base64');
    }
    const url = resolve(this.config.baseURL, this.config.path);
    try {
      return await got.post(url, {
        json: true,
        body: {
          method,
          arguments: args,
        },
        headers,
      });
    } catch (error) {
      if (error.response && error.response.statusCode === 409) {
        this.sessionId = error.response.headers['x-transmission-session-id'];
        return this.request<T>(method, args);
      }
      throw error;
    }
  }
}
