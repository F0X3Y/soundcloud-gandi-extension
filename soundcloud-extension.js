(function waitForGandi() {
  if (typeof gandi === "undefined") {
    setTimeout(waitForGandi, 100); // 100 ms-onta újrapróbálkozunk
    return;
  }

  // Itt jön a SoundCloud extension kódja
  (async function() {
    let audio = null;

    gandi.extension("soundcloudPlayer", async (ctx) => {
      // Track betöltése
      ctx.registerBlock("Load Track", {
        inputs: { url: "string", clientId: "string", listName: "string" },
        outputs: { title: "string", artist: "string", artwork: "string", duration: "number" },
        async execute({ url, clientId, listName }) {
          const res = await fetch(`https://api.soundcloud.com/resolve?url=${encodeURIComponent(url)}&client_id=${clientId}`);
          const track = await res.json();

          // Leállítjuk az előző track-et, ha van
          if (audio) audio.pause();
          audio = new Audio(`${track.stream_url}?client_id=${clientId}`);
          audio.autoplay = true;

          // Scratch lista kezelése
          gandi.vm.runtime.deleteVariable(listName);
          gandi.vm.runtime.createVariable(listName, "list");
          gandi.vm.runtime.getVariable(listName).value = [
            `Title: ${track.title}`,
            `Artist: ${track.user.username}`,
            `Artwork: ${track.artwork_url}`,
            `Duration: ${Math.floor(track.duration / 1000)} sec`
          ];

          // Track vége esemény
          audio.onended = () => console.log("Track finished!");

          return { title: track.title, artist: track.user.username, artwork: track.artwork_url, duration: track.duration };
        }
      });

      // Lejátszás / Szünet
      ctx.registerBlock("Control Playback", {
        inputs: { action: "string" }, // "play" vagy "pause"
        outputs: {},
        execute({ action }) {
          if (!audio) return;
          if (action === "play") audio.play();
          if (action === "pause") audio.pause();
        }
      });

      // Hangerő állítás
      ctx.registerBlock("Set Volume", {
        inputs: { volume: "number" }, // 0.0 - 1.0 között
        outputs: {},
        execute({ volume }) {
          if (audio) audio.volume = Math.max(0, Math.min(1, volume));
        }
      });

    });
  })();

})();
