class FunFactsExtension {
  constructor() {
    this.lastFact = '';
    this.lastImage = '';
    this.webhookURL = ''; // ide rakhatod a Discord webhook URL-ed
    this.username = 'Fun Facts';
    this.pictures = {
      "1":"https://images.stockcake.com/public/8/7/8/878e25d9-4adf-4a1e-88cd-7896c7513265_large/pixelated-paradise-sunset-stockcake.jpg",
      "2":"https://images3.alphacoders.com/921/921277.jpg",
      "3":"https://img.itch.zone/aW1nLzE0MTQ4MDkxLnBuZw==/original/47F2s0.png"
    };
    this.serpApiKey = "19155ce116dfaf32e7c5c428077d84912957b1c9ce7855a0a59212b387c784f0";
  }

  getInfo() {
    return {
      id: 'funFactsExt',
      name: 'Fun Facts Bot',
      color1: '#FFAA00',
      blocks: [
        {
          opcode: 'setWebhook',
          blockType: Scratch.BlockType.COMMAND,
          text: 'set webhook URL [URL]',
          arguments: {
            URL: { type: Scratch.ArgumentType.STRING, defaultValue: '' }
          }
        },
        {
          opcode: 'setUsername',
          blockType: Scratch.BlockType.COMMAND,
          text: 'set username [NAME]',
          arguments: {
            NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'Fun Facts' }
          }
        },
        {
          opcode: 'sendFact',
          blockType: Scratch.BlockType.COMMAND,
          text: 'send a random fact'
        },
        {
          opcode: 'lastFact',
          blockType: Scratch.BlockType.REPORTER,
          text: 'last fact'
        },
        {
          opcode: 'lastImage',
          blockType: Scratch.BlockType.REPORTER,
          text: 'last image URL'
        }
      ],
      targetTypes: ['sprite', 'stage']
    };
  }

  setWebhook(args) {
    this.webhookURL = String(args.URL || '').trim();
  }

  setUsername(args) {
    this.username = String(args.NAME || 'Fun Facts');
  }

  async img(query) {
    try {
      const params = new URLSearchParams({
        q: query,
        tbm: 'isch',
        api_key: this.serpApiKey
      });
      const res = await fetch(`https://serpapi.com/search?${params}`);
      if (!res.ok) {
        console.error('SerpApi error', res.status);
        return '';
      }
      const data = await res.json();
      const pics = data.images_results || [];
      if (!pics.length) return '';
      const pic = pics[Math.floor(Math.random() * pics.length)];
      return pic.original;
    } catch(e) {
      console.error('img fetch error', e);
      return '';
    }
  }

  async sendFact() {
    if (!this.webhookURL) {
      console.error('Webhook URL not set!');
      return;
    }

    try {
      // Get random fact
      const factRes = await fetch("https://uselessfacts.jsph.pl/random.json?language=en");
      const factData = await factRes.json();
      const factText = factData.text;
      const factSource = factData.source;
      const factSourceURL = factData.source_url;

      this.lastFact = factText;

      // Random picture
      const localPicKeys = Object.keys(this.pictures);
      const thumbnail = this.pictures[localPicKeys[Math.floor(Math.random()*localPicKeys.length)]];

      // SerpApi image
      const serpImage = await this.img(factText);
      this.lastImage = serpImage || thumbnail;

      // Send to Discord webhook
      const payload = {
        username: this.username,
        embeds: [
          {
            author: { name: "Random facts", icon_url: "https://g3.img-dpreview.com/79C861DEA19B440F9E5BF213E92F34DE.jpg" },
            title: "Today's useless fact:",
            description: factText,
            color: 16569437,
            thumbnail: { url: thumbnail },
            image: { url: this.lastImage },
            fields: [
              { name: "**Source:**", value: `[${factSource}](${factSourceURL})`, inline: false }
            ]
          }
        ]
      };

      const res = await fetch(this.webhookURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.log(res.status === 204 ? 'Success! Fact sent.' : 'Failed sending fact.', res.status);

    } catch(e) {
      console.error('sendFact error', e);
    }
  }

  lastFact() {
    return this.lastFact || '';
  }

  lastImage() {
    return this.lastImage || '';
  }
}

Scratch.extensions.register(new FunFactsExtension());
