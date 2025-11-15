class MusicExtension {
  constructor(runtime) {
    this.runtime = runtime;
    this.clientId = "OwVhF7OBKF7qqXotasf91epNAnsn23pe";  
    this.proxyBase = 'https://gandiideext.ambrust-zoltan01.workers.dev';  // ide a proxy-d

    this.audioElement = null;
    Scratch.translate.setup({
      // ... (a többi marad ugyanaz)
    });
  }

  getInfo() {
    return {
      id: 'sipc.ink.CloudMusic',
      name: 'CloudMusic (SoundCloud)',
      color1: "#4d4df",
      blocks: [
        //... blokkok ugyanazok
      ]
    };
  }

  // ===== SearchMusic proxyval =====
  async SearchMusic(args) {
    const q = encodeURIComponent(args.name || '');
    const url = `${this.proxyBase}/search?q=${q}&limit=20`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Proxy search failed, status ${res.status}`);
      const data = await res.json();
      const songs = data.collection || data;  // az SC válaszában
      const songInfo = songs.map(s => ({
        id: s.id,
        name: s.title || s.name,
        artists: (s.user && s.user.username) || ''
      }));
      return JSON.stringify(songInfo);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  // ===== Getmusic proxyval =====
  async Getmusic(args) {
    try {
      const idOrUrl = (args.id || '').toString();
      if (!idOrUrl) throw new Error('Missing id');

      let trackObj;
      if (idOrUrl.startsWith('http')) {
        const r = await fetch(`${this.proxyBase}/resolve?url=${encodeURIComponent(idOrUrl)}`);
        if (!r.ok) throw new Error(`Resolve proxy failed: ${r.status}`);
        trackObj = await r.json();
      } else {
        const r = await fetch(`${this.proxyBase}/track?id=${encodeURIComponent(idOrUrl)}`);
        if (!r.ok) throw new Error(`Track fetch proxy failed: ${r.status}`);
        trackObj = await r.json();
      }

      const transcodings = (trackObj.media && trackObj.media.transcodings) || [];
      let chosen = null;
      for (let t of transcodings) {
        if (t.format && t.format.protocol && t.format.protocol.includes('progressive')) {
          chosen = t;
          break;
        }
      }
      if (!chosen && transcodings.length > 0) chosen = transcodings[0];

      if (chosen && chosen.url) {
        const r2 = await fetch(`${this.proxyBase}/transcode?url=${encodeURIComponent(chosen.url)}`);
        if (!r2.ok) throw new Error(`Transcode proxy failed: ${r2.status}`);
        const obj = await r2.json();
        if (obj && obj.url) return obj.url.replace(/^http:/, 'https:');
      }

      // fallbackok
      if (trackObj.preview_mp3_128_url) return trackObj.preview_mp3_128_url.replace(/^http:/, 'https:');
      if (trackObj.stream_url) return `${trackObj.stream_url}?client_id=${this.clientId}`;

      throw new Error('No playable URL found');
    } catch (e) {
      return Promise.reject(e);
    }
  }

  // ===== getCover proxyval =====
  async getCover(args) {
    try {
      const idOrUrl = (args.id || '').toString();
      let obj;
      if (idOrUrl.startsWith('http')) {
        const r = await fetch(`${this.proxyBase}/resolve?url=${encodeURIComponent(idOrUrl)}`);
        if (!r.ok) throw new Error(`Resolve proxy failed: ${r.status}`);
        obj = await r.json();
      } else {
        const r = await fetch(`${this.proxyBase}/track?id=${encodeURIComponent(idOrUrl)}`);
        if (!r.ok) throw new Error(`Track fetch proxy failed: ${r.status}`);
        obj = await r.json();
      }
      return obj.artwork_url || (obj.publisher_metadata && obj.publisher_metadata.artwork_url) || '';
    } catch (e) {
      return Promise.reject(e);
    }
  }

  // ===== A vezérlő- és lejátszó függvények maradnak ugyanazok: pause, resume, stop, jump, volume =====

  pauseMusic() {
    if (this.audioElement) this.audioElement.pause();
  }
  resumeMusic() {
    if (this.audioElement) this.audioElement.play().catch(()=>{});
  }
  stopMusic() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
      this.audioElement.load();
    }
    this.audioElement = null;
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

  Ismusicplaying() {
    if (!this.audioElement) return false;
    if (!this.audioElement.paused && !this.audioElement.ended) return true;
    if (this.audioElement.paused) return "pause";
    return false;
  }
  Getplaytime() { return this.audioElement ? this.audioElement.currentTime : 0; }
  Getthetotaldurationofmusic() { return this.audioElement ? this.audioElement.duration || 0 : 0; }

  // ===== A lyrics részeket üresen hagytam, mert SoundCloud nem ad LRC-t nyilvánosan =====
  async Getlyrics(args) {
    return '';
  }
  async Gettranslatedlyrics(args) {
    return '';
  }

  Getcurrenttimelyrics(args) {
    return '';
  }
  Getthelineoflyricsatthecurrenttime(args) {
    return 0;
  }
  Getthelyricstimeofthefirstfewlines(args) {
    return 0;
  }
}
Scratch.extensions.register(new MusicExtension());
