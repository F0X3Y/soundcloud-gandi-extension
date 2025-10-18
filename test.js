class SoundCloudExtension {
  constructor() {
    this.clientId = "MHDG7vIKasWstY0FaB07rK5WUoUjjCDC"; // ✅ Beégetett Client ID
    this.tracks = [];
    this.audio = null;
  }

  getInfo() {
    return {
      id: 'soundcloudExtension',
      name: 'SoundCloud',
      color1: '#ff5500',
      docsURI: 'https://soundcloud.com',
      blocks: [
        {
          opcode: 'searchMusic',
          blockType: Scratch.BlockType.COMMAND,
          text: 'search for [QUERY]',
          arguments: {
            QUERY: { type: Scratch.ArgumentType.STRING, defaultValue: 'daft punk' },
          },
        },
        {
          opcode: 'playMusic',
          blockType: Scratch.BlockType.COMMAND,
          text: 'play [INDEX] from [TIME] sec',
          arguments: {
            INDEX: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
            TIME: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
          },
        },
        {
          opcode: 'pauseMusic',
          blockType: Scratch.BlockType.COMMAND,
          text: 'pause music',
        },
        {
          opcode: 'resumeMusic',
          blockType: Scratch.BlockType.COMMAND,
          text: 'resume music',
        },
        {
          opcode: 'unloadMusic',
          blockType: Scratch.BlockType.COMMAND,
          text: 'unload searched music',
        },
        {
          opcode: 'getDuration',
          blockType: Scratch.BlockType.REPORTER,
          text: 'music duration (s)',
        },
        {
          opcode: 'getPosition',
          blockType: Scratch.BlockType.REPORTER,
          text: 'music position (s)',
        },
      ],
    };
  }

  async searchMusic(args) {
    const query = encodeURIComponent(args.QUERY);
    const url = `https://api-v2.soundcloud.com/search/tracks?q=${query}&client_id=${this.clientId}&limit=5`;

    const res = await fetch(url);
    const data = await res.json();
    this.tracks = data.collection;

    if (!this.tracks.length) {
      alert("No tracks found!");
      return;
    }

    console.log("Tracks found:", this.tracks.map(t => t.title));
    alert(`Found ${this.tracks.length} tracks for "${args.QUERY}".`);
  }

  async playMusic(args) {
    const index
