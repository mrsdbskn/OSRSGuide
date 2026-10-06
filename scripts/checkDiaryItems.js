async function checkItems() {
  const res = await fetch(`https://oldschool.runescape.wiki/api.php?action=parse&page=Ardougne_Diary&section=2&prop=wikitext&format=json`, {
    headers: { 'User-Agent': 'OSRSGuide/1.0' }
  });
  const json = await res.json();
  const text = json.parse?.wikitext['*'] || '';
  const tablePart = text.split('{| class="wikitable')[1] || '';
  const rows = tablePart.split('\n|-');
  
  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i].trim().split('\n|');
    if (cols.length >= 2) {
      console.log(`Task ${i}:`, cols[0].slice(0, 40));
      console.log(`Req ${i}:\n`, cols[1]);
      console.log('---');
    }
  }
}

checkItems();
