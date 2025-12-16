/**
 * City lookup utility for DJ Dash directory search
 * Maps city names, state names, zip codes to city slugs
 */

export interface CityInfo {
  name: string;
  state: string;
  stateAbbr: string;
  slug: string;
  zipCodes?: string[];
  aliases?: string[]; // Common misspellings or alternative names
}

// Major US cities for DJ directory
export const cities: Record<string, CityInfo> = {
  'memphis-tn': {
    name: 'Memphis',
    state: 'Tennessee',
    stateAbbr: 'TN',
    slug: 'memphis-tn',
    zipCodes: ['38103', '38104', '38105', '38106', '38107', '38108', '38109', '38111', '38112', '38114', '38115', '38116', '38117', '38118', '38119', '38120', '38122', '38125', '38126', '38127', '38128', '38133', '38134', '38135', '38141', '38152'],
    aliases: ['memphis', 'memphis tn', 'memphis tennessee']
  },
  'nashville-tn': {
    name: 'Nashville',
    state: 'Tennessee',
    stateAbbr: 'TN',
    slug: 'nashville-tn',
    zipCodes: ['37201', '37202', '37203', '37204', '37205', '37206', '37207', '37208', '37209', '37210', '37211', '37212', '37213', '37214', '37215', '37216', '37217', '37218', '37219', '37220', '37221'],
    aliases: ['nashville', 'nashville tn', 'nashville tennessee', 'music city']
  },
  'atlanta-ga': {
    name: 'Atlanta',
    state: 'Georgia',
    stateAbbr: 'GA',
    slug: 'atlanta-ga',
    zipCodes: ['30301', '30302', '30303', '30304', '30305', '30306', '30307', '30308', '30309', '30310', '30311', '30312', '30313', '30314', '30315', '30316', '30317', '30318', '30319'],
    aliases: ['atlanta', 'atlanta ga', 'atlanta georgia', 'atl']
  },
  'los-angeles-ca': {
    name: 'Los Angeles',
    state: 'California',
    stateAbbr: 'CA',
    slug: 'los-angeles-ca',
    zipCodes: ['90001', '90002', '90003', '90004', '90005', '90006', '90007', '90008', '90009', '90010', '90011', '90012', '90013', '90014', '90015', '90016', '90017', '90018', '90019', '90020'],
    aliases: ['los angeles', 'los angeles ca', 'los angeles california', 'la', 'l.a.', 'l a']
  },
  'new-york-ny': {
    name: 'New York',
    state: 'New York',
    stateAbbr: 'NY',
    slug: 'new-york-ny',
    zipCodes: ['10001', '10002', '10003', '10004', '10005', '10006', '10007', '10008', '10009', '10010', '10011', '10012', '10013', '10014', '10015', '10016', '10017', '10018', '10019', '10020'],
    aliases: ['new york', 'new york ny', 'new york city', 'nyc', 'ny', 'manhattan']
  },
  'chicago-il': {
    name: 'Chicago',
    state: 'Illinois',
    stateAbbr: 'IL',
    slug: 'chicago-il',
    zipCodes: ['60601', '60602', '60603', '60604', '60605', '60606', '60607', '60608', '60609', '60610', '60611', '60612', '60613', '60614', '60615', '60616', '60617', '60618', '60619', '60620'],
    aliases: ['chicago', 'chicago il', 'chicago illinois', 'chi-town', 'chi']
  },
  'houston-tx': {
    name: 'Houston',
    state: 'Texas',
    stateAbbr: 'TX',
    slug: 'houston-tx',
    zipCodes: ['77001', '77002', '77003', '77004', '77005', '77006', '77007', '77008', '77009', '77010', '77011', '77012', '77013', '77014', '77015', '77016', '77017', '77018', '77019', '77020'],
    aliases: ['houston', 'houston tx', 'houston texas', 'htx']
  },
  'phoenix-az': {
    name: 'Phoenix',
    state: 'Arizona',
    stateAbbr: 'AZ',
    slug: 'phoenix-az',
    zipCodes: ['85001', '85002', '85003', '85004', '85005', '85006', '85007', '85008', '85009', '85010', '85011', '85012', '85013', '85014', '85015', '85016', '85017', '85018', '85019', '85020'],
    aliases: ['phoenix', 'phoenix az', 'phoenix arizona']
  },
  'philadelphia-pa': {
    name: 'Philadelphia',
    state: 'Pennsylvania',
    stateAbbr: 'PA',
    slug: 'philadelphia-pa',
    zipCodes: ['19101', '19102', '19103', '19104', '19105', '19106', '19107', '19108', '19109', '19110', '19111', '19112', '19113', '19114', '19115', '19116', '19117', '19118', '19119', '19120'],
    aliases: ['philadelphia', 'philadelphia pa', 'philadelphia pennsylvania', 'philly']
  },
  'san-antonio-tx': {
    name: 'San Antonio',
    state: 'Texas',
    stateAbbr: 'TX',
    slug: 'san-antonio-tx',
    zipCodes: ['78201', '78202', '78203', '78204', '78205', '78206', '78207', '78208', '78209', '78210', '78211', '78212', '78213', '78214', '78215', '78216', '78217', '78218', '78219', '78220'],
    aliases: ['san antonio', 'san antonio tx', 'san antonio texas', 'sa']
  },
  'san-diego-ca': {
    name: 'San Diego',
    state: 'California',
    stateAbbr: 'CA',
    slug: 'san-diego-ca',
    zipCodes: ['92101', '92102', '92103', '92104', '92105', '92106', '92107', '92108', '92109', '92110', '92111', '92112', '92113', '92114', '92115', '92116', '92117', '92118', '92119', '92120'],
    aliases: ['san diego', 'san diego ca', 'san diego california', 'sd']
  },
  'dallas-tx': {
    name: 'Dallas',
    state: 'Texas',
    stateAbbr: 'TX',
    slug: 'dallas-tx',
    zipCodes: ['75201', '75202', '75203', '75204', '75205', '75206', '75207', '75208', '75209', '75210', '75211', '75212', '75213', '75214', '75215', '75216', '75217', '75218', '75219', '75220'],
    aliases: ['dallas', 'dallas tx', 'dallas texas']
  },
  'austin-tx': {
    name: 'Austin',
    state: 'Texas',
    stateAbbr: 'TX',
    slug: 'austin-tx',
    zipCodes: ['78701', '78702', '78703', '78704', '78705', '78706', '78707', '78708', '78709', '78710', '78711', '78712', '78713', '78714', '78715', '78716', '78717', '78718', '78719', '78720'],
    aliases: ['austin', 'austin tx', 'austin texas', 'atx']
  },
  'jacksonville-fl': {
    name: 'Jacksonville',
    state: 'Florida',
    stateAbbr: 'FL',
    slug: 'jacksonville-fl',
    zipCodes: ['32099', '32201', '32202', '32203', '32204', '32205', '32206', '32207', '32208', '32209', '32210', '32211', '32212', '32216', '32217', '32218', '32219', '32220'],
    aliases: ['jacksonville', 'jacksonville fl', 'jacksonville florida', 'jax']
  },
  'charlotte-nc': {
    name: 'Charlotte',
    state: 'North Carolina',
    stateAbbr: 'NC',
    slug: 'charlotte-nc',
    zipCodes: ['28201', '28202', '28203', '28204', '28205', '28206', '28207', '28208', '28209', '28210', '28211', '28212', '28213', '28214', '28215', '28216', '28217', '28218', '28219', '28220'],
    aliases: ['charlotte', 'charlotte nc', 'charlotte north carolina', 'clt']
  },
  'san-francisco-ca': {
    name: 'San Francisco',
    state: 'California',
    stateAbbr: 'CA',
    slug: 'san-francisco-ca',
    zipCodes: ['94102', '94103', '94104', '94105', '94107', '94108', '94109', '94110', '94111', '94112', '94114', '94115', '94116', '94117', '94118', '94121', '94122', '94123', '94124', '94127'],
    aliases: ['san francisco', 'san francisco ca', 'san francisco california', 'sf', 'san fran', 'frisco']
  },
  'seattle-wa': {
    name: 'Seattle',
    state: 'Washington',
    stateAbbr: 'WA',
    slug: 'seattle-wa',
    zipCodes: ['98101', '98102', '98103', '98104', '98105', '98106', '98107', '98108', '98109', '98110', '98111', '98112', '98113', '98114', '98115', '98116', '98117', '98118', '98119', '98121'],
    aliases: ['seattle', 'seattle wa', 'seattle washington', 'sea']
  },
  'denver-co': {
    name: 'Denver',
    state: 'Colorado',
    stateAbbr: 'CO',
    slug: 'denver-co',
    zipCodes: ['80201', '80202', '80203', '80204', '80205', '80206', '80207', '80208', '80209', '80210', '80211', '80212', '80213', '80214', '80215', '80216', '80217', '80218', '80219', '80220'],
    aliases: ['denver', 'denver co', 'denver colorado', 'mile high city']
  },
  'washington-dc': {
    name: 'Washington',
    state: 'District of Columbia',
    stateAbbr: 'DC',
    slug: 'washington-dc',
    zipCodes: ['20001', '20002', '20003', '20004', '20005', '20006', '20007', '20008', '20009', '20010', '20011', '20012', '20015', '20016', '20017', '20018', '20019', '20020'],
    aliases: ['washington', 'washington dc', 'washington d.c.', 'dc', 'washington district of columbia']
  },
  'boston-ma': {
    name: 'Boston',
    state: 'Massachusetts',
    stateAbbr: 'MA',
    slug: 'boston-ma',
    zipCodes: ['02108', '02109', '02110', '02111', '02112', '02113', '02114', '02115', '02116', '02117', '02118', '02119', '02120', '02121', '02122', '02124', '02125', '02126', '02127', '02128'],
    aliases: ['boston', 'boston ma', 'boston massachusetts']
  },
  'detroit-mi': {
    name: 'Detroit',
    state: 'Michigan',
    stateAbbr: 'MI',
    slug: 'detroit-mi',
    zipCodes: ['48201', '48202', '48203', '48204', '48205', '48206', '48207', '48208', '48209', '48210', '48211', '48212', '48213', '48214', '48215', '48216', '48217', '48218', '48219', '48220'],
    aliases: ['detroit', 'detroit mi', 'detroit michigan', 'motor city']
  },
  'portland-or': {
    name: 'Portland',
    state: 'Oregon',
    stateAbbr: 'OR',
    slug: 'portland-or',
    zipCodes: ['97201', '97202', '97203', '97204', '97205', '97206', '97207', '97208', '97209', '97210', '97211', '97212', '97213', '97214', '97215', '97216', '97217', '97218', '97219', '97220'],
    aliases: ['portland', 'portland or', 'portland oregon', 'pdx']
  },
  'las-vegas-nv': {
    name: 'Las Vegas',
    state: 'Nevada',
    stateAbbr: 'NV',
    slug: 'las-vegas-nv',
    zipCodes: ['89101', '89102', '89103', '89104', '89105', '89106', '89107', '89108', '89109', '89110', '89111', '89112', '89113', '89114', '89115', '89116', '89117', '89118', '89119', '89120'],
    aliases: ['las vegas', 'las vegas nv', 'las vegas nevada', 'vegas', 'lv']
  },
  'miami-fl': {
    name: 'Miami',
    state: 'Florida',
    stateAbbr: 'FL',
    slug: 'miami-fl',
    zipCodes: ['33101', '33102', '33103', '33104', '33105', '33106', '33107', '33108', '33109', '33110', '33111', '33112', '33114', '33116', '33119', '33122', '33124', '33125', '33126', '33127'],
    aliases: ['miami', 'miami fl', 'miami florida', 'miami beach']
  },
  'minneapolis-mn': {
    name: 'Minneapolis',
    state: 'Minnesota',
    stateAbbr: 'MN',
    slug: 'minneapolis-mn',
    zipCodes: ['55401', '55402', '55403', '55404', '55405', '55406', '55407', '55408', '55409', '55410', '55411', '55412', '55413', '55414', '55415', '55416', '55417', '55418', '55419', '55420'],
    aliases: ['minneapolis', 'minneapolis mn', 'minneapolis minnesota', 'twin cities', 'minneapolis saint paul']
  },
  'tucson-az': {
    name: 'Tucson',
    state: 'Arizona',
    stateAbbr: 'AZ',
    slug: 'tucson-az',
    zipCodes: ['85701', '85702', '85703', '85704', '85705', '85706', '85707', '85708', '85709', '85710', '85711', '85712', '85713', '85714', '85715', '85716', '85717', '85718', '85719', '85720'],
    aliases: ['tucson', 'tucson az', 'tucson arizona']
  },
  'sacramento-ca': {
    name: 'Sacramento',
    state: 'California',
    stateAbbr: 'CA',
    slug: 'sacramento-ca',
    zipCodes: ['95814', '95815', '95816', '95817', '95818', '95819', '95820', '95821', '95822', '95823', '95824', '95825', '95826', '95827', '95828', '95829', '95830', '95831', '95832', '95833'],
    aliases: ['sacramento', 'sacramento ca', 'sacramento california', 'sac']
  },
  'kansas-city-mo': {
    name: 'Kansas City',
    state: 'Missouri',
    stateAbbr: 'MO',
    slug: 'kansas-city-mo',
    zipCodes: ['64101', '64102', '64103', '64104', '64105', '64106', '64108', '64109', '64110', '64111', '64112', '64113', '64114', '64116', '64117', '64118', '64119', '64120', '64123', '64124'],
    aliases: ['kansas city', 'kansas city mo', 'kansas city missouri', 'kc', 'kcmo']
  },
  'raleigh-nc': {
    name: 'Raleigh',
    state: 'North Carolina',
    stateAbbr: 'NC',
    slug: 'raleigh-nc',
    zipCodes: ['27601', '27602', '27603', '27604', '27605', '27606', '27607', '27608', '27609', '27610', '27611', '27612', '27613', '27614', '27615', '27616', '27617'],
    aliases: ['raleigh', 'raleigh nc', 'raleigh north carolina']
  },
  'virginia-beach-va': {
    name: 'Virginia Beach',
    state: 'Virginia',
    stateAbbr: 'VA',
    slug: 'virginia-beach-va',
    zipCodes: ['23451', '23452', '23453', '23454', '23455', '23456', '23457', '23458', '23459', '23460', '23461', '23462', '23463', '23464'],
    aliases: ['virginia beach', 'virginia beach va', 'virginia beach virginia', 'vb']
  },
  'oakland-ca': {
    name: 'Oakland',
    state: 'California',
    stateAbbr: 'CA',
    slug: 'oakland-ca',
    zipCodes: ['94601', '94602', '94603', '94604', '94605', '94606', '94607', '94608', '94609', '94610', '94611', '94612', '94613', '94614', '94615', '94618', '94619', '94621'],
    aliases: ['oakland', 'oakland ca', 'oakland california']
  },
  'tulsa-ok': {
    name: 'Tulsa',
    state: 'Oklahoma',
    stateAbbr: 'OK',
    slug: 'tulsa-ok',
    zipCodes: ['74101', '74102', '74103', '74104', '74105', '74106', '74107', '74108', '74110', '74112', '74114', '74115', '74116', '74117', '74119', '74120', '74126', '74127', '74128', '74129'],
    aliases: ['tulsa', 'tulsa ok', 'tulsa oklahoma']
  },
  'cleveland-oh': {
    name: 'Cleveland',
    state: 'Ohio',
    stateAbbr: 'OH',
    slug: 'cleveland-oh',
    zipCodes: ['44101', '44102', '44103', '44104', '44105', '44106', '44107', '44108', '44109', '44110', '44111', '44112', '44113', '44114', '44115', '44116', '44117', '44118', '44119', '44120'],
    aliases: ['cleveland', 'cleveland oh', 'cleveland ohio']
  },
  'wichita-ks': {
    name: 'Wichita',
    state: 'Kansas',
    stateAbbr: 'KS',
    slug: 'wichita-ks',
    zipCodes: ['67201', '67202', '67203', '67204', '67205', '67206', '67207', '67208', '67209', '67210', '67211', '67212', '67213', '67214', '67215', '67216', '67217', '67218', '67219', '67220'],
    aliases: ['wichita', 'wichita ks', 'wichita kansas']
  },
  'arlington-tx': {
    name: 'Arlington',
    state: 'Texas',
    stateAbbr: 'TX',
    slug: 'arlington-tx',
    zipCodes: ['76001', '76002', '76003', '76004', '76005', '76006', '76007', '76010', '76011', '76012', '76013', '76014', '76015', '76016', '76017', '76018', '76019'],
    aliases: ['arlington', 'arlington tx', 'arlington texas']
  },
};

