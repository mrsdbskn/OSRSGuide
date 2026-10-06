async function inspectQuest(name) {
  const res = await fetch(`https://oldschool.runescape.wiki/api.php?action=parse&page=${encodeURIComponent(name)}&prop=wikitext&format=json`, {
    headers: { 'User-Agent': 'OSRSGuide/1.0' }
  });
  const data = await res.json();
  const text = data.parse?.wikitext['*'];
  if (!text) {
    console.log('No text for', name);
    return;
  }
  
  const detailsMatch = text.match(/\{\{Quest details([\s\S]*?)\n\}\}/);
  if (detailsMatch) {
    console.log('Quest details for', name, ':\n', detailsMatch[1]);
  } else {
    console.log('No {{Quest details}} in', name);
  }
}

inspectQuest('Dragon Slayer I');
