async function run() {
  const res = await fetch('https://oldschool.runescape.wiki/w/MediaWiki:Gadget-wikisync-core.js?action=raw');
  const code = await res.text();
  console.log('Core length:', code.length);
  const lines = code.split('\n').filter(l => l.includes('http') || l.includes('sync') || l.includes('fetch') || l.includes('ajax'));
  console.log(lines.slice(0, 30).join('\n'));
}
run();
