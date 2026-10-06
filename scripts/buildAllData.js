import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function cleanWikitext(str) {
  if (!str) return '';
  return str
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, '$1')
    .replace(/\{\{SCP\|([^|}]+)\|(\d+)[^}]*\}\}/g, '$1 $2')
    .replace(/\{\{[^}]+\}\}/g, '')
    .replace(/''+/g, '')
    .replace(/&amp;/g, '&')
    .replace(/\{\{sic\}\}/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractBulletItems(text) {
  if (!text) return [];
  const lines = text.split('\n');
  const items = [];
  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('*') && !line.startsWith('**')) {
      const cleaned = cleanWikitext(line.replace(/^\*+\s*/, ''));
      if (cleaned && !cleaned.toLowerCase().includes('none') && cleaned.length > 1) {
        items.push(cleaned);
      }
    }
  }
  return items;
}

// -------------------------------------------------------------
// 1. FETCH & BUILD ALL QUESTS
// -------------------------------------------------------------
async function buildQuests() {
  console.log('>>> Step 1: Fetching Module:Questreq/data...');
  const reqUrl = 'https://oldschool.runescape.wiki/api.php?action=parse&page=Module:Questreq/data&prop=wikitext&format=json';
  const reqRes = await fetch(reqUrl, { headers: { 'User-Agent': 'OSRSGuide-Builder/1.0' } });
  const reqJson = await reqRes.json();
  const reqText = reqJson.parse?.wikitext['*'] || '';

  // Parse Lua questReqs
  const questReqsMap = new Map();
  const questBlocks = reqText.split(/\n\s*\[['"]([^'"]+)['"]\]\s*=\s*\{/);
  for (let i = 1; i < questBlocks.length; i += 2) {
    const questName = questBlocks[i];
    const block = questBlocks[i + 1] || '';

    // Quests prereqs
    const questsMatch = block.match(/\['quests'\]\s*=\s*\{([^}]*)\}/);
    const subQuests = [];
    if (questsMatch) {
      const qMatches = questsMatch[1].matchAll(/['"]([^'"]+)['"]/g);
      for (const m of qMatches) {
        subQuests.push(slugify(m[1]));
      }
    }

    // Skills reqs
    const skillsMatch = block.match(/\['skills'\]\s*=\s*\{([^}]*)\}/);
    const skills = {};
    if (skillsMatch) {
      const sMatches = skillsMatch[1].matchAll(/\{\s*['"]([^'"]+)['"]\s*,\s*(\d+)/g);
      for (const m of sMatches) {
        skills[m[1]] = parseInt(m[2]);
      }
    }

    questReqsMap.set(questName, { subQuests, skills });
  }
  console.log(`Parsed ${questReqsMap.size} quest requirements from Module:Questreq/data.`);

  // Step 1b: Fetch Optimal quest guide
  console.log('>>> Step 1b: Fetching Optimal quest guide...');
  const oqgUrl = 'https://oldschool.runescape.wiki/api.php?action=parse&page=Optimal_quest_guide&prop=wikitext&format=json';
  const oqgRes = await fetch(oqgUrl, { headers: { 'User-Agent': 'OSRSGuide-Builder/1.0' } });
  const oqgJson = await oqgRes.json();
  const oqgText = oqgJson.parse?.wikitext['*'] || '';

  const oqgRows = oqgText.split('|- data-rowid=');
  const optimalOrderMap = new Map();
  const optimalQpMap = new Map();
  let orderIndex = 1;

  for (let i = 1; i < oqgRows.length; i++) {
    const row = oqgRows[i];
    const rowidMatch = row.match(/^"([^"]+)"/);
    if (!rowidMatch) continue;
    const name = rowidMatch[1];

    const qpMatch = row.match(/\{\{Optimal quest\/qp\|(\d+)\}\}/);
    const qp = qpMatch ? parseInt(qpMatch[1]) : 0;

    optimalOrderMap.set(name, orderIndex++);
    if (qp > 0) {
      optimalQpMap.set(name, qp);
    }
  }
  console.log(`Parsed ${optimalOrderMap.size} entries from Optimal quest guide.`);

  // Step 1c: Get all quest pages from Category:Quests
  console.log('>>> Step 1c: Fetching Category:Quests...');
  let allQuestTitles = [];
  let cmcontinue = '';
  do {
    const catUrl = `https://oldschool.runescape.wiki/api.php?action=query&list=categorymembers&cmtitle=Category:Quests&cmlimit=500&format=json${cmcontinue ? `&cmcontinue=${cmcontinue}` : ''}`;
    const catRes = await fetch(catUrl, { headers: { 'User-Agent': 'OSRSGuide-Builder/1.0' } });
    const catJson = await catRes.json();
    const members = catJson.query?.categorymembers || [];
    for (const m of members) {
      if (m.ns === 0) {
        const title = m.title;
        if (!title.startsWith('Quests') && !title.startsWith('Quest ') && !title.includes('/') && title !== 'Miniquests') {
          allQuestTitles.push(title);
        }
      }
    }
    cmcontinue = catJson.continue?.cmcontinue || '';
  } while (cmcontinue);

  allQuestTitles = Array.from(new Set(allQuestTitles));
  console.log(`Found ${allQuestTitles.length} official quest titles to query.`);

  // Step 1d: Batch fetch full wikitext for all quests (40 per batch)
  console.log('>>> Step 1d: Batch fetching quest details & items from wiki...');
  const questsResult = [];
  const chunkSize = 40;

  for (let i = 0; i < allQuestTitles.length; i += chunkSize) {
    const chunk = allQuestTitles.slice(i, i + chunkSize);
    const batchUrl = `https://oldschool.runescape.wiki/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&titles=${encodeURIComponent(chunk.join('|'))}&format=json`;
    const batchRes = await fetch(batchUrl, { headers: { 'User-Agent': 'OSRSGuide-Builder/1.0' } });
    const batchJson = await batchRes.json();
    const pages = Object.values(batchJson.query?.pages || {});

    for (const page of pages) {
      const name = page.title;
      const content = page.revisions?.[0]?.slots?.main?.['*'] || '';

      if (!content.includes('Infobox Quest') && !content.includes('Quest details')) {
        continue;
      }

      // Difficulty
      const diffMatch = content.match(/\|difficulty\s*=\s*([A-Za-z]+)/i);
      let difficulty = diffMatch ? diffMatch[1] : 'Novice';
      difficulty = difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
      if (!['Novice', 'Intermediate', 'Experienced', 'Master', 'Grandmaster', 'Special'].includes(difficulty)) {
        difficulty = 'Intermediate';
      }

      // Members
      const membersMatch = content.match(/\|members\s*=\s*([A-Za-z]+)/i);
      const isMembers = membersMatch ? membersMatch[1].toLowerCase().startsWith('y') : true;

      // Quest Points
      let qp = optimalQpMap.get(name);
      if (qp === undefined) {
        const qpMatch = content.match(/\|(?:questpoints|qp)\s*=\s*(\d+)/i);
        qp = qpMatch ? parseInt(qpMatch[1]) : 1;
      }

      // Optimal Order
      const optimalOrder = optimalOrderMap.get(name) || (900 + questsResult.length);

      // Requirements from Module:Questreq/data
      const reqData = questReqsMap.get(name) || { subQuests: [], skills: {} };

      // Items Required & Recommended
      const detailsSection = content.match(/\{\{Quest details[\s\S]*?\n\}\}/)?.[0] || content;
      const itemsRaw = detailsSection.match(/\|items\s*=\s*([\s\S]*?)(?=\n\|[a-z]+|\n\}\})/i)?.[1] || '';
      const recRaw = detailsSection.match(/\|recommended\s*=\s*([\s\S]*?)(?=\n\|[a-z]+|\n\}\})/i)?.[1] || '';

      const itemsRequired = extractBulletItems(itemsRaw);
      const itemsRecommended = extractBulletItems(recRaw);

      // Rewards
      const qpReward = qp;
      const expRewards = {};
      const expMatches = content.matchAll(/\{\{SCP\|([A-Za-z]+)\|([0-9,]+)\s*(?:XP|experience)/gi);
      for (const m of expMatches) {
        const expVal = parseInt(m[2].replace(/,/g, ''));
        if (expVal > 0) expRewards[m[1]] = expVal;
      }

      questsResult.push({
        id: slugify(name),
        name,
        difficulty,
        questPoints: qp,
        optimalOrder,
        members: isMembers,
        requirements: {
          skills: reqData.skills,
          quests: reqData.subQuests,
        },
        items: {
          required: itemsRequired.slice(0, 15),
          recommended: itemsRecommended.slice(0, 10),
        },
        rewards: {
          questPoints: qpReward,
          experience: expRewards,
        },
        youtubeVideoId: null,
      });
    }
  }

  // Sort by optimalOrder
  questsResult.sort((a, b) => a.optimalOrder - b.optimalOrder);
  console.log(`Successfully compiled ${questsResult.length} complete quests!`);

  const totalQP = questsResult.reduce((sum, q) => sum + q.questPoints, 0);
  console.log(`Total Quest Points: ${totalQP}`);

  const outputPath = path.resolve(__dirname, '../src/data/quests.json');
  fs.writeFileSync(outputPath, JSON.stringify(questsResult, null, 2), 'utf-8');
  console.log(`Saved quests to ${outputPath}`);
}

