import fs from 'fs';

// All playlists belonging strictly to @osrsquestguides:
const PLAYLISTS = [
  'PL_Kl9MOC-n-JIDXDRAhBvISprJgCkhQn-', // F2P
  'PL_Kl9MOC-n-Lu6oS1VHiW2Eahgomlyez5', // Novice
  'PL_Kl9MOC-n-LvF-U2mx3K35uXmXJl8P_Z', // Intermediate
  'PL_Kl9MOC-n-IOBg50eRCpQWpwf2yMyzyR', // Experienced
  'PL_Kl9MOC-n-KDxfY2kx7ejkcW3NniQs9O', // Master
  'PL_Kl9MOC-n-JhThu00MGM_BzUN_OdOnP2', // RFD
  'PL_Kl9MOC-n-JWrrr0QU0G0Mo2DPe3DRCy', // Miniquests
  'PLPi9OYCH7-VE',                      // Grandmaster
  'PL_Kl9MOC-n-Ksy-PX-8NJ1-ehQwzyRmDt', // Activity guides
  'PL_Kl9MOC-n-JKJs_7C3TnlsawSYulR6Dv', // Minigames
  'UUG1_EBH9-fRqI93WlaaG98A'             // Full uploads playlist
];

async function fetchPlaylistVideos(playlistId) {
  try {
    const url = `https://www.youtube.com/playlist?list=${playlistId}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    const html = await res.text();
    const match = html.match(/var ytInitialData = ({[\s\S]*?});<\/script>/);
    if (!match) return [];
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
    return videos;
  } catch (e) {
    return [];
  }
}

async function run() {
  const verifiedMap = new Map();

  for (const pid of PLAYLISTS) {
    const vids = await fetchPlaylistVideos(pid);
    for (const v of vids) {
      verifiedMap.set(v.videoId, v.title);
    }
  }

  console.log(`Gathered ${verifiedMap.size} verified videos strictly from @osrsquestguides.`);

  const quests = JSON.parse(fs.readFileSync('./src/data/quests.json', 'utf8'));

  function cleanStr(s) {
    return s.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  let matchedStrict = 0;
  let nonStrict = 0;

  for (const q of quests) {
    if (q.youtubeVideoId) {
      if (verifiedMap.has(q.youtubeVideoId)) {
        matchedStrict++;
      } else {
        console.log(`Non-strict video found: ${q.name} -> ${q.youtubeVideoId}`);
        q.youtubeVideoId = null;
        nonStrict++;
      }
    } else {
      // Try to find a match strictly from @osrsquestguides
      const qClean = cleanStr(q.name);
      let matched = null;

      for (const [vid, title] of verifiedMap.entries()) {
        const tClean = cleanStr(title);
        if (tClean.includes(qClean) || qClean.includes(tClean)) {
          matched = { vid, title };
          break;
        }
      }

      if (!matched) {
        const words = q.name.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 3 && w !== 'quest');
        if (words.length > 0) {
          for (const [vid, title] of verifiedMap.entries()) {
            const tLower = title.toLowerCase();
            if (words.every(w => tLower.includes(w))) {
              matched = { vid, title };
              break;
            }
          }
        }
      }

      if (matched) {
        console.log(`Matched new @osrsquestguides video for ${q.name}: [${matched.vid}] ${matched.title}`);
        q.youtubeVideoId = matched.vid;
        matchedStrict++;
      }
    }
  }

  console.log(`Total verified @osrsquestguides videos in dataset: ${matchedStrict}`);
  console.log(`Non-strict videos removed: ${nonStrict}`);
  console.log(`Quests without video: ${quests.filter(q => !q.youtubeVideoId).length}`);

  fs.writeFileSync('./src/data/quests.json', JSON.stringify(quests, null, 2), 'utf8');
}

run().catch(console.error);
