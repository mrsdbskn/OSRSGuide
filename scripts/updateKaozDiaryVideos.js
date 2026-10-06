import fs from 'fs';

const diaries = JSON.parse(fs.readFileSync('src/data/diaries.json', 'utf8'));

const KAOZ_DIARY_VIDEOS = {
  ardougne: {
    Easy: '7TWBMd7LYfg',
    Medium: 'tc55rQabwS4',
    Hard: '0IodLMdYSig',
    Elite: 'yKD7ytorlps',
  },
  desert: {
    Easy: '00N4z8YLt9Q',
    Medium: 'eI4YSgtkaho',
    Hard: 'OAKPQyhSdIU',
    Elite: 'L7IlQasWuzY',
  },
  falador: {
    Easy: 'pyBp9rtB-_w',
    Medium: 'FzYpypReFQ0',
    Hard: 'U2MqaMTtzF0',
    Elite: 'ePA6Cmcbxno',
  },
  fremennik: {
    Easy: 'x3hSN1ptjXE',
    Medium: 'b84Tfc4FB2U',
    Hard: 'MI_V_pvi6h8',
    Elite: '75LqlZMqqj4',
  },
  kandarin: {
    Easy: 'qmPZPGxfmiA',
    Medium: 'S_pqfzzZPkY',
    Hard: 'dycdj3g_4dE',
    Elite: 'qr3KjmIamZI',
  },
  karamja: {
    Easy: 'AcZFtoh8Q3s',
    Medium: 'cSTAdhAxZIU',
    Hard: 'ORHAow87lAM',
    Elite: 'nIwBoN_18Cw',
  },
  kourend: {
    Easy: 'Kq13f1-MEGM',
    Medium: '9UrawsjFbVE',
    Hard: 'BRIVdMR42IU',
    Elite: 'Cu9j5kj4_jI',
  },
  lumbridge: {
    Easy: 'DvEBf-io5oM',
    Medium: 'oQK5G9-7UJE',
    Hard: 'xV3QYzNSjT0',
    Elite: 'Pb0MfxDQ-8I',
  },
  morytania: {
    Easy: 'y0H3OfYmVbI',
    Medium: '1q-anEO7XUw',
    Hard: 'gjlFwb7kbms',
    Elite: 'V8-iHWW4C9g',
  },
  varrock: {
    Easy: '94eei7agCFs',
    Medium: 'JqHBTZEN2do',
    Hard: 'VOQqCB0JbpA',
    Elite: 'LnWgwoukoqc',
  },
  western: {
    Easy: 'hN725LwAZnc',
    Medium: '-zdIIJ8wj2o',
    Hard: '1EGVtKFVGbY',
    Elite: 'taQpUmusedU',
  },
  wilderness: {
    Easy: 'TDfah9UU1DI',
    Medium: 'kdDfTozewn0',
    Hard: '1j4_ozw8FqE',
    Elite: 'Dpm8qgMsr0o',
  },
};

let updatedCount = 0;
for (const region of diaries) {
  const mapping = KAOZ_DIARY_VIDEOS[region.id];
  if (!mapping) {
    console.warn(`No mapping found for region: ${region.id}`);
    continue;
  }
  for (const tier of ['Easy', 'Medium', 'Hard', 'Elite']) {
    if (region.tiers[tier]) {
      region.tiers[tier].youtubeVideoId = mapping[tier];
      updatedCount++;
    }
  }
}

fs.writeFileSync('src/data/diaries.json', JSON.stringify(diaries, null, 2), 'utf8');
console.log(`Successfully mapped ${updatedCount} diary tier videos to Kaoz OSRS (@KaozOSRS)!`);