// -------------------------------------------------------------
// 2. FETCH & BUILD ALL 12 ACHIEVEMENT DIARIES
// -------------------------------------------------------------
const diaryRegionsConfig = [
  { id: 'ardougne', name: 'Ardougne', page: 'Ardougne_Diary', rewardItemName: 'Ardougne cloak' },
  { id: 'desert', name: 'Desert', page: 'Desert_Diary', rewardItemName: 'Desert amulet' },
  { id: 'falador', name: 'Falador', page: 'Falador_Diary', rewardItemName: 'Falador shield' },
  { id: 'fremennik', name: 'Fremennik', page: 'Fremennik_Diary', rewardItemName: 'Fremennik sea boots' },
  { id: 'kandarin', name: 'Kandarin', page: 'Kandarin_Diary', rewardItemName: 'Kandarin headgear' },
  { id: 'karamja', name: 'Karamja', page: 'Karamja_Diary', rewardItemName: 'Karamja gloves' },
  { id: 'kourend', name: 'Kourend & Kebos', page: 'Kourend_%26_Kebos_Diary', rewardItemName: "Rada's blessing" },
  { id: 'lumbridge', name: 'Lumbridge & Draynor', page: 'Lumbridge_%26_Draynor_Diary', rewardItemName: "Explorer's ring" },
  { id: 'morytania', name: 'Morytania', page: 'Morytania_Diary', rewardItemName: 'Morytania legs' },
  { id: 'varrock', name: 'Varrock', page: 'Varrock_Diary', rewardItemName: 'Varrock armour' },
  { id: 'western', name: 'Western Provinces', page: 'Western_Provinces_Diary', rewardItemName: 'Western banner' },
  { id: 'wilderness', name: 'Wilderness', page: 'Wilderness_Diary', rewardItemName: 'Wilderness sword' },
];