/**
 * Normalize search input for matching
 */
function normalizeInput(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Find city by name, state, zip code, or alias
 */
export function findCity(input: string): CityInfo | null {
  if (!input || input.trim().length === 0) {
    return null;
  }

  const normalized = normalizeInput(input);

  // Check for exact zip code match
  for (const [slug, city] of Object.entries(cities)) {
    if (city.zipCodes?.includes(input.trim())) {
      return city;
    }
  }

  // Check for city name matches
  for (const [slug, city] of Object.entries(cities)) {
    // Exact match on slug
    if (normalized === slug.toLowerCase()) {
      return city;
    }

    // Match on city name
    if (normalized === city.name.toLowerCase()) {
      return city;
    }

    // Match on "city state" format
    const cityStatePattern = `${city.name.toLowerCase()} ${city.stateAbbr.toLowerCase()}`;
    if (normalized === cityStatePattern) {
      return city;
    }

    const cityStateFullPattern = `${city.name.toLowerCase()} ${city.state.toLowerCase()}`;
    if (normalized === cityStateFullPattern) {
      return city;
    }

    // Check aliases
    if (city.aliases?.some(alias => normalized === alias.toLowerCase())) {
      return city;
    }
  }

  // Partial/fuzzy matching
  for (const [slug, city] of Object.entries(cities)) {
    // Check if input contains city name
    if (normalized.includes(city.name.toLowerCase()) || city.name.toLowerCase().includes(normalized)) {
      return city;
    }

    // Check aliases for partial matches
    if (city.aliases?.some(alias => {
      const aliasLower = alias.toLowerCase();
      return normalized.includes(aliasLower) || aliasLower.includes(normalized);
    })) {
      return city;
    }
  }

  return null;
}

/**
 * Get all cities for autocomplete
 */
export function getAllCities(): CityInfo[] {
  return Object.values(cities);
}

/**
 * Search cities for autocomplete suggestions
 */
export function searchCities(query: string, limit: number = 5): CityInfo[] {
  if (!query || query.trim().length === 0) {
    return getAllCities().slice(0, limit);
  }

  const normalized = normalizeInput(query);
  const matches: { city: CityInfo; score: number }[] = [];

  for (const city of getAllCities()) {
    let score = 0;

    // Exact match gets highest score
    if (city.name.toLowerCase() === normalized) {
      score = 100;
    } else if (city.name.toLowerCase().startsWith(normalized)) {
      score = 80;
    } else if (city.name.toLowerCase().includes(normalized)) {
      score = 60;
    }

    // Check state abbreviation
    if (city.stateAbbr.toLowerCase() === normalized) {
      score = 70;
    }

    // Check full state name
    if (city.state.toLowerCase().includes(normalized)) {
      score += 30;
    }

    // Check aliases
    if (city.aliases?.some(alias => {
      const aliasLower = alias.toLowerCase();
      if (aliasLower === normalized) return true;
      if (aliasLower.startsWith(normalized)) return true;
      if (aliasLower.includes(normalized)) return true;
      return false;
    })) {
      score += 40;
    }

    // Check zip codes
    if (city.zipCodes?.some(zip => zip.includes(query.trim()))) {
      score += 50;
    }

    // Check "city, state" format
    const cityState = `${city.name.toLowerCase()}, ${city.stateAbbr.toLowerCase()}`;
    if (cityState.includes(normalized)) {
      score += 20;
    }

    if (score > 0) {
      matches.push({ city, score });
    }
  }

  // Sort by score and return top matches
  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(m => m.city);
}

