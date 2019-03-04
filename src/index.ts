import { resolve, URL } from 'url';
import got, { Response, GotJSONOptions } from 'got';
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
import { TorrentSettings } from '@ctrl/shared-torrent';

const defaults: Partial<TorrentSettings> = {
  host: 'localhost',
  port: 9091,
  path: '/transmission/rpc',
  username: '',
  password: '',
};

export class Transmission {
  config: Partial<TorrentSettings>;

  sessionId?: string;

  constructor(options: Partial<TorrentSettings> = {}) {
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
      args.metainfo = fs.existsSync(torrent) ?
        Buffer.from(fs.readFileSync(torrent)).toString('base64') :
        Buffer.from(torrent, 'base64').toString('base64');
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
      try {
        await this.getSession();
      } catch {
        throw new Error('Failed to get session');
      }
    }

    const headers: any = {
      'X-Transmission-Session-Id': this.sessionId,
    };
    if (this.config.username || this.config.password) {
      let auth = this.config.username || '';
      if (this.config.password) {
        auth = `${this.config.username}:${this.config.password}`;
      }

      headers.Authorization = 'Basic ' + Buffer.from(auth).toString('base64');
    }

    const baseUrl = new URL(this.config.host as string);
    if (this.config.port) {
      baseUrl.port = `${this.config.port}`;
    }

    const url = resolve(baseUrl.toString(), this.config.path as string);
    const options: GotJSONOptions = {
      body: {
        method,
        arguments: args,
      },
      headers,
      json: true,
    };
    // allow proxy agent
    if (this.config.agent) {
      options.agent = this.config.agent;
    }

    try {
      return await got.post(url, options);
    } catch (error) {
      if (error.response && error.response.statusCode === 409) {
        this.sessionId = error.response.headers['x-transmission-session-id'];
        return this.request<T>(method, args);
      }

      throw error;
    }
  }
}
