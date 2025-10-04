(async function () {
  const gandi = window.gandi;

  // belső player objektum
  let audio = null;

  gandi.extension("soundcloudPlayer", async (ctx) => {
    // Load from soundcloud
    ctx.registerBlock("Load SoundCloud Track", {
      inputs: { url: "string", clientId: "string", listName: "string" },
      outputs: { title: "string", artist: "string", artwork: "string", duration: "number" },
      async execute({ url, clientId, listName }) {
        // get data
        const res = await fetch(
          `https://api.soundcloud.com/resolve?url=${encodeURIComponent(url)}&client_id=${clientId}`
        );
        const track = await res.json();

        // stop already playing audio(if there is any)
        if (audio) {
          audio.pause();
          audio = null;
        }

        // Create new audio
        audio = new Audio(`${track.stream_url}?client_id=${clientId}`);
        audio.autoplay = true;

        // Del scratch list
        gandi.vm.runtime.deleteVariable(listName);

        // Add stuff to scratch list
        gandi.vm.runtime.createVariable(listName, "list");
        gandi.vm.runtime.getVariable(listName).value = [
          `Title: ${track.title}`,
          `Artist: ${track.user.username}`,
          `Artwork: ${track.artwork_url}`,
          `Duration: ${Math.floor(track.duration / 1000)} sec`
        ];

        // ha vége, akkor írjunk logot (később triggerelhet eventet is)
        audio.onended = () => {
          console.log("Track finished!");
        };

        return {
          title: track.title,
          artist: track.user.username,
          artwork: track.artwork_url,
          duration: track.duration
        };
      }
    });

    // Play / Pause
    ctx.registerBlock("Control Playback", {
      inputs: { action: "string" }, // "play" vagy "pause"
      outputs: {},
      execute({ action }) {
        if (!audio) return;
        if (action === "play") audio.play();
        if (action === "pause") audio.pause();
      }
    });

    // Volume
    ctx.registerBlock("Set Volume", {
      inputs: { volume: "number" }, // 0.0 - 1.0 között
      outputs: {},
      execute({ volume }) {
        if (audio) audio.volume = Math.max(0, Math.min(1, volume));
      }
    });
  });
})();
