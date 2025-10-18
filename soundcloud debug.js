class SoundCloudExtension {
    constructor() {
        // Kezdeti érték: üres. A block-tal beállíthatod debugra.
        this.clientId = '';
        this.tracks = []; // keresési eredmények itt tárolva
        this.audio = null; // Audio objektum
        this.currentTrackIndex = -1;
    }

    getInfo() {
        return {
            id: 'soundcloudExt',
            name: 'SoundCloud Player (debug)',
            color1: '#FF5500',
            menuIconURI: '',
            blockIconURI: '',
            docsURI: '',
            blocks: [
                {
                    opcode: 'setClientId',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'set SoundCloud client id to [CLIENT_ID]',
                    arguments: {
                        CLIENT_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '' }
                    },
                    func: 'setClientId'
                },
                {
                    opcode: 'clearClientId',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'clear SoundCloud client id',
                    func: 'clearClientId'
                },
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

    /** ---------- Client ID kezelése (debug block) ---------- */
    setClientId(args) {
        const id = String(args.CLIENT_ID || '').trim();
        if (!id) {
            console.warn('SoundCloud client id set called with empty string.');
            return;
        }
        this.clientId = id;
        console.log('SoundCloud client id set (debug).');
    }

    clearClientId() {
        this.clientId = '';
        console.log('SoundCloud client id cleared.');
    }

    /** ---------- Keresés ---------- */
    async searchTracks(args) {
        const keywordRaw = String(args.KEYWORD || '').trim();
        if (!keywordRaw) {
            console.warn('searchTracks called with empty keyword.');
            return;
        }
        if (!this.clientId) {
            console.error('No SoundCloud client id set. Use the set client id block for debugging.');
            return;
        }

        const keyword = encodeURIComponent(keywordRaw);
        const url = `https://api.soundcloud.com/tracks?client_id=${encodeURIComponent(this.clientId)}&q=${keyword}&limit=20`;

        try {
            const res = await fetch(url);
            if (!res.ok) {
                console.error('SoundCloud search failed, status:', res.status, res.statusText);
                return;
            }
            const data = await res.json();
            // Normalizáljuk: biztos, hogy tömb
            this.tracks = Array.isArray(data) ? data : [];
            console.log('Tracks loaded:', this.tracks.length);
        } catch (e) {
            console.error('SoundCloud search error:', e);
        }
    }

    /** ---------- Adatok kiolvasása (reporter) ---------- */
    getTrackData(args) {
        const idx = Math.max(0, Number(args.INDEX || 1) - 1);
        const prop = String(args.PROPERTY || '').trim();

        if (!this.tracks[idx]) return '';
        const track = this.tracks[idx];

        // Ha kéri a duration-ot, SoundCloud-ban millisec-ben van -> másodperc kell
        if (prop === 'duration' && typeof track.duration === 'number') {
            return (track.duration / 1000).toFixed(2);
        }

        // Alap property-k: title, id, artwork_url, permalink_url, user.username
        if (prop === 'title') return track.title || '';
        if (prop === 'id') return track.id !== undefined ? String(track.id) : '';
        if (prop === 'artwork_url') return track.artwork_url || (track.user && track.user.avatar_url) || '';
        if (prop === 'permalink_url') return track.permalink_url || '';
        if (prop === 'user') return (track.user && (track.user.username || track.user.permalink)) || '';

        // Ha nincs, próbáljuk közvetlenül
        return (track[prop] !== undefined) ? String(track[prop]) : '';
    }

    /** ---------- Lejátszás ---------- */
    async playTrack(args) {
        const idx = Math.max(0, Number(args.INDEX || 1) - 1);
        const time = Math.max(0, Number(args.TIME || 0));

        if (!this.tracks[idx]) {
            console.warn('playTrack: no track at index', idx);
            return;
        }
        if (!this.clientId) {
            console.error('playTrack: no SoundCloud client id set. Use the set client id block.');
            return;
        }

        // 1) Ha van már audio, stoppoljuk
        if (this.audio) {
            try { this.audio.pause(); } catch (e) {}
            this.audio = null;
        }

        // 2) Próbáljuk megszerezni a stream URL-t
        const track = this.tracks[idx];
        // SoundCloud: stream_url (régebbi API) vagy media.transcodings (újabb)
        let streamUrl = null;

        // Ha van stream_url mező
        if (track.stream_url) {
            streamUrl = track.stream_url + `?client_id=${encodeURIComponent(this.clientId)}`;
        } else if (track.media && Array.isArray(track.media.transcodings)) {
            // keressük a progressive (mp3) transcodingot elsőként
            const prog = track.media.transcodings.find(t => t.format && t.format.protocol === 'progressive');
            const trans = prog || track.media.transcodings[0];
            if (trans && trans.url) {
                try {
                    const tResp = await fetch(`${trans.url}?client_id=${encodeURIComponent(this.clientId)}`);
                    const tJson = await tResp.json();
                    // tJson.url a végső MP3 URL
                    if (tJson && tJson.url) streamUrl = tJson.url;
                } catch (e) {
                    console.error('Error fetching transcoding url:', e);
                }
            }
        }

        if (!streamUrl) {
            // Másik fallback: lekérdezzük a /tracks/:id/stream végpontot
            try {
                const fallback = `https://api.soundcloud.com/tracks/${encodeURIComponent(track.id)}/stream?client_id=${encodeURIComponent(this.clientId)}`;
                const test = await fetch(fallback, { method: 'HEAD' });
                if (test.ok) streamUrl = fallback;
            } catch (e) {
                // ignore
            }
        }

        if (!streamUrl) {
            console.error('Could not get stream URL for track', track.id);
            return;
        }

        // 3) Hozzuk létre az Audio objektumot és indítsuk el a kívánt időponttól
        try {
            this.audio = new Audio();
            this.audio.crossOrigin = 'anonymous';
            this.audio.src = streamUrl;
            // várjuk meg a metadata betöltődését, hogy duration elérhető legyen
            await new Promise((resolve, reject) => {
                const onLoaded = () => {
                    // ha the time requested > duration, akkor ne játsszuk
                    if (!isNaN(this.audio.duration) && time >= this.audio.duration) {
                        console.warn('Requested start time >= duration, not playing.');
                        this.audio.removeEventListener('loadedmetadata', onLoaded);
                        resolve(false);
                        return;
                    }
                    try {
                        this.audio.currentTime = time;
                    } catch (e) {
                        // Néhány böngésző tiltja a currentTime beállítást még betöltés előtt, de play után működhet
                    }
                    resolve(true);
                };
                const onError = (e) => {
                    this.audio.removeEventListener('error', onError);
                    resolve(false);
                };
                this.audio.addEventListener('loadedmetadata', onLoaded);
                this.audio.addEventListener('error', onError);
                // Ha már betöltődött (ritka)
                if (this.audio.readyState >= 1) onLoaded();
                // Adjunk 8 másodpercet a metadata betöltésre, különben folytassuk
                setTimeout(() => resolve(true), 8000);
            });

            // Indítás
            await this.audio.play();
            this.currentTrackIndex = idx;
            console.log('Playing track idx', idx, 'streamUrl', streamUrl);
        } catch (e) {
            console.error('playTrack error', e);
        }
    }

    pauseTrack() {
        if (this.audio && !this.audio.paused) {
            try { this.audio.pause(); } catch (e) { console.error(e); }
        }
    }

    resumeTrack() {
        if (this.audio) {
            try { this.audio.play(); } catch (e) { console.error(e); }
        }
    }

    unloadTrack() {
        if (this.audio) {
            try {
                this.audio.pause();
                this.audio.src = '';
            } catch (e) { console.error(e); }
            this.audio = null;
        }
        this.currentTrackIndex = -1;
        // figyelmeztetés: a tracks tömb nem törlődik automatikusan, ha csak a lejátszást akarod unloadolni.
        console.log('unloaded track and cleared audio object');
    }

    trackDuration() {
        if (this.audio && !isNaN(this.audio.duration)) {
            return Number(this.audio.duration.toFixed(2));
        }
        // Ha nincs audio, de kiválasztott track adatban van duration (ms), jelezhetjük
        if (this.currentTrackIndex >= 0 && this.tracks[this.currentTrackIndex] && typeof this.tracks[this.currentTrackIndex].duration === 'number') {
            return Number((this.tracks[this.currentTrackIndex].duration / 1000).toFixed(2));
        }
        return 0;
    }

    trackPosition() {
        if (this.audio && !isNaN(this.audio.currentTime)) {
            return Number(this.audio.currentTime.toFixed(2));
        }
        return 0;
    }

    /** ---------- Borítókép betöltése sprite costume-ként (ha lehetséges) ---------- */
    async loadCover(args) {
        const idx = Math.max(0, Number(args.INDEX || 1) - 1);
        const name = String(args.NAME || 'cover');

        if (!this.tracks[idx]) {
            console.warn('loadCover: no track at index', idx);
            return;
        }

        const rawUrl = this.tracks[idx].artwork_url || (this.tracks[idx].user && this.tracks[idx].user.avatar_url);
        if (!rawUrl) {
            console.warn('loadCover: no artwork_url available for track', this.tracks[idx].id);
            return;
        }

        // SoundCloud artwork URLs often contain "-large" etc. Lehetőség: kérj nagyobbat
        const url = rawUrl.replace('-large', '-t500x500');

        try {
            const res = await fetch(url);
            if (!res.ok) {
                console.error('loadCover: fetch failed', res.status);
                return;
            }
            const blob = await res.blob();
            // FileReader -> dataURL
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const dataUrl = reader.result; // data:image/png;base64,....
                    // A Scratch VM belső függvényeit használva adunk jelmezt a stage-hez
                    // Figyelem: a vm API private lehet, de CCW/Gandi-nál korábban működött _addCostumeToTarget
                    const vm = Scratch.vm;
                    const runtime = vm && vm.runtime;
                    if (!runtime) {
                        console.error('loadCover: Scratch VM runtime not found.');
                        return;
                    }
                    // target: az aktuális stage target
                    const stageTarget = runtime.getTargetForStage ? runtime.getTargetForStage() : runtime.targets[0];
                    if (!stageTarget) {
                        console.error('loadCover: stage target not found.');
                        return;
                    }

                    // md5 mezőt a vm elfogadja: itt nem valós md5, de a dataFormat+dataBase64 elég lehet
                    // Néhány VM verziója a következő formátumot várja:
                    const costume = {
                        name: name,
                        md5: 'unused.' + Date.now(), // dummy md5
                        dataFormat: 'png',
                        // Scratch VM expects asset info; itt a dataURL-et használjuk
                        // A _addCostumeToTarget implementációja változhat, de korábban működött
                        bitmapResolution: 1,
                        data: dataUrl
                    };
                    // Próbáljuk meg a private API-t használni (sok CCW környezetben ez működött)
                    if (runtime._addCostumeToTarget) {
                        runtime._addCostumeToTarget(costume, stageTarget);
                        console.log('Cover added as costume with name', name);
                    } else if (stageTarget.addCostume) {
                        stageTarget.addCostume(costume);
                        console.log('Cover added via stageTarget.addCostume');
                    } else {
                        console.error('No method to add costume on this VM/runtime.');
                    }
                } catch (e) {
                    console.error('Error adding costume', e);
                }
            };
            reader.onerror = (err) => {
                console.error('FileReader error', err);
            };
            reader.readAsDataURL(blob);
        } catch (e) {
            console.error('loadCover error', e);
        }
    }
}

// Register the extension
Scratch.extensions.register(new SoundCloudExtension());
