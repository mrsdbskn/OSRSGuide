async function test() {
  const username = 'mrsdbskn';
  const res = await fetch(`https://api.wiseoldman.net/v2/players/${username}`);
  const data = await res.json();
  const snapshotSkills = data.latestSnapshot.data.skills;

  const ALL_SKILLS = [
    'Attack', 'Hitpoints', 'Mining',
    'Strength', 'Agility', 'Smithing',
    'Defence', 'Herblore', 'Fishing',
    'Ranged', 'Thieving', 'Cooking',
    'Prayer', 'Crafting', 'Firemaking',
    'Magic', 'Fletching', 'Woodcutting',
    'Runecraft', 'Slayer', 'Farming',
    'Construction', 'Hunter', 'Sailing'
  ];

  const skills = {};
  let calculatedTotal = 0;
  for (const s of ALL_SKILLS) {
    let key = s.toLowerCase();
    if (s === 'Runecraft') {
      key = snapshotSkills.runecrafting ? 'runecrafting' : 'runecraft';
    }
    const lvl = snapshotSkills[key]?.level || 1;
    skills[s] = lvl;
    calculatedTotal += lvl;
  }

  const overall = snapshotSkills.overall?.level || calculatedTotal;
  console.log('Player:', data.displayName);
  console.log('Combat level:', data.combatLevel);
  console.log('Runecraft level:', skills['Runecraft']);
  console.log('Sailing level:', skills['Sailing']);
  console.log('Calculated 24 total:', calculatedTotal);
  console.log('Calculated 23 classic total:', calculatedTotal - skills['Sailing']);
  console.log('WOM Official Overall:', overall);
}

test();
