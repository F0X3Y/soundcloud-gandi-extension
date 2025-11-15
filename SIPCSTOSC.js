// extension.js — Scratch extension
class MusicExtension {
  constructor(runtime) {
    this.runtime = runtime;
    this.audioElement = null;
    // ide a te worker URL-ed (például)
    this.workerUrl = 'https://gandiideext.ambrust-zoltan01.workers.dev';
  }

  getInfo() {
    return {
      id: 'sipc.ink.SoundCloudWorker',
      name: 'SoundCloud (Worker)',
      color1: '#4d4d4f',
      blocks: [
        { opcode: 'SearchMusic', blockType: Scratch.BlockType.REPORTER, text: 'Search Music [name]', arguments: { name: { type: Scratch.ArgumentType.STRING, defaultValue: "Let's live" } } },
        { opcode: 'Getmusic', blockType: Scratch.BlockType.REPORTER, text: 'Get music url [idOrUrl]', arguments: { idOrUrl: { type: Scratch.ArgumentType.STRING, defaultValue: 'https://soundcloud.com/artist/track' } } },
        { opcode: 'PlayMusic', blockType: Scratch.BlockType.COMMAND, text: 'Play music from [url]', arguments: { url: { type: Scratch.ArgumentType.STRING, defaultValue: '' } } },
        { opcode: 'PauseMusic', blockType: Scratch.BlockType.COMMAND, text: 'Pause Music' },
        { opcode: 'ResumeMusic', blockType: Scratch.BlockType.COMMAND, text: 'Resume Music' },
        { opcode: 'StopMusic', blockType: Scratch.BlockType.COMMAND, text: 'Stop Music' },
        { opcode: 'IsMusicPlaying', blockType: Scratch.BlockType.BOOLEAN, text: 'Is music playing?' },
        { opcode: 'GetPlayTime', blockType: Scratch.BlockType.REPORTER, text: 'Music play time (sec)' },
        { opcode: 'GetTotalDuration', blockType: Scratch.BlockType.REPORTER, text: 'Music total duration (sec)' }
      ]
    };
  }

  // ----- SearchMusic: hívja a worker /search és json.collection-t használja -----
  async SearchMusic(args) {
    const q = encodeURIComponent((args.name || '').trim());
    if (!q) return JSON.stringify([]);
    const url = `${this.workerUrl}/search?q=${q}`;
    try {
      const res = await fetch(url, { method: 'GET', mode: 'cors' });
      if (!res.ok) {
        const t = await res.text().catch(()=>'');
        throw new Error('Worker search failed: ' + res.status + ' ' + t);
      }
      const data = await res.json();
      // data can be { collection: [...] } or an array; normalize
      const coll = Array.isArray(data) ? data : (data.collection || data.results || []);
      const mapped = coll.map(track => ({
        id: track.id || track.track_id || '',
        title: track.title || track.name || '',
        url: track.permalink_url || track.permalink || ''
      }));
      return JSON.stringify(mapped);
    } catch (e) {
      // vissza üres tömb stringként vagy hibát is lehet jelezni
      return JSON.stringify([]);
    }
  }

  // ----- Getmusic: elfogad id vagy url, lekéri a track objektumot, majd playable url-t ad -----
  async Getmusic(args) {
    const idOrUrl = (args.idOrUrl || '').toString().trim();
    if (!idOrUrl) return '';
    try {
      let trackObj = null;
      if (/^https?:\/\//i.test(idOrUrl)) {
        // resolve permalink -> track object
        const r = await fetch(`${this.workerUrl}/resolve?url=${encodeURIComponent(idOrUrl)}`, { method: 'GET', mode: 'cors' });
        if (!r.ok) throw new Error('Resolve failed: ' + r.status);
        trackObj = await r.json();
      } else {
        const r = await fetch(`${this.workerUrl}/track?id=${encodeURIComponent(idOrUrl)}`, { method: 'GET', mode: 'cors' });
        if (!r.ok) throw new Error('Track fetch failed: ' + r.status);
        trackObj = await r.json();
      }

      // Try transcodings -> progressive
      const transcodings = (trackObj.media && trackObj.media.transcodings) || [];
      let progressive = null;
      for (let t of transcodings) {
        if (t.format && t.format.protocol && t.format.protocol.includes('progressive')) { progressive = t; break; }
      }
      if (!progressive && transcodings.length) progressive = transcodings[0];

      if (progressive && progressive.url) {
        // ask worker to transcode (worker will attach token)
        const tr = await fetch(`${this.workerUrl}/transcode?url=${encodeURIComponent(progressive.url)}`, { method: 'GET', mode: 'cors' });
        if (!tr.ok) throw new Error('Transcode failed: ' + tr.status);
        const obj = await tr.json();
        if (obj && obj.url) return obj.url.replace(/^http:/, 'https:');
      }

      // fallback to preview_mp3_128_url or stream_url
      if (trackObj.preview_mp3_128_url) return trackObj.preview_mp3_128_url.replace(/^http:/, 'https:');
      if (trackObj.stream_url) return trackObj.stream_url.indexOf('http') === 0 ? trackObj.stream_url : (trackObj.stream_url + `?client_id=${encodeURIComponent(CLIENT_ID_FOR_FALLBACK || '')}`);

      return '';
    } catch (e) {
      return '';
    }
  }

  // ------- Simple player controls -------
  PlayMusic(args) {
    const url = args.url || '';
    if (!url) return;
    if (!this.audioElement) this.audioElement = new Audio();
    try {
      this.audioElement.src = url;
      this.audioElement.play().catch(()=>{});
    } catch (e){}
  }

  PauseMusic() { if (this.audioElement) this.audioElement.pause(); }
  ResumeMusic() { if (this.audioElement) this.audioElement.play().catch(()=>{}); }
  StopMusic() {
    if (this.audioElement) {
      try { this.audioElement.pause(); this.audioElement.src=''; this.audioElement.load(); } catch(e){}
      this.audioElement = null;
    }
  }

  IsMusicPlaying() {
    if (!this.audioElement) return false;
    if (!this.audioElement.paused && !this.audioElement.ended) return true;
    if (this.audioElement.paused) return 'pause';
    return false;
  }
  GetPlayTime() { return this.audioElement ? this.audioElement.currentTime || 0 : 0; }
  GetTotalDuration() { return this.audioElement ? this.audioElement.duration || 0 : 0; }
}

Scratch.extensions.register(new MusicExtension());
