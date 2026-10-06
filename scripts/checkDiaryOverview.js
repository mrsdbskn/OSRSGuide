async function checkOverview() {
  const res = await fetch(`https://oldschool.runescape.wiki/api.php?action=parse&page=Ardougne_Diary&section=1&prop=wikitext&format=json`, {
    headers: { 'User-Agent': 'OSRSGuide/1.0' }
  });
  const json = await res.json();
  const text = json.parse?.wikitext['*'] || '';
  console.log('Overview snippet:\n', text.substring(0, 1500));
}

checkOverview();
