async function getAllQuests() {
  let allPages = [];
  let continueStr = '';
  
  do {
    const url = `https://oldschool.runescape.wiki/api.php?action=query&list=categorymembers&cmtitle=Category:Quests&cmlimit=500&format=json${continueStr ? `&cmcontinue=${continueStr}` : ''}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'OSRSGuide/1.0' } });
    const data = await res.json();
    
    const members = data.query?.categorymembers || [];
    allPages.push(...members.filter(m => m.ns === 0).map(m => m.title));
    
    continueStr = data.continue?.cmcontinue || '';
  } while (continueStr);
  
  console.log('Total ns:0 pages in Category:Quests:', allPages.length);
  
  // Filter out meta pages like "Quests/List", "Quests", etc.
  const questTitles = allPages.filter(title => {
    if (title.startsWith('Quests') || title.startsWith('Quest ') || title.includes('/') || title === 'Miniquests') {
      return false;
    }
    return true;
  });
  
  console.log('Actual quest titles count:', questTitles.length);
  console.log('Sample 20:', questTitles.slice(0, 20));
  
  // Also check if any are missing by comparing with Optimal Quest Guide
  const oqgRes = await fetch('https://oldschool.runescape.wiki/api.php?action=parse&page=Optimal_quest_guide&prop=wikitext&format=json', {
    headers: { 'User-Agent': 'OSRSGuide/1.0' }
  });
  const oqgData = await oqgRes.json();
  const oqgText = oqgData.parse.wikitext['*'];
  const rows = oqgText.split('|- data-rowid=');
  
  const oqgQuests = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const m = row.match(/^"([^"]+)"/);
    if (!m) continue;
    const name = m[1];
    const qpMatch = row.match(/\{\{Optimal quest\/qp\|(\d+)\}\}/);
    const qp = qpMatch ? parseInt(qpMatch[1]) : 0;
    oqgQuests.push({ name, qp, order: i });
  }
  
  console.log('Optimal quest guide entries count:', oqgQuests.length);
}

getAllQuests();
