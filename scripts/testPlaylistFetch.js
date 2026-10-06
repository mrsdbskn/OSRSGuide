import fs from 'fs';

async function run() {
  const url = `https://www.youtube.com/playlist?list=PL_Kl9MOC-n-LvF-U2mx3K35uXmXJl8P_Z`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9'
    }
  });
  const html = await res.text();
  const match = html.match(/var ytInitialData = ({[\s\S]*?});<\/script>/);
  const data = JSON.parse(match[1]);

  function findLockup(obj) {
    if (!obj || typeof obj !== 'object') return null;
    if (obj.lockupViewModel) {
      const title = obj.lockupViewModel.metadata?.lockupMetadataViewModel?.title?.content;
      if (title && title.includes('Waterfall Quest')) {
        return obj.lockupViewModel;
      }
    }
    for (const k of Object.keys(obj)) {
      const found = findLockup(obj[k]);
      if (found) return found;
    }
    return null;
  }

  const vm = findLockup(data);
  console.log('VM contentId:', vm.contentId);
  console.log('VM keys:', Object.keys(vm));
  console.log('VM rendererContext:', JSON.stringify(vm.rendererContext));
}

run();
