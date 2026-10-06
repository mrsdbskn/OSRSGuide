import fs from 'fs';

async function parseCA() {
  console.log('Fetching Combat_Achievements/All_tasks from OSRS Wiki...');
  const res = await fetch('https://oldschool.runescape.wiki/api.php?action=parse&page=Combat_Achievements/All_tasks&prop=text&format=json', {
    headers: { 'User-Agent': 'OSRSGuide/1.0' }
  });
  const data = await res.json();
  const html = data.parse.text['*'];

  const trRegex = /<tr data-ca-task-id="(\d+)">([\s\S]*?)<\/tr>/g;
  let match;
  const tasks = [];
  const tierCounts = {};
  let totalPts = 0;

  const ptsMap = {
    Easy: 1,
    Medium: 2,
    Hard: 3,
    Elite: 4,
    Master: 5,
    Grandmaster: 6
  };

  while ((match = trRegex.exec(html)) !== null) {
    const id = match[1];
    const row = match[2];

    const tdMatches = [...row.matchAll(/<td[\s\S]*?>([\s\S]*?)<\/td>/g)].map(m => m[1]);
    if (tdMatches.length < 5) continue;

    const monster = tdMatches[0].replace(/<[^>]+>/g, '').replace(/&#160;/g, ' ').trim();
    const name = tdMatches[1].replace(/<[^>]+>/g, '').replace(/&#160;/g, ' ').trim();
    const description = tdMatches[2].replace(/<[^>]+>/g, '').replace(/&#160;/g, ' ').trim();
    const type = tdMatches[3].replace(/<[^>]+>/g, '').replace(/&#160;/g, ' ').trim();
    const tierRaw = tdMatches[4].replace(/<[^>]+>/g, '').trim();
    const tierMatch = tierRaw.match(/(Easy|Medium|Hard|Elite|Master|Grandmaster)/i);
    const tier = tierMatch ? tierMatch[1] : 'Easy';

    const points = ptsMap[tier] || 1;
    tierCounts[tier] = (tierCounts[tier] || 0) + 1;
    totalPts += points;

    tasks.push({
      id: `ca-${id}`,
      name,
      monster: monster === 'N/A' || !monster ? 'Other' : monster,
      tier,
      points,
      tierIconUrl: `https://oldschool.runescape.wiki/images/Combat_Achievements_-_${tier.toLowerCase()}_tier_icon.png`,
      type,
      description
    });
  }

  console.log(`Successfully parsed ${tasks.length} Combat Achievement tasks.`);
  console.log('Tier breakdown:', tierCounts);
  console.log('Total CA points:', totalPts);

  fs.writeFileSync('./src/data/combatAchievements.json', JSON.stringify(tasks, null, 2), 'utf8');
  console.log('Saved to src/data/combatAchievements.json');
}

parseCA().catch(console.error);
