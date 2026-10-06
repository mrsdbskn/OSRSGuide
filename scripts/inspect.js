async function run() {
  const res = await fetch('https://oldschool.runescape.wiki/api.php?action=parse&page=Cook%27s_Assistant&prop=wikitext&format=json', {
    headers: { 'User-Agent': 'OSRSGuide/1.0' }
  });
  const data = await res.json();
  const text = data.parse.wikitext['*'];
  console.log(text.substring(0, 1500));
}

run();
