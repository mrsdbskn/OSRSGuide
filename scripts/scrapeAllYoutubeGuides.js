import fs from 'fs';

const PLAYLISTS = [
  { id: 'PL_Kl9MOC-n-JIDXDRAhBvISprJgCkhQn-', name: 'Free To Play Quests' },
  { id: 'PL_Kl9MOC-n-Lu6oS1VHiW2Eahgomlyez5', name: "Novice Members' Quests" },
  { id: 'PL_Kl9MOC-n-LvF-U2mx3K35uXmXJl8P_Z', name: "Intermediate Members' Quests" },
  { id: 'PL_Kl9MOC-n-IOBg50eRCpQWpwf2yMyzyR', name: "Experienced Members' Quests" },
  { id: 'PL_Kl9MOC-n-KDxfY2kx7ejkcW3NniQs9O', name: "Master Members' Quests" },
  { id: 'PL_Kl9MOC-n-JhThu00MGM_BzUN_OdOnP2', name: 'Recipe For Disaster' },
  { id: 'PL_Kl9MOC-n-JWrrr0QU0G0Mo2DPe3DRCy', name: 'Miniquests' },
  { id: 'PLPi9OYCH7-VE', name: "Grandmaster Members' Quests (1)" },
  { id: 'PL_Kl9MOC-n-JKJs_7C3TnlsawSYulR6Dv', name: 'Minigames' },
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
  } catch (err) {
    console.error(`Error fetching playlist ${playlistId}:`, err);
    return [];
  }
}

async function run() {
  const allVideos = [];
  for (const pl of PLAYLISTS) {
    console.log(`Fetching playlist: ${pl.name} (${pl.id})...`);
    const videos = await fetchPlaylistVideos(pl.id);
    console.log(`  Found ${videos.length} videos`);
    for (const v of videos) {
      allVideos.push({ ...v, playlist: pl.name });
    }
  }

  console.log(`Total videos gathered from @osrsquestguides playlists: ${allVideos.length}`);

  // Load existing quests
  const quests = JSON.parse(fs.readFileSync('./src/data/quests.json', 'utf8'));

  // Clean strings helper
  function normalize(s) {
    return s.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  let mappedCount = 0;
  for (const q of quests) {
    const qNorm = normalize(q.name);

    // Find best match in allVideos
    let match = allVideos.find(v => {
      const vNorm = normalize(v.title);
      return vNorm.includes(qNorm) || qNorm.includes(vNorm);
    });

    if (!match) {
      // Try relaxed matching
      // e.g. "Cook's Assistant" -> "cooks assistant"
      const words = q.name.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 3 && w !== 'quest');
      if (words.length > 0) {
        match = allVideos.find(v => {
          const vLower = v.title.toLowerCase();
          return words.every(w => vLower.includes(w));
        });
      }
    }

    if (match) {
      q.youtubeVideoId = match.videoId;
      mappedCount++;
    }
  }

  console.log(`Successfully mapped ${mappedCount} / ${quests.length} quests to YouTube guides!`);
  
  // Sample check
  const biohazard = quests.find(q => q.name === 'Biohazard');
  console.log('Biohazard mapped to:', biohazard?.youtubeVideoId);

  fs.writeFileSync('./src/data/quests.json', JSON.stringify(quests, null, 2), 'utf8');
}

run();
