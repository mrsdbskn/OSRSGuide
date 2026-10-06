import fs from 'fs';

async function run() {
  const url = 'https://www.youtube.com/playlist?list=UUG1_EBH9-fRqI93WlaaG98A';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9'
    }
  });
  const html = await res.text();
  const match = html.match(/var ytInitialData = ({[\s\S]*?});<\/script>/);
  if (!match) return;
  const data = JSON.parse(match[1]);

  const videos = [];
  function search(obj) {
    if (!obj || typeof obj !== 'object') return;
    if (obj.lockupViewModel) {
      const vm = obj.lockupViewModel;
      const videoId = vm.contentId;
      const title = vm.metadata?.lockupMetadataViewModel?.title?.content;
      if (videoId && title) {
        videos.push({ videoId, title });
      }
    }
    for (const k of Object.keys(obj)) search(obj[k]);
  }
  search(data);
  console.log('Videos in English:', videos.slice(0, 10));
}

run();
