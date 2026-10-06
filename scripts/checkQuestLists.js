async function checkQuestLists() {
  const f2pRes = await fetch('https://oldschool.runescape.wiki/api.php?action=parse&page=Quests/Free-to-play&prop=wikitext&format=json', {
    headers: { 'User-Agent': 'OSRSGuide/1.0' }
  });
  const f2p = await f2pRes.json();
  const text = f2p.parse.wikitext['*'];
  const idx = text.indexOf('{| class="wikitable');
  console.log('F2P Table snippet:\n', text.substring(idx, idx + 1000));
}

checkQuestLists();
