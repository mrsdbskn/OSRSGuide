import fs from 'fs';

async function run() {
  try {
    const res = await fetch('https://www.youtube.com/@osrsquestguides/playlists', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    const html = await res.text();
    const match = html.match(/var ytInitialData = ({[\s\S]*?});<\/script>/);
    if (!match) {
      console.log('No ytInitialData');
      return;
    }
    const data = JSON.parse(match[1]);

    const playlists = [];
    function search(obj) {
      if (!obj || typeof obj !== 'object') return;
      if (obj.lockupViewModel) {
        const vm = obj.lockupViewModel;
        const title = vm.metadata?.lockupMetadataViewModel?.title?.content;
        const url = vm.rendererContext?.commandContext?.onTap?.innertubeCommand?.commandMetadata?.webCommandMetadata?.url 
                 || vm.contentId;
        playlists.push({ title, url, vm });
      }
      for (const k of Object.keys(obj)) {
        search(obj[k]);
      }
    }

    search(data);
    console.log('Playlists found:', playlists.length);
    for (const pl of playlists) {
      console.log(pl.title, '-->', pl.url);
    }
  } catch (e) {
    console.error('ERROR:', e);
  }
}

run();