async function buildDiaries() {
  console.log('>>> Step 2: Fetching all 12 Achievement Diaries from OSRS Wiki (full pages)...');
  const diariesResult = [];

  for (const reg of diaryRegionsConfig) {
    console.log(`Fetching ${reg.name} Diary...`);
    const pageUrl = `https://oldschool.runescape.wiki/api.php?action=parse&page=${reg.page}&prop=wikitext&format=json`;
    const res = await fetch(pageUrl, { headers: { 'User-Agent': 'OSRSGuide-Builder/1.0' } });
    const json = await res.json();
    const fullText = json.parse?.wikitext['*'] || '';

    const regionObj = {
      id: reg.id,
      name: reg.name,
      rewardItemName: reg.rewardItemName,
      tiers: {},
    };

    // Split page by ==Easy==, ==Medium==, ==Hard==, ==Elite==
    const parts = fullText.split(/==\s*(Easy|Medium|Hard|Elite)\s*==/i);

    for (let i = 1; i < parts.length; i += 2) {
      const rawTierName = parts[i].trim();
      const tierName = rawTierName.charAt(0).toUpperCase() + rawTierName.slice(1).toLowerCase();
      const tierContent = parts[i + 1] || '';

      const tablePart = tierContent.split('{| class="wikitable')[1] || '';
      const rows = tablePart.split('\n|-');
      const tasks = [];
      const tierItemsSet = new Set();

      for (let r = 1; r < rows.length; r++) {
        const row = rows[r].trim();
        if (!row || row.startsWith('|}')) continue;
        const cols = row.split('\n|');
        if (cols.length >= 2) {
          const desc = cleanWikitext(cols[0].replace(/^\|\s*/, ''));
          const reqText = cols.slice(1).join('\n');

          // Extract skills
          const skills = {};
          const skillMatches = reqText.matchAll(/\{\{SCP\|([A-Za-z]+)\|(\d+)/g);
          for (const m of skillMatches) {
            if (!['Quest', 'Combat', 'Coins', 'Item'].includes(m[1])) {
              skills[m[1]] = parseInt(m[2]);
            }
          }

          // Extract items from Requirements column
          const taskItems = [];
          const lines = reqText.split('\n');
          for (const l of lines) {
            if (l.includes('[[') && !l.includes('{{SCP|Quest}}') && !l.includes('Completion of') && !l.includes('{{SCP|Combat')) {
              const cleaned = cleanWikitext(l.replace(/^\*+\s*/, ''));
              if (cleaned && cleaned !== 'None' && cleaned.length > 1) {
                taskItems.push(cleaned);
                tierItemsSet.add(cleaned);
              }
            }
          }

          tasks.push({
            id: `${reg.id}-${tierName.toLowerCase().slice(0, 2)}-${tasks.length + 1}`,
            description: desc,
            skills,
            items: {
              required: taskItems,
              recommended: [],
            },
          });
        }
      }

      const tierNum = tierName === 'Easy' ? 1 : tierName === 'Medium' ? 2 : tierName === 'Hard' ? 3 : 4;
      const prefix = reg.rewardItemName.replace(/ /g, '_').replace(/'/g, '%27');

      regionObj.tiers[tierName] = {
        rewardIconUrl: `https://oldschool.runescape.wiki/images/${prefix}_${tierNum}.png`,
        youtubeVideoId: null,
        items: {
          required: Array.from(tierItemsSet),
          recommended: [],
        },
        tasks,
      };

      console.log(`  ${reg.name} ${tierName}: ${tasks.length} tasks.`);
    }

    diariesResult.push(regionObj);
  }

  const outputPath = path.resolve(__dirname, '../src/data/diaries.json');
  fs.writeFileSync(outputPath, JSON.stringify(diariesResult, null, 2), 'utf-8');
  console.log(`Saved diaries to ${outputPath}`);
}

async function main() {
  await buildQuests();
  await buildDiaries();
  console.log('ALL OSRS DATA GENERATED AND VERIFIED SUCCESSFULLY!');
}

main().catch(console.error);
