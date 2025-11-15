/*
  CloudMusic -> SoundCloud rewrite
  - Keeps original Scratch block surface (opcodes) but uses SoundCloud API (v2 where possible)
  - Put your SoundCloud client id in SOUNDCLOUD_CLIENT_ID or pass it via window.SOUNDCLOUD_CLIENT_ID
  - Notes: SoundCloud streaming often requires a valid client_id (or OAuth token). Some endpoints / behaviors can change.
*/

class MusicExtension {
  constructor(runtime) {
    this.runtime = runtime;
    // Provide your client id here or set window.SOUNDCLOUD_CLIENT_ID before loading the extension
    this.clientId = (typeof window !== 'undefined' && window.SOUNDCLOUD_CLIENT_ID) ? window.SOUNDCLOUD_CLIENT_ID : 'OwVhF7OBKF7qqXotasf91epNAnsn23pe';
    this.audioElement = null;

    Scratch.translate.setup({
      zh: {
        CloudMusic_SearchMusic: '搜索音乐 [name]',
        CloudMusic_Getmusic: '获取音乐url [id]',
        CloudMusic_Getlyrics: '获取 [id] 的歌词',
        CloudMusic_Gettranslatedlyrics: '获取 [id] 的翻译歌词',
        CloudMusic_getcover: '获取 [id] 的封面',
        CloudMusic_playmusic: '从 [url] 播放音乐',
        CloudMusic_Getradiotracks: '获取电台节目 [id]',
        CloudMusic_WebIDtomusicID: '电台音乐ID转音乐ID [id]',
        CloudMusic_resumemusic: '播放音乐',
        CloudMusic_pausemusic: '暂停音乐',
        CloudMusic_stopmusic: '停止音乐',
        CloudMusic_jumptotime: '跳转到时间 [time] 秒',
        CloudMusic_adjustthevolume: '将音量调到 [volume]',
        CloudMusic_Ismusicplaying: '是否正在播放音乐?',
        CloudMusic_Getplaytime: '音乐播放时间（秒）',
        CloudMusic_Getthetotaldurationofmusic: '音乐总时长（秒）',
        CloudMusic_Getcurrenttimelyrics: '[lyricsText] 在 [currentTime] 时显示',
        CloudMusic_Getthelineoflyricsatthecurrenttime: '[lyricsText] 在 [currentTime] 时是第几行',
        CloudMusic_Getthelyricstimeofthefirstfewlines: '[lyricsText] 在 [currentTime] 行时是第几秒',
        CloudMusic_lyrics: '歌词',
        CloudMusic_time: '时间'
      }
    })
  }

