const diaries = [
  { id: 'ardougne', name: 'Ardougne', page: 'Ardougne_Diary', rewardItemName: 'Ardougne cloak' },
  { id: 'desert', name: 'Desert', page: 'Desert_Diary', rewardItemName: 'Desert amulet' },
  { id: 'falador', name: 'Falador', page: 'Falador_Diary', rewardItemName: 'Falador shield' },
  { id: 'fremennik', name: 'Fremennik', page: 'Fremennik_Diary', rewardItemName: 'Fremennik sea boots' },
  { id: 'kandarin', name: 'Kandarin', page: 'Kandarin_Diary', rewardItemName: 'Kandarin headgear' },
  { id: 'karamja', name: 'Karamja', page: 'Karamja_Diary', rewardItemName: 'Karamja gloves' },
  { id: 'kourend', name: 'Kourend & Kebos', page: 'Kourend_%26_Kebos_Diary', rewardItemName: "Rada's blessing" },
  { id: 'lumbridge', name: 'Lumbridge & Draynor', page: 'Lumbridge_%26_Draynor_Diary', rewardItemName: "Explorer's ring" },
  { id: 'morytania', name: 'Morytania', page: 'Morytania_Diary', rewardItemName: 'Morytania legs' },
  { id: 'varrock', name: 'Varrock', page: 'Varrock_Diary', rewardItemName: 'Varrock armour' },
  { id: 'western', name: 'Western Provinces', page: 'Western_Provinces_Diary', rewardItemName: 'Western banner' },
  { id: 'wilderness', name: 'Wilderness', page: 'Wilderness_Diary', rewardItemName: 'Wilderness sword' },
];

function cleanWikitext(str) {
  if (!str) return '';
  return str
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, '$1') // [[Link|Text]] -> Text
    .replace(/\{\{SCP\|([^|}]+)\|(\d+)[^}]*\}\}/g, '$1 $2') // {{SCP|Skill|5}} -> Skill 5
    .replace(/\{\{[^}]+\}\}/g, '') // remove templates
    .replace(/''+/g, '') // remove italics/bolds
    .replace(/\s+/g, ' ')
    .trim();
}

async function testParse() {
  const res = await fetch(`https://oldschool.runescape.wiki/api.php?action=parse&page=Ardougne_Diary&section=2&prop=wikitext&format=json`, {
    headers: { 'User-Agent': 'OSRSGuide/1.0' }
  });
  const json = await res.json();
  const text = json.parse?.wikitext['*'] || '';
  
  // Find table rows
  const tablePart = text.split('{| class="wikitable')[1] || '';
  const rows = tablePart.split('\n|-');
  
  console.log('Ardougne Easy table rows count:', rows.length - 1);
  const tasks = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i].trim();
    if (!row || row.startsWith('|}')) continue;
    const cols = row.split('\n|');
    if (cols.length >= 2) {
      const taskText = cleanWikitext(cols[0].replace(/^\|\s*/, ''));
      const reqText = cols.slice(1).join('\n');
      
      // Extract skills: {{SCP|Skill|Level}}
      const skills = {};
      const skillMatches = reqText.matchAll(/\{\{SCP\|([A-Za-z]+)\|(\d+)/g);
      for (const m of skillMatches) {
        if (!['Quest', 'Combat', 'Coins', 'Item'].includes(m[1])) {
          skills[m[1]] = parseInt(m[2]);
        }
      }
      
      tasks.push({
        desc: taskText,
        skills,
        rawReq: cleanWikitext(reqText)
      });
    }
  }
  
  console.log('Parsed tasks for Ardougne Easy:', tasks.length);
  console.log('Sample task 1:', tasks[0]);
  console.log('Sample task 2:', tasks[1]);
}

testParse();
