import { resolve } from 'url';
import got, { Response } from 'got';
import { AddTorrentOptions, AddTorrentResponse, SessionResponse, SessionArguments } from './types';

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

  constructor(options: Partial<TramissionConfig>) {
    this.config = { ...defaults, ...options };
  }

  async getSession() {
    const res = await this.request<SessionResponse>('session-get');
    return res.body;
  }

  async setSession(args: Partial<SessionArguments>) {
    const res = await this.request<SessionResponse>('session-set', { arguments: args });
    return res.body;
  }

  /**
   * Removing a Torrent
   */
  async removeTorrent(ids: number[], removeData = true) {
    const res = await this.request<AddTorrentResponse>('torrent-remove', {
      ids,
      'delete-local-data': removeData,
    });
    return res.body;
  }

  /**
   * Adding a Torrent
   */
  async addTorrent(filePath: string, options: Partial<AddTorrentOptions> = {}) {
    const args: AddTorrentOptions = {
      'download-dir': '/downloads',
      paused: false,
      ...options,
    };

    const f = fs.createReadStream(filePath);
    args.metainfo = f.toString('base64');

    const res = await this.request<AddTorrentResponse>('torrent-add', args);
    return res.body;
  }

  async request<T extends object>(method: string, args: any = {}): Promise<Response<T>> {
    const headers: any = {};
    if (this.config.username || this.config.password) {
      const auth = this.config.username + (this.config.password ? `:${this.config.password}` : '');
      headers.Authorization = Buffer.from(auth).toString('base64');
    }
    const url = resolve(this.config.baseURL, this.config.path);
    return got.post(url, {
      json: true,
      body: {
        method,
        arguments: args,
      },
      headers,
    });
  }
}
