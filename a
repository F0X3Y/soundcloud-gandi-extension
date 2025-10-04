(async function () {
  const gandi = window.gandi;
  let audio = null;

  gandi.extension("soundcloudPlayerTest", async (ctx) => {
    // Betöltés
    ctx.registerBlock("Load Track", {
      inputs: { url: "string", clientId: "string" },
      outputs: {},
      async execute({ url, clientId }) {
        const res = await fetch(`https://api.soundcloud.com/resolve?url=${encodeURIComponent(url)}&client_id=${clientId}`);
        const track = await res.json();

        if (audio) audio.pause();

        // Hagyományos Audio
        audio = new Audio(`${track.stream_url}?client_id=${clientId}`);
        audio.autoplay = true;

        audio.onended = () => console.log("Track finished!");
      }
    });

    // Play / Pause
    ctx.registerBlock("Control Playback", {
      inputs: { action: "string" },
      outputs: {},
      execute({ action }) {
        if (!audio) return;
        if (action === "play") audio.play();
        if (action === "pause") audio.pause();
      }
    });

    // Volume
    ctx.registerBlock("Set Volume", {
      inputs: { volume: "number" },
      outputs: {},
      execute({ volume }) {
        if (audio) audio.volume = Math.max(0, Math.min(1, volume));
      }
    });
  });
})();