  getInfo() {
    return {
      id: 'sipc.ink.CloudMusic',
      name: 'CloudMusic (SoundCloud)',
      color1: "#4d4d4f",
      blocks: [
        { opcode: 'SearchMusic', blockType: Scratch.BlockType.REPORTER, text: Scratch.translate({ id: "CloudMusic_SearchMusic", default: "Search Music [name]" }), arguments: { name: { type: Scratch.ArgumentType.STRING, defaultValue: "Let's live" } } },
        { opcode: 'Getmusic', blockType: Scratch.BlockType.REPORTER, text: Scratch.translate({ id: "CloudMusic_Getmusic", default: "Get music url [id]" }), arguments: { id: { type: Scratch.ArgumentType.STRING, defaultValue: 'https://soundcloud.com/artist/track' } } },
        { opcode: 'Getlyrics', blockType: Scratch.BlockType.REPORTER, text: Scratch.translate({ id: "CloudMusic_Getlyrics", default: "Get the lyrics of [id]" }), arguments: { id: { type: Scratch.ArgumentType.STRING, defaultValue: 'https://soundcloud.com/artist/track' } } },
        { opcode: 'Gettranslatedlyrics', blockType: Scratch.BlockType.REPORTER, text: Scratch.translate({ id: "CloudMusic_Gettranslatedlyrics", default: "Get [id]'s translated lyrics" }), arguments: { id: { type: Scratch.ArgumentType.STRING, defaultValue: 'https://soundcloud.com/artist/track' } } },
        { opcode: 'getCover', blockType: Scratch.BlockType.REPORTER, text: Scratch.translate({ id: "CloudMusic_getcover", default: "Get the cover of [id]" }), arguments: { id: { type: Scratch.ArgumentType.STRING, defaultValue: 'https://soundcloud.com/artist/track' } } },
        { opcode: 'playMusic', blockType: Scratch.BlockType.COMMAND, text: Scratch.translate({ id: "CloudMusic_playmusic", default: "Play music from [url]" }), arguments: { url: { type: Scratch.ArgumentType.STRING, defaultValue: 'https://example.com/music.mp3' } } },
        { opcode: 'Getradiotracks', blockType: Scratch.BlockType.REPORTER, text: Scratch.translate({ id: "CloudMusic_Getradiotracks", default: "Get radio program [id]" }), arguments: { id: { type: Scratch.ArgumentType.STRING, defaultValue: 'playlist_id_or_user_url' } } },
        { opcode: 'WebIDtomusicID', blockType: Scratch.BlockType.REPORTER, text: Scratch.translate({ id: "CloudMusic_WebIDtomusicID", default: "Radio Music ID to Music ID [id]" }), arguments: { id: { type: Scratch.ArgumentType.STRING, defaultValue: 'https://soundcloud.com/artist/track' } } },
        { opcode: 'resumeMusic', blockType: Scratch.BlockType.COMMAND, text: Scratch.translate({ id: "CloudMusic_resumemusic", default: "Play Music" }) },
        { opcode: 'pauseMusic', blockType: Scratch.BlockType.COMMAND, text: Scratch.translate({ id: "CloudMusic_pausemusic", default: "Pause Music" }) },
        { opcode: 'stopMusic', blockType: Scratch.BlockType.COMMAND, text: Scratch.translate({ id: "CloudMusic_stopmusic", default: "Stop Music" }) },
        { opcode: 'jumpTotime', blockType: Scratch.BlockType.COMMAND, text: Scratch.translate({ id: "CloudMusic_jumptotime", default: "Skip to time [time] seconds" }), arguments: { time: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 } } },
        { opcode: 'adjustthevolume', blockType: Scratch.BlockType.COMMAND, text: Scratch.translate({ id: "CloudMusic_adjustthevolume", default: "Adjust the volume to [volume]" }), arguments: { volume: { type: Scratch.ArgumentType.NUMBER, defaultValue: 100 } } },
        { opcode: 'Ismusicplaying', blockType: Scratch.BlockType.BOOLEAN, text: Scratch.translate({ id: "CloudMusic_Ismusicplaying", default: "Is music playing?" }) },
        { opcode: 'Getplaytime', blockType: Scratch.BlockType.REPORTER, text: Scratch.translate({ id: "CloudMusic_Getplaytime", default: "Music play time (sec)" }) },
        { opcode: 'Getthetotaldurationofmusic', blockType: Scratch.BlockType.REPORTER, text: Scratch.translate({ id: "CloudMusic_Getthetotaldurationofmusic", default: "Current time lyrics (sec)" }) },
        { opcode: 'Getcurrenttimelyrics', blockType: Scratch.BlockType.REPORTER, text: Scratch.translate({ id: "CloudMusic_Getcurrenttimelyrics", default: "[lyricsText] is shown at [currentTime]" }), arguments: { lyricsText: { type: Scratch.ArgumentType.STRING, defaultValue: Scratch.translate({ id: "CloudMusic_lyrics", default: "lyricsText" }) }, currentTime: { type: Scratch.ArgumentType.NUMBER, defaultValue: Scratch.translate({ id: "CloudMusic_time", default: "currentTime" }) } } },
        { opcode: 'Getthelineoflyricsatthecurrenttime', blockType: Scratch.BlockType.REPORTER, text: Scratch.translate({ id: "CloudMusic_Getthelineoflyricsatthecurrenttime", default: "[lyricsText] is in line at [currentTime]" }), arguments: { lyricsText: { type: Scratch.ArgumentType.STRING, defaultValue: Scratch.translate({ id: "CloudMusic_lyrics", default: "lyricsText" }) }, currentTime: { type: Scratch.ArgumentType.NUMBER, defaultValue: Scratch.translate({ id: "CloudMusic_time", default: "currentTime" }) } } },
        { opcode: 'Getthelyricstimeofthefirstfewlines', blockType: Scratch.BlockType.REPORTER, text: Scratch.translate({ id: "CloudMusic_Getthelyricstimeofthefirstfewlines", default: "[lyricsText] in [currentTime] line is the first second" }), arguments: { lyricsText: { type: Scratch.ArgumentType.STRING, defaultValue: Scratch.translate({ id: "CloudMusic_lyrics", default: "lyricsText" }) }, currentTime: { type: Scratch.ArgumentType.NUMBER, defaultValue: Scratch.translate({ id: "CloudMusic_time", default: "currentTime" }) } } },
      ],
    };
  }

  // Helper: use clientId or reject if missing
  _getClientId() {
    if (this.clientId && this.clientId !== '<YOUR_CLIENT_ID_HERE>') return this.clientId;
    // If not set, try global
    if (typeof window !== 'undefined' && window.SOUNDCLOUD_CLIENT_ID) return window.SOUNDCLOUD_CLIENT_ID;
    return null;
  }

  // Helper: parse SoundCloud track representation to a simple object
  _mapTrack(t) {
    return {
      id: t.id || t.urn || t.uid || null,
      title: t.title || t.name || '',
      artist: (t.user && t.user.username) || (t.publisher && t.publisher.name) || '',
      artwork: t.artwork_url || (t.publisher_metadata && t.publisher_metadata.artwork_url) || '',
      permalink_url: t.permalink_url || t.permalink || ''
    };
  }

  // 1) Search tracks on SoundCloud
  async SearchMusic(args) {
    const q = encodeURIComponent(args.name || '');
    const clientId = this._getClientId();
    if (!clientId) return JSON.stringify([]);
    // api-v2 search endpoint
    const url = `https://api-v2.soundcloud.com/search/tracks?q=${q}&client_id=${clientId}&limit=20`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      const coll = data.collection || data || [];
      const mapped = coll.map(t => this._mapTrack(t));
      return JSON.stringify(mapped);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  // 2) Get playable music URL for a track (accepts either numeric id or permalink URL)
  async Getmusic(args) {
    const clientId = this._getClientId();
    if (!clientId) return Promise.reject(new Error('Missing SoundCloud client id'));
    let idOrUrl = (args.id || '').toString();

    // If looks like a full url, use resolve endpoint
    try {
      let trackApiUrl = '';
      if (idOrUrl.startsWith('http')) {
        const resolveUrl = `https://api.soundcloud.com/resolve?url=${encodeURIComponent(idOrUrl)}&client_id=${clientId}`;
        const r = await fetch(resolveUrl, { redirect: 'follow' });
        if (!r.ok) throw new Error('Resolve failed');
        const resolved = await r.json();
        // resolved should be a track object or contain urn/id
        trackApiUrl = `https://api-v2.soundcloud.com/tracks/${resolved.id || resolved.urn}?client_id=${clientId}`;
      } else {
        // treat as id or urn
        trackApiUrl = `https://api-v2.soundcloud.com/tracks/${encodeURIComponent(idOrUrl)}?client_id=${clientId}`;
      }

      const trackRes = await fetch(trackApiUrl);
      if (!trackRes.ok) throw new Error('Track fetch failed');
      const track = await trackRes.json();

      // Try media.transcodings -> find progressive mp3 transcoding
      const transcodings = (track.media && track.media.transcodings) || (track.media && track.media.transcodings) || [];
      let progressive = null;
      for (let t of transcodings) {
        if (t.format && t.format.protocol && t.format.protocol.includes('progressive')) { progressive = t; break; }
      }
      // fallback: pick first transcoding
      const chosen = progressive || transcodings[0] || null;
      if (chosen && chosen.url) {
        const fetchUrl = `${chosen.url}?client_id=${clientId}`; // call to transcoding url returns {"url":"https://...mp3"}
        const r = await fetch(fetchUrl);
        if (!r.ok) throw new Error('Transcoding fetch failed');
        const obj = await r.json();
        if (obj && obj.url) return obj.url.replace(/^http:/, 'https:');
      }

      // Older endpoints: maybe preview_mp3_128_url or http_mp3_128_url
      if (track.preview_mp3_128_url) return track.preview_mp3_128_url.replace(/^http:/, 'https:');
      if (track.stream_url) return `${track.stream_url}?client_id=${clientId}`;

      throw new Error('No playable URL available for this track');
    } catch (e) {
      return Promise.reject(e);
    }
  }

  // 3) Get artwork/cover
  async getCover(args) {
    const clientId = this._getClientId();
    if (!clientId) return Promise.resolve('');
    const idOrUrl = (args.id || '').toString();
    try {
      let trackObj = null;
      if (idOrUrl.startsWith('http')) {
        const resolveUrl = `https://api.soundcloud.com/resolve?url=${encodeURIComponent(idOrUrl)}&client_id=${clientId}`;
        const r = await fetch(resolveUrl);
        if (!r.ok) throw new Error('Resolve failed');
        trackObj = await r.json();
      } else {
        const tRes = await fetch(`https://api-v2.soundcloud.com/tracks/${encodeURIComponent(idOrUrl)}?client_id=${clientId}`);
        trackObj = await tRes.json();
      }
      const art = trackObj.artwork_url || (trackObj.publisher_metadata && trackObj.publisher_metadata.artwork_url) || '';
      return art;
    } catch (e) {
      return Promise.reject(e);
    }
  }

  // Lyrics: SoundCloud does not expose lyrics via its public API. Keep placeholder behavior.
  async Getlyrics(args) {
    // Return empty string; suggest integrating a lyrics provider (Genius, Musixmatch) if needed
    return '';
  }
  async Gettranslatedlyrics(args) {
    return '';
  }

  // Radio / playlist fetching: try to fetch playlist tracks if given a playlist id or url
  async Getradiotracks(args) {
    const clientId = this._getClientId();
    if (!clientId) return Promise.reject(new Error('Missing client id'));
    const idOrUrl = (args.id || '').toString();
    try {
      let playlist = null;
      if (idOrUrl.startsWith('http')) {
        // resolve
        const res = await fetch(`https://api.soundcloud.com/resolve?url=${encodeURIComponent(idOrUrl)}&client_id=${clientId}`);
        playlist = await res.json();
      } else {
        const r = await fetch(`https://api-v2.soundcloud.com/playlists/${encodeURIComponent(idOrUrl)}?representation=full&client_id=${clientId}`);
        playlist = await r.json();
      }
      const tracks = (playlist.tracks || playlist) .map(t => ({ name: t.title || t.name, id: t.id || t.urn || t.track_id }));
      return JSON.stringify(tracks);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  // Resolve generic SoundCloud URL to track id (WebID to music ID)
  async WebIDtomusicID(args) {
    const clientId = this._getClientId();
    if (!clientId) return Promise.reject(new Error('Missing client id'));
    const idOrUrl = (args.id || '').toString();
    try {
      if (!idOrUrl.startsWith('http')) return idOrUrl; // assume already id
      const res = await fetch(`https://api.soundcloud.com/resolve?url=${encodeURIComponent(idOrUrl)}&client_id=${clientId}`);
      if (!res.ok) throw new Error('Resolve failed');
      const obj = await res.json();
      return (obj.id || obj.urn || '') ;
    } catch (e) {
      return Promise.reject(e);
    }
  }

  // Controls
  pauseMusic() {
    if (this.audioElement) this.audioElement.pause();
  }
  resumeMusic() {
    if (this.audioElement) this.audioElement.play().catch(()=>{});
  }
  stopMusic() {
    if (this.audioElement) {
      try { this.audioElement.pause(); this.audioElement.src = ''; this.audioElement.load(); } catch(e){}
      this.audioElement = null;
    }
  }
  jumpTotime(args) {
    const time = Number(args.time) || 0;
    if (this.audioElement) this.audioElement.currentTime = time;
  }
  adjustthevolume(args) {
    if (!this.audioElement) return;
    const volumePercent = Number(args.volume) || 0;
    if (volumePercent < 0 || volumePercent > 100) return;
    this.audioElement.volume = volumePercent / 100;
  }

  // Info
  Ismusicplaying() {
    if (!this.audioElement) return false;
    if (!this.audioElement.paused && !this.audioElement.ended) return true;
    if (this.audioElement.paused) return "pause";
    return false;
  }
  Getplaytime() { return this.audioElement ? this.audioElement.currentTime : 0; }
  Getthetotaldurationofmusic() { return this.audioElement ? this.audioElement.duration || 0 : 0; }

  // Lyrics helpers: keep original LRC parsing functions - they operate on provided lyrics text
  Getcurrenttimelyrics(args) {
    const lines = (args.lyricsText || '').trim().split('\n');
    const lyrics = [];
    for (let line of lines) {
      const matches = line.match(/\[(\d+):(\d+\.\d+)\](.*)/);
      if (matches) {
        const time = parseFloat(matches[1]) * 60 + parseFloat(matches[2]);
        const text = matches[3].trim();
        lyrics.push({ time, text });
      }
    }
    for (let i = lyrics.length - 1; i >= 0; i--) {
      const { time, text } = lyrics[i];
      if (time <= args.currentTime) return text;
    }
    return '';
  }
  Getthelineoflyricsatthecurrenttime(args) {
    const lines = (args.lyricsText || '').trim().split('\n');
    const currentTime = Number(args.currentTime) || 0;
    for (let i = lines.length - 1; i >= 0; i--) {
      const matches = lines[i].match(/\[(\d+):(\d+\.\d+)\](.*)/);
      if (matches) {
        const time = parseFloat(matches[1]) * 60 + parseFloat(matches[2]);
        if (time <= currentTime) return i + 1;
      }
    }
    return 0;
  }
  Getthelyricstimeofthefirstfewlines(args) {
    const lines = (args.lyricsText || '').trim().split('\n');
    const linenumber = Number(args.linenumber || 0);
    if (!lines || lines.length === 0) return 0;
    if (linenumber < 0 || linenumber >= lines.length) return 0;
    const line = lines[linenumber];
    if (!line) return 0;
    const matches = line.match(/\[(\d+):(\d+\.\d+)\](.*)/);
    if (!matches) return 0;
    const minutes = parseFloat(matches[1]);
    const seconds = parseFloat(matches[2]);
    if (isNaN(minutes) || isNaN(seconds)) return 0;
    return minutes * 60 + seconds;
  }
}

Scratch.extensions.register(new MusicExtension());

const tempExt = {
  Extension: MusicExtension,
  info: {
    name: 'CloudMusic',
    description: 'CloudMusic (SoundCloud) - get and play tracks from SoundCloud',
    extensionID: 'sipc.ink.CloudMusic',
    collaborator: 'sipc.ink@Gandi'
  },
  l10n: {
    'zh': { 'CloudMusic.Description':'从 SoundCloud 获取并播放音乐' },
    'en': { 'CloudMusic.Description':'Get and play music from SoundCloud (requires client id)' }
  },
};

// BY - SIPC - converted to SoundCloud
