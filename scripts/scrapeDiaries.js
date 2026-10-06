const diaries = [
  { id: 'ardougne', name: 'Ardougne', page: 'Ardougne_Diary' },
  { id: 'desert', name: 'Desert', page: 'Desert_Diary' },
  { id: 'falador', name: 'Falador', page: 'Falador_Diary' },
  { id: 'fremennik', name: 'Fremennik', page: 'Fremennik_Diary' },
  { id: 'kandarin', name: 'Kandarin', page: 'Kandarin_Diary' },
  { id: 'karamja', name: 'Karamja', page: 'Karamja_Diary' },
  { id: 'kourend', name: 'Kourend & Kebos', page: 'Kourend_%26_Kebos_Diary' },
  { id: 'lumbridge', name: 'Lumbridge & Draynor', page: 'Lumbridge_%26_Draynor_Diary' },
  { id: 'morytania', name: 'Morytania', page: 'Morytania_Diary' },
  { id: 'varrock', name: 'Varrock', page: 'Varrock_Diary' },
  { id: 'western', name: 'Western Provinces', page: 'Western_Provinces_Diary' },
  { id: 'wilderness', name: 'Wilderness', page: 'Wilderness_Diary' },
];

async function checkDiaries() {
  for (const d of diaries) {
    const res = await fetch(`https://oldschool.runescape.wiki/api.php?action=parse&page=${d.page}&prop=sections&format=json`, {
      headers: { 'User-Agent': 'OSRSGuide/1.0' }
    });
    const json = await res.json();
    const sections = json.parse?.sections || [];
    const tiers = sections.filter(s => ['Easy', 'Medium', 'Hard', 'Elite'].includes(s.line));
    console.log(`${d.name}: found tiers:`, tiers.map(t => `${t.line} (sec ${t.number})`));
  }
}

checkDiaries();
