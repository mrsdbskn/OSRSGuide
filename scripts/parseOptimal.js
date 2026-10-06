async function parseOptimalGuide() {
  const res = await fetch('https://oldschool.runescape.wiki/api.php?action=parse&page=Optimal_quest_guide&prop=wikitext&format=json', {
    headers: { 'User-Agent': 'OSRSGuide/1.0' }
  });
  const data = await res.json();
  const text = data.parse.wikitext['*'];
  
  // Find table rows
  const rows = text.split('|- data-rowid=');
  console.log('Total data-rowid rows:', rows.length - 1);
  
  const entries = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowidMatch = row.match(/^"([^"]+)"/);
    if (!rowidMatch) continue;
    const rowid = rowidMatch[1];
    
    // Extract quest link
    const linkMatch = row.match(/\|\[\[([^\]\|]+)(\|[^\]]+)?\]\]/);
    const title = linkMatch ? linkMatch[1] : rowid;
    
    // Extract QP
    const qpMatch = row.match(/\{\{Optimal quest\/qp\|(\d+)\}\}/);
    const qp = qpMatch ? parseInt(qpMatch[1]) : 0;
    
    entries.push({
      rowid,
      title,
      qp
    });
  }
  
  console.log('Extracted entries count:', entries.length);
  console.log('First 15 entries:', entries.slice(0, 15));
  console.log('Sample with qp > 0 count:', entries.filter(e => e.qp > 0).length);
}

parseOptimalGuide();
