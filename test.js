class SoundCloudExtension {
    constructor() {
        this.clientId = 'YOUR_SOUNDCLOUD_CLIENT_ID'; // Ide a SoundCloud client ID
        this.tracks = []; // Itt tároljuk a keresési eredményeket (JSON)
        this.audio = null; // Aktuális lejátszó
        this.currentTrackIndex = -1; // Aktuális track index
    }

    getInfo() {
        return {
            id: 'soundcloudExt',
            name: 'SoundCloud Player',
            color1: '#FF5500',
            menuIconURI: '',
            blockIconURI: '',
            docsURI: '',
            blocks: [
                {
                    opcode: 'searchTracks',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'search tracks for [KEYWORD]',
                    arguments: {
                        KEYWORD: { type: Scratch.ArgumentType.STRING, defaultValue: 'test' }
                    },
                    func: 'searchTracks'
                },
                {
                    opcode: 'getTrackData',
                    blockType: Scratch.BlockType.REPORTER,
                    text: 'track [INDEX] [PROPERTY]',
                    arguments: {
                        INDEX: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
                        PROPERTY: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: 'title'
                        }
                    },
                    func: 'getTrackData'
                },
                {
                    opcode: 'playTrack',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'play track [INDEX] from [TIME]',
                    arguments: {
                        INDEX: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
                        TIME: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 }
                    },
                    func: 'playTrack'
                },
                {
                    opcode: 'pauseTrack',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'pause track',
                    func: 'pauseTrack'
                },
                {
                    opcode: 'resumeTrack',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'resume track',
                    func: 'resumeTrack'
                },
                {
                    opcode: 'unloadTrack',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'unload track',
                    func: 'unloadTrack'
                },
                {
                    opcode: 'trackDuration',
                    blockType: Scratch.BlockType.REPORTER,
                    text: 'track duration (s)',
                    func: 'trackDuration'
                },
                {
                    opcode: 'trackPosition',
                    blockType: Scratch.BlockType.REPORTER,
                    text: 'track position (s)',
                    func: 'trackPosition'
                },
                {
                    opcode: 'loadCover',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'load cover for track [INDEX] as [NAME]',
                    arguments: {
                        INDEX: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
                        NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'cover' }
                    },
                    func: 'loadCover'
                }
            ],
            menus: {},
            translation_map: {},
            targetTypes: ['sprite', 'stage']
        };
    }

    // ---------------- Blokkok működése ----------------

    async searchTracks(args) {
        const keyword = encodeURIComponent(args.KEYWORD);
        const url = `https://api.soundcloud.com/tracks?client_id=${this.clientId}&q=${keyword}&limit=10`;
        try {
            const res = await fetch(url);
            const data = await res.json();
            this.tracks = data;
            console.log('Tracks loaded:', this.tracks);
        } catch (e) {
            console.error('SoundCloud search error:', e);
        }
    }

    getTrackData(args) {
        const index = args.INDEX - 1;
        const property = args.PROPERTY;
        if (this.tracks[index] && property in this.tracks[index]) {
            return this.tracks[index][property];
        }
        return '';
    }

    playTrack(args) {
        const index = args.INDEX - 1;
        const time = args.TIME || 0;

        if (!this.tracks[index]) return;

        const streamUrl = `${this.tracks[index].stream_url}?client_id=${this.clientId}`;

        if (this.audio) {
            this.audio.pause();
        }

        this.audio = new Audio(streamUrl);
        this.audio.currentTime = time;
        this.audio.play();
        this.currentTrackIndex = index;
    }

    pauseTrack() {
        if (this.audio) this.audio.pause();
    }

    resumeTrack() {
        if (this.audio) this.audio.play();
    }

    unloadTrack() {
        if (this.audio) {
            this.audio.pause();
            this.audio = null;
            this.currentTrackIndex = -1;
        }
        this.tracks = [];
    }

    trackDuration() {
        if (this.audio) return parseFloat(this.audio.duration.toFixed(2));
        return 0;
    }

    trackPosition() {
        if (this.audio) return parseFloat(this.audio.currentTime.toFixed(2));
        return 0;
    }

    async loadCover(args) {
        const index = args.INDEX - 1;
        const name = args.NAME;

        if (!this.tracks[index]) return;

        const coverUrl = this.tracks[index].artwork_url || this.tracks[index].user.avatar_url;

        try {
            const res = await fetch(coverUrl);
            const blob = await res.blob();
            const reader = new FileReader();
            reader.onload = () => {
                // Hozzáadjuk a sprite costuméhez a Gandi API-n keresztül
                Scratch.vm.runtime._addCostumeToTarget({
                    name: name,
                    dataFormat: 'png',
                    md5: reader.result.split(',')[1],
                    bitmapResolution: 1
                }, Scratch.vm.runtime.getTargetForStage());
            };
            reader.readAsDataURL(blob);
        } catch (e) {
            console.error('Cover load error:', e);
        }
    }
}

// ---------------- Register extension ----------------
Scratch.extensions.register(new SoundCloudExtension());
