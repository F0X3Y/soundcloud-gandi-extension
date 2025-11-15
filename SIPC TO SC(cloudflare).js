// soundcloud-extension.js
class MusicExtension {
  constructor(runtime) {
    this.runtime = runtime;
    this.clientId = (typeof window !== 'undefined' && window.SOUNDCLOUD_CLIENT_ID) ? window.SOUNDCLOUD_CLIENT_ID : 'OwVhF7OBKF7qqXotasf91epNAnsn23pe';
    this.audioElement = null;
  }

  getInfo() {
    return {
      id: 'sipc.ink.CloudMusic',
      name: 'CloudMusic (SoundCloud)',
      color1: "#4d4d4f",
      blocks: [
        { opcode: 'SearchMusic', blockType: Scratch.BlockType.REPORTER, text: "Search Music [name]", arguments: { name: { type: Scratch.ArgumentType.STRING, defaultValue: "Let's live" } } },
        { opcode: 'Getmusic', blockType: Scratch.BlockType.REPORTER, text: "Get music url [id]", arguments: { id: { type: Scratch.ArgumentType.STRING, defaultValue: 'https://soundcloud.com/artist/track' } } },
        { opcode: 'playMusic', blockType: Scratch.BlockType.COMMAND, text: "Play music from [url]", arguments: { url: { type: Scratch.ArgumentType.STRING, defaultValue: 'https://example.com/music.mp3' } } },
        { opcode: 'pauseMusic', blockType: Scratch.BlockType.COMMAND, text: "Pause Music" },
        { opcode: 'resumeMusic', blockType: Scratch.BlockType.COMMAND, text: "Play Music" },
        { opcode: 'stopMusic', blockType: Scratch.BlockType.COMMAND, text: "Stop Music" }
      ]
    };
  }

  _getClientId() {
    return this.clientId;
  }

  async SearchMusic(args) {
    const q = encodeURIComponent(args.name || '');
    const clientId = this._getClientId();
    const url = `https://gandiideext.ambrust-zoltan01.workers.dev/search?q=${q}&client_id=${clientId}`;
    const res = await fetch(url);
    const data = await res.json();
    return JSON.stringify(data.collection || []);
  }

  async Getmusic(args) {
    const idOrUrl = args.id || '';
    const clientId = this._getClientId();
    const url = `https://gandiideext.ambrust-zoltan01.workers.dev/resolve?url=${encodeURIComponent(idOrUrl)}&client_id=${clientId}`;
    const res = await fetch(url);
    const track = await res.json();
    return track.stream_url ? `${track.stream_url}?client_id=${clientId}` : '';
  }

  playMusic(args) {
    if (!this.audioElement) this.audioElement = new Audio();
    this.audioElement.src = args.url;
    this.audioElement.play();
  }

  pauseMusic() { if (this.audioElement) this.audioElement.pause(); }
  resumeMusic() { if (this.audioElement) this.audioElement.play(); }
  stopMusic() { if (this.audioElement) { this.audioElement.pause(); this.audioElement.src = ''; this.audioElement = null; } }
}

Scratch.extensions.register(new MusicExtension());
