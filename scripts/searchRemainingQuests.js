import fs from 'fs';

async function searchChannel(q) {
  try {
    const url = `https://www.youtube.com/results?search_query=osrs+quest+guides+${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    const html = await res.text();
    const match = html.match(/var ytInitialData = ({[\s\S]*?});<\/script>/);
    if (!match) return null;
    const str = match[1];

    const vmRegex = /"videoId":"([a-zA-Z0-9_-]{11})"[\s\S]*?"title":\{"runs":\[\{"text":"([^"]+)"\}\]/g;
    let m;
    while ((m = vmRegex.exec(str)) !== null) {
      const vid = m[1];
      const title = m[2];
      const firstWord = q.toLowerCase().split(' ')[0];
      if (title.toLowerCase().includes(firstWord)) {
        return { videoId: vid, title };
      }
    }
  } catch (e) {
    return null;
  }
  return null;
}

async function run() {
  const quests = JSON.parse(fs.readFileSync('./src/data/quests.json', 'utf8'));

  const manualMatches = {
    'Garden of Tranquillity': 'MDqGS15mF0M',
    'Forgettable Tale...': 'BDfqvxa9cWk',
    'Sins of the Father': 'cn_anr_Hc4Q',
    'A Night at the Theatre': 'T1kiQQ-zm08',
    'Secrets of the North': '7zG0BFhyfAA',
    'While Guthix Sleeps': 'OY-i8pcAoWM',
    'Desert Treasure II - The Fallen Empire': 'nmIy6fo-3Bg',
    'Song of the Elves': 'oMGvdBCuxoY'
  };

  for (const [name, vid] of Object.entries(manualMatches)) {
    const q = quests.find(item => item.name === name);
    if (q) {
      q.youtubeVideoId = vid;
      console.log(`Updated video for ${name}: ${vid}`);
    }
  }

  // Check remaining without video
  for (const q of quests) {
    if (!q.youtubeVideoId) {
      const found = await searchChannel(q.name);
      if (found) {
        q.youtubeVideoId = found.videoId;
        console.log(`Found online for ${q.name}: ${found.videoId} (${found.title})`);
      }
    }
  }

  // Mark unreleased quests
  const unreleasedNames = [
    'The Graveyard',
    'Fairytale III - Nexus of Power',
    "Fool's Gold",
    'The Chosen Commander'
  ];

  for (const q of quests) {
    if (unreleasedNames.includes(q.name)) {
      q.isUnreleased = true;
      console.log(`Flagged as unreleased: ${q.name}`);
    } else {
      q.isUnreleased = false;
    }
  }

  fs.writeFileSync('./src/data/quests.json', JSON.stringify(quests, null, 2), 'utf8');
  console.log('Saved updated quests.json successfully.');
}

run();
