/**
 * Area Code Lookup Utility
 * Maps US area codes to their primary city/state locations
 */

interface AreaCodeInfo {
  areaCode: string;
  location: string;
  state: string;
  region?: string;
}

/**
 * Comprehensive mapping of US area codes to their primary locations
 * Based on NANP (North American Numbering Plan) assignments
 */
const AREA_CODE_MAP: Record<string, AreaCodeInfo> = {
  // California
  '209': { areaCode: '209', location: 'Stockton', state: 'CA', region: 'Central Valley' },
  '213': { areaCode: '213', location: 'Los Angeles', state: 'CA', region: 'Los Angeles County' },
  '310': { areaCode: '310', location: 'Beverly Hills', state: 'CA', region: 'Los Angeles County' },
  '323': { areaCode: '323', location: 'Los Angeles', state: 'CA', region: 'Los Angeles County' },
  '408': { areaCode: '408', location: 'San Jose', state: 'CA', region: 'Silicon Valley' },
  '415': { areaCode: '415', location: 'San Francisco', state: 'CA', region: 'Bay Area' },
  '424': { areaCode: '424', location: 'Los Angeles', state: 'CA', region: 'Los Angeles County' },
  '442': { areaCode: '442', location: 'Oceanside', state: 'CA', region: 'San Diego County' },
  '510': { areaCode: '510', location: 'Oakland', state: 'CA', region: 'East Bay' },
  '530': { areaCode: '530', location: 'Redding', state: 'CA', region: 'Northern California' },
  '559': { areaCode: '559', location: 'Fresno', state: 'CA', region: 'Central Valley' },
  '562': { areaCode: '562', location: 'Long Beach', state: 'CA', region: 'Los Angeles County' },
  '619': { areaCode: '619', location: 'San Diego', state: 'CA', region: 'San Diego County' },
  '626': { areaCode: '626', location: 'Pasadena', state: 'CA', region: 'Los Angeles County' },
  '628': { areaCode: '628', location: 'San Francisco', state: 'CA', region: 'Bay Area' },
  '650': { areaCode: '650', location: 'Palo Alto', state: 'CA', region: 'Peninsula' },
  '657': { areaCode: '657', location: 'Anaheim', state: 'CA', region: 'Orange County' },
  '661': { areaCode: '661', location: 'Bakersfield', state: 'CA', region: 'San Joaquin Valley' },
  '669': { areaCode: '669', location: 'San Jose', state: 'CA', region: 'Silicon Valley' },
  '707': { areaCode: '707', location: 'Santa Rosa', state: 'CA', region: 'North Bay' },
  '714': { areaCode: '714', location: 'Anaheim', state: 'CA', region: 'Orange County' },
  '747': { areaCode: '747', location: 'Burbank', state: 'CA', region: 'Los Angeles County' },
  '760': { areaCode: '760', location: 'Oceanside', state: 'CA', region: 'San Diego County' },
  '805': { areaCode: '805', location: 'Ventura', state: 'CA', region: 'Central Coast' },
  '818': { areaCode: '818', location: 'Burbank', state: 'CA', region: 'San Fernando Valley' },
  '831': { areaCode: '831', location: 'Salinas', state: 'CA', region: 'Central Coast' },
  '858': { areaCode: '858', location: 'San Diego', state: 'CA', region: 'San Diego County' },
  '909': { areaCode: '909', location: 'San Bernardino', state: 'CA', region: 'Inland Empire' },
  '916': { areaCode: '916', location: 'Sacramento', state: 'CA', region: 'Sacramento Valley' },
  '925': { areaCode: '925', location: 'Concord', state: 'CA', region: 'East Bay' },
  '949': { areaCode: '949', location: 'Irvine', state: 'CA', region: 'Orange County' },
  '951': { areaCode: '951', location: 'Riverside', state: 'CA', region: 'Inland Empire' },
  
  // Tennessee
  '423': { areaCode: '423', location: 'Chattanooga', state: 'TN', region: 'East Tennessee' },
  '615': { areaCode: '615', location: 'Nashville', state: 'TN', region: 'Middle Tennessee' },
  '629': { areaCode: '629', location: 'Nashville', state: 'TN', region: 'Middle Tennessee' },
  '731': { areaCode: '731', location: 'Jackson', state: 'TN', region: 'West Tennessee' },
  '865': { areaCode: '865', location: 'Knoxville', state: 'TN', region: 'East Tennessee' },
  '901': { areaCode: '901', location: 'Memphis', state: 'TN', region: 'West Tennessee' },
  '931': { areaCode: '931', location: 'Clarksville', state: 'TN', region: 'Middle Tennessee' },
  
  // Texas
  '210': { areaCode: '210', location: 'San Antonio', state: 'TX', region: 'South Texas' },
  '214': { areaCode: '214', location: 'Dallas', state: 'TX', region: 'Dallas-Fort Worth' },
  '281': { areaCode: '281', location: 'Houston', state: 'TX', region: 'Greater Houston' },
  '325': { areaCode: '325', location: 'Abilene', state: 'TX', region: 'West Texas' },
  '346': { areaCode: '346', location: 'Houston', state: 'TX', region: 'Greater Houston' },
  '361': { areaCode: '361', location: 'Corpus Christi', state: 'TX', region: 'Coastal Texas' },
  '409': { areaCode: '409', location: 'Beaumont', state: 'TX', region: 'Southeast Texas' },
  '430': { areaCode: '430', location: 'Tyler', state: 'TX', region: 'East Texas' },
  '432': { areaCode: '432', location: 'Midland', state: 'TX', region: 'West Texas' },
  '469': { areaCode: '469', location: 'Dallas', state: 'TX', region: 'Dallas-Fort Worth' },
  '512': { areaCode: '512', location: 'Austin', state: 'TX', region: 'Central Texas' },
  '713': { areaCode: '713', location: 'Houston', state: 'TX', region: 'Greater Houston' },
  '726': { areaCode: '726', location: 'San Antonio', state: 'TX', region: 'South Texas' },
  '737': { areaCode: '737', location: 'Austin', state: 'TX', region: 'Central Texas' },
  '806': { areaCode: '806', location: 'Lubbock', state: 'TX', region: 'West Texas' },
  '817': { areaCode: '817', location: 'Fort Worth', state: 'TX', region: 'Dallas-Fort Worth' },
  '830': { areaCode: '830', location: 'New Braunfels', state: 'TX', region: 'South Texas' },
  '832': { areaCode: '832', location: 'Houston', state: 'TX', region: 'Greater Houston' },
  '903': { areaCode: '903', location: 'Tyler', state: 'TX', region: 'East Texas' },
  '915': { areaCode: '915', location: 'El Paso', state: 'TX', region: 'West Texas' },
  '936': { areaCode: '936', location: 'Huntsville', state: 'TX', region: 'East Texas' },
  '940': { areaCode: '940', location: 'Denton', state: 'TX', region: 'Dallas-Fort Worth' },
  '956': { areaCode: '956', location: 'Laredo', state: 'TX', region: 'South Texas' },
  '972': { areaCode: '972', location: 'Dallas', state: 'TX', region: 'Dallas-Fort Worth' },
  '979': { areaCode: '979', location: 'Bryan', state: 'TX', region: 'East Texas' },
  
  // New York
  '212': { areaCode: '212', location: 'Manhattan', state: 'NY', region: 'New York City' },
  '315': { areaCode: '315', location: 'Syracuse', state: 'NY', region: 'Central New York' },
  '347': { areaCode: '347', location: 'New York City', state: 'NY', region: 'New York City' },
  '516': { areaCode: '516', location: 'Long Island', state: 'NY', region: 'Nassau County' },
  '518': { areaCode: '518', location: 'Albany', state: 'NY', region: 'Capital Region' },
  '585': { areaCode: '585', location: 'Rochester', state: 'NY', region: 'Western New York' },
  '607': { areaCode: '607', location: 'Binghamton', state: 'NY', region: 'Southern Tier' },
  '631': { areaCode: '631', location: 'Long Island', state: 'NY', region: 'Suffolk County' },
  '646': { areaCode: '646', location: 'New York City', state: 'NY', region: 'New York City' },
  '716': { areaCode: '716', location: 'Buffalo', state: 'NY', region: 'Western New York' },
  '718': { areaCode: '718', location: 'Brooklyn', state: 'NY', region: 'New York City' },
  '845': { areaCode: '845', location: 'Poughkeepsie', state: 'NY', region: 'Hudson Valley' },
  '914': { areaCode: '914', location: 'Yonkers', state: 'NY', region: 'Westchester County' },
  '917': { areaCode: '917', location: 'New York City', state: 'NY', region: 'New York City' },
  '929': { areaCode: '929', location: 'New York City', state: 'NY', region: 'New York City' },
  
  // Florida
  '305': { areaCode: '305', location: 'Miami', state: 'FL', region: 'South Florida' },
  '321': { areaCode: '321', location: 'Cocoa', state: 'FL', region: 'Space Coast' },
  '352': { areaCode: '352', location: 'Gainesville', state: 'FL', region: 'North Central Florida' },
  '386': { areaCode: '386', location: 'Daytona Beach', state: 'FL', region: 'East Central Florida' },
  '407': { areaCode: '407', location: 'Orlando', state: 'FL', region: 'Central Florida' },
  '561': { areaCode: '561', location: 'West Palm Beach', state: 'FL', region: 'South Florida' },
  '689': { areaCode: '689', location: 'Orlando', state: 'FL', region: 'Central Florida' },
  '727': { areaCode: '727', location: 'St. Petersburg', state: 'FL', region: 'Tampa Bay' },
  '754': { areaCode: '754', location: 'Fort Lauderdale', state: 'FL', region: 'South Florida' },
  '772': { areaCode: '772', location: 'Vero Beach', state: 'FL', region: 'Treasure Coast' },
  '786': { areaCode: '786', location: 'Miami', state: 'FL', region: 'South Florida' },
  '813': { areaCode: '813', location: 'Tampa', state: 'FL', region: 'Tampa Bay' },
  '850': { areaCode: '850', location: 'Tallahassee', state: 'FL', region: 'Northwest Florida' },
  '863': { areaCode: '863', location: 'Lakeland', state: 'FL', region: 'Central Florida' },
  '904': { areaCode: '904', location: 'Jacksonville', state: 'FL', region: 'Northeast Florida' },
  '941': { areaCode: '941', location: 'Sarasota', state: 'FL', region: 'Southwest Florida' },
  '954': { areaCode: '954', location: 'Fort Lauderdale', state: 'FL', region: 'South Florida' },
  
  // Illinois
  '217': { areaCode: '217', location: 'Springfield', state: 'IL', region: 'Central Illinois' },
  '224': { areaCode: '224', location: 'Evanston', state: 'IL', region: 'Chicago Metro' },
  '309': { areaCode: '309', location: 'Peoria', state: 'IL', region: 'Central Illinois' },
  '312': { areaCode: '312', location: 'Chicago', state: 'IL', region: 'Chicago' },
  '331': { areaCode: '331', location: 'Aurora', state: 'IL', region: 'Chicago Metro' },
  '618': { areaCode: '618', location: 'Carbondale', state: 'IL', region: 'Southern Illinois' },
  '630': { areaCode: '630', location: 'Aurora', state: 'IL', region: 'Chicago Metro' },
  '708': { areaCode: '708', location: 'Cicero', state: 'IL', region: 'Chicago Metro' },
  '773': { areaCode: '773', location: 'Chicago', state: 'IL', region: 'Chicago' },
  '779': { areaCode: '779', location: 'Rockford', state: 'IL', region: 'Northern Illinois' },
  '815': { areaCode: '815', location: 'Rockford', state: 'IL', region: 'Northern Illinois' },
  '847': { areaCode: '847', location: 'Evanston', state: 'IL', region: 'Chicago Metro' },
  '872': { areaCode: '872', location: 'Chicago', state: 'IL', region: 'Chicago' },
  
  // Pennsylvania
  '215': { areaCode: '215', location: 'Philadelphia', state: 'PA', region: 'Philadelphia Metro' },
  '267': { areaCode: '267', location: 'Philadelphia', state: 'PA', region: 'Philadelphia Metro' },
  '272': { areaCode: '272', location: 'Scranton', state: 'PA', region: 'Northeast Pennsylvania' },
  '412': { areaCode: '412', location: 'Pittsburgh', state: 'PA', region: 'Western Pennsylvania' },
  '445': { areaCode: '445', location: 'Philadelphia', state: 'PA', region: 'Philadelphia Metro' },
  '484': { areaCode: '484', location: 'Allentown', state: 'PA', region: 'Lehigh Valley' },
  '570': { areaCode: '570', location: 'Scranton', state: 'PA', region: 'Northeast Pennsylvania' },
  '610': { areaCode: '610', location: 'Allentown', state: 'PA', region: 'Lehigh Valley' },
  '717': { areaCode: '717', location: 'Harrisburg', state: 'PA', region: 'Central Pennsylvania' },
  '724': { areaCode: '724', location: 'Washington', state: 'PA', region: 'Western Pennsylvania' },
  '814': { areaCode: '814', location: 'Erie', state: 'PA', region: 'Northwest Pennsylvania' },
  '878': { areaCode: '878', location: 'Pittsburgh', state: 'PA', region: 'Western Pennsylvania' },
  
  // Ohio
  '216': { areaCode: '216', location: 'Cleveland', state: 'OH', region: 'Northeast Ohio' },
  '220': { areaCode: '220', location: 'Columbus', state: 'OH', region: 'Central Ohio' },
  '234': { areaCode: '234', location: 'Akron', state: 'OH', region: 'Northeast Ohio' },
  '283': { areaCode: '283', location: 'Cincinnati', state: 'OH', region: 'Southwest Ohio' },
  '330': { areaCode: '330', location: 'Akron', state: 'OH', region: 'Northeast Ohio' },
  '380': { areaCode: '380', location: 'Columbus', state: 'OH', region: 'Central Ohio' },
  '419': { areaCode: '419', location: 'Toledo', state: 'OH', region: 'Northwest Ohio' },
  '440': { areaCode: '440', location: 'Cleveland', state: 'OH', region: 'Northeast Ohio' },
  '513': { areaCode: '513', location: 'Cincinnati', state: 'OH', region: 'Southwest Ohio' },
  '567': { areaCode: '567', location: 'Toledo', state: 'OH', region: 'Northwest Ohio' },
  '614': { areaCode: '614', location: 'Columbus', state: 'OH', region: 'Central Ohio' },
  '740': { areaCode: '740', location: 'Zanesville', state: 'OH', region: 'Southeast Ohio' },
  '937': { areaCode: '937', location: 'Dayton', state: 'OH', region: 'Southwest Ohio' },
  
  // Georgia
  '229': { areaCode: '229', location: 'Albany', state: 'GA', region: 'Southwest Georgia' },
  '404': { areaCode: '404', location: 'Atlanta', state: 'GA', region: 'Metro Atlanta' },
  '470': { areaCode: '470', location: 'Atlanta', state: 'GA', region: 'Metro Atlanta' },
  '478': { areaCode: '478', location: 'Macon', state: 'GA', region: 'Central Georgia' },
  '678': { areaCode: '678', location: 'Atlanta', state: 'GA', region: 'Metro Atlanta' },
  '706': { areaCode: '706', location: 'Columbus', state: 'GA', region: 'West Georgia' },
  '762': { areaCode: '762', location: 'Columbus', state: 'GA', region: 'West Georgia' },
  '770': { areaCode: '770', location: 'Marietta', state: 'GA', region: 'Metro Atlanta' },
  '912': { areaCode: '912', location: 'Savannah', state: 'GA', region: 'Coastal Georgia' },
  
  // North Carolina
  '252': { areaCode: '252', location: 'Greenville', state: 'NC', region: 'Eastern North Carolina' },
  '336': { areaCode: '336', location: 'Greensboro', state: 'NC', region: 'Piedmont Triad' },
  '704': { areaCode: '704', location: 'Charlotte', state: 'NC', region: 'Metro Charlotte' },
  '743': { areaCode: '743', location: 'Greensboro', state: 'NC', region: 'Piedmont Triad' },
  '828': { areaCode: '828', location: 'Asheville', state: 'NC', region: 'Western North Carolina' },
  '910': { areaCode: '910', location: 'Fayetteville', state: 'NC', region: 'Southeast North Carolina' },
  '919': { areaCode: '919', location: 'Raleigh', state: 'NC', region: 'Research Triangle' },
  '980': { areaCode: '980', location: 'Charlotte', state: 'NC', region: 'Metro Charlotte' },
  '984': { areaCode: '984', location: 'Raleigh', state: 'NC', region: 'Research Triangle' },
  
  // Michigan
  '231': { areaCode: '231', location: 'Muskegon', state: 'MI', region: 'West Michigan' },
  '248': { areaCode: '248', location: 'Troy', state: 'MI', region: 'Metro Detroit' },
  '269': { areaCode: '269', location: 'Kalamazoo', state: 'MI', region: 'Southwest Michigan' },
  '313': { areaCode: '313', location: 'Detroit', state: 'MI', region: 'Metro Detroit' },
  '517': { areaCode: '517', location: 'Lansing', state: 'MI', region: 'Mid-Michigan' },
  '586': { areaCode: '586', location: 'Warren', state: 'MI', region: 'Metro Detroit' },
  '616': { areaCode: '616', location: 'Grand Rapids', state: 'MI', region: 'West Michigan' },
  '734': { areaCode: '734', location: 'Ann Arbor', state: 'MI', region: 'Southeast Michigan' },
  '810': { areaCode: '810', location: 'Flint', state: 'MI', region: 'Mid-Michigan' },
  '906': { areaCode: '906', location: 'Marquette', state: 'MI', region: 'Upper Peninsula' },
  '947': { areaCode: '947', location: 'Troy', state: 'MI', region: 'Metro Detroit' },
  '989': { areaCode: '989', location: 'Saginaw', state: 'MI', region: 'Mid-Michigan' },
  
  // New Jersey
  '201': { areaCode: '201', location: 'Jersey City', state: 'NJ', region: 'North Jersey' },
  '551': { areaCode: '551', location: 'Jersey City', state: 'NJ', region: 'North Jersey' },
  '609': { areaCode: '609', location: 'Trenton', state: 'NJ', region: 'Central Jersey' },
  '640': { areaCode: '640', location: 'Trenton', state: 'NJ', region: 'Central Jersey' },
  '732': { areaCode: '732', location: 'New Brunswick', state: 'NJ', region: 'Central Jersey' },
  '848': { areaCode: '848', location: 'New Brunswick', state: 'NJ', region: 'Central Jersey' },
  '856': { areaCode: '856', location: 'Camden', state: 'NJ', region: 'South Jersey' },
  '862': { areaCode: '862', location: 'Newark', state: 'NJ', region: 'North Jersey' },
  '908': { areaCode: '908', location: 'Elizabeth', state: 'NJ', region: 'North Jersey' },
  '973': { areaCode: '973', location: 'Newark', state: 'NJ', region: 'North Jersey' },
  
  // Virginia
  '276': { areaCode: '276', location: 'Martinsville', state: 'VA', region: 'Southwest Virginia' },
  '434': { areaCode: '434', location: 'Lynchburg', state: 'VA', region: 'Central Virginia' },
  '540': { areaCode: '540', location: 'Roanoke', state: 'VA', region: 'Southwest Virginia' },
  '571': { areaCode: '571', location: 'Arlington', state: 'VA', region: 'Northern Virginia' },
  '703': { areaCode: '703', location: 'Arlington', state: 'VA', region: 'Northern Virginia' },
  '757': { areaCode: '757', location: 'Norfolk', state: 'VA', region: 'Hampton Roads' },
  '804': { areaCode: '804', location: 'Richmond', state: 'VA', region: 'Central Virginia' },
  
  // Washington
  '206': { areaCode: '206', location: 'Seattle', state: 'WA', region: 'Puget Sound' },
  '253': { areaCode: '253', location: 'Tacoma', state: 'WA', region: 'Puget Sound' },
  '360': { areaCode: '360', location: 'Olympia', state: 'WA', region: 'Southwest Washington' },
  '425': { areaCode: '425', location: 'Bellevue', state: 'WA', region: 'Puget Sound' },
  '509': { areaCode: '509', location: 'Spokane', state: 'WA', region: 'Eastern Washington' },
  '564': { areaCode: '564', location: 'Bellingham', state: 'WA', region: 'Northwest Washington' },
  
  // Arizona
  '480': { areaCode: '480', location: 'Mesa', state: 'AZ', region: 'Phoenix Metro' },
  '520': { areaCode: '520', location: 'Tucson', state: 'AZ', region: 'Southern Arizona' },
  '602': { areaCode: '602', location: 'Phoenix', state: 'AZ', region: 'Phoenix Metro' },
  '623': { areaCode: '623', location: 'Glendale', state: 'AZ', region: 'Phoenix Metro' },
  '928': { areaCode: '928', location: 'Flagstaff', state: 'AZ', region: 'Northern Arizona' },
  
  // Massachusetts
  '339': { areaCode: '339', location: 'Boston', state: 'MA', region: 'Greater Boston' },
  '351': { areaCode: '351', location: 'Lowell', state: 'MA', region: 'Greater Boston' },
  '413': { areaCode: '413', location: 'Springfield', state: 'MA', region: 'Western Massachusetts' },
  '508': { areaCode: '508', location: 'Worcester', state: 'MA', region: 'Central Massachusetts' },
  '617': { areaCode: '617', location: 'Boston', state: 'MA', region: 'Greater Boston' },
  '774': { areaCode: '774', location: 'Worcester', state: 'MA', region: 'Central Massachusetts' },
  '781': { areaCode: '781', location: 'Boston', state: 'MA', region: 'Greater Boston' },
  '857': { areaCode: '857', location: 'Boston', state: 'MA', region: 'Greater Boston' },
  '978': { areaCode: '978', location: 'Lowell', state: 'MA', region: 'Greater Boston' },
  
  // Indiana
  '219': { areaCode: '219', location: 'Gary', state: 'IN', region: 'Northwest Indiana' },
  '260': { areaCode: '260', location: 'Fort Wayne', state: 'IN', region: 'Northeast Indiana' },
  '317': { areaCode: '317', location: 'Indianapolis', state: 'IN', region: 'Central Indiana' },
  '463': { areaCode: '463', location: 'Indianapolis', state: 'IN', region: 'Central Indiana' },
  '574': { areaCode: '574', location: 'South Bend', state: 'IN', region: 'North Central Indiana' },
  '765': { areaCode: '765', location: 'Muncie', state: 'IN', region: 'East Central Indiana' },
  '812': { areaCode: '812', location: 'Evansville', state: 'IN', region: 'Southwest Indiana' },
  '930': { areaCode: '930', location: 'New Albany', state: 'IN', region: 'Southern Indiana' },
  
  // Missouri
  '314': { areaCode: '314', location: 'St. Louis', state: 'MO', region: 'Greater St. Louis' },
  '417': { areaCode: '417', location: 'Springfield', state: 'MO', region: 'Southwest Missouri' },
  '557': { areaCode: '557', location: 'St. Louis', state: 'MO', region: 'Greater St. Louis' },
  '573': { areaCode: '573', location: 'Columbia', state: 'MO', region: 'Central Missouri' },
  '636': { areaCode: '636', location: 'St. Charles', state: 'MO', region: 'Greater St. Louis' },
  '660': { areaCode: '660', location: 'Sedalia', state: 'MO', region: 'Central Missouri' },
  '816': { areaCode: '816', location: 'Kansas City', state: 'MO', region: 'Greater Kansas City' },
  
  // Maryland
  '240': { areaCode: '240', location: 'Frederick', state: 'MD', region: 'Western Maryland' },
  '301': { areaCode: '301', location: 'Frederick', state: 'MD', region: 'Western Maryland' },
  '410': { areaCode: '410', location: 'Baltimore', state: 'MD', region: 'Central Maryland' },
  '443': { areaCode: '443', location: 'Baltimore', state: 'MD', region: 'Central Maryland' },
  '667': { areaCode: '667', location: 'Baltimore', state: 'MD', region: 'Central Maryland' },
  
  // Wisconsin
  '262': { areaCode: '262', location: 'Kenosha', state: 'WI', region: 'Southeast Wisconsin' },
  '414': { areaCode: '414', location: 'Milwaukee', state: 'WI', region: 'Southeast Wisconsin' },
  '534': { areaCode: '534', location: 'Eau Claire', state: 'WI', region: 'Western Wisconsin' },
  '608': { areaCode: '608', location: 'Madison', state: 'WI', region: 'South Central Wisconsin' },
  '715': { areaCode: '715', location: 'Eau Claire', state: 'WI', region: 'Western Wisconsin' },
  '920': { areaCode: '920', location: 'Green Bay', state: 'WI', region: 'Northeast Wisconsin' },
  
  // Colorado
  '303': { areaCode: '303', location: 'Denver', state: 'CO', region: 'Denver Metro' },
  '719': { areaCode: '719', location: 'Colorado Springs', state: 'CO', region: 'Southern Colorado' },
  '720': { areaCode: '720', location: 'Denver', state: 'CO', region: 'Denver Metro' },
  '970': { areaCode: '970', location: 'Fort Collins', state: 'CO', region: 'Northern Colorado' },
  
  // Minnesota
  '218': { areaCode: '218', location: 'Duluth', state: 'MN', region: 'Northeast Minnesota' },
  '320': { areaCode: '320', location: 'St. Cloud', state: 'MN', region: 'Central Minnesota' },
  '507': { areaCode: '507', location: 'Rochester', state: 'MN', region: 'Southeast Minnesota' },
  '612': { areaCode: '612', location: 'Minneapolis', state: 'MN', region: 'Twin Cities' },
  '651': { areaCode: '651', location: 'St. Paul', state: 'MN', region: 'Twin Cities' },
  '763': { areaCode: '763', location: 'Minneapolis', state: 'MN', region: 'Twin Cities' },
  '952': { areaCode: '952', location: 'Minneapolis', state: 'MN', region: 'Twin Cities' },
  
  // South Carolina
  '803': { areaCode: '803', location: 'Columbia', state: 'SC', region: 'Central South Carolina' },
  '843': { areaCode: '843', location: 'Charleston', state: 'SC', region: 'Lowcountry' },
  '854': { areaCode: '854', location: 'Charleston', state: 'SC', region: 'Lowcountry' },
  '864': { areaCode: '864', location: 'Greenville', state: 'SC', region: 'Upstate' },
  
  // Alabama
  '205': { areaCode: '205', location: 'Birmingham', state: 'AL', region: 'Central Alabama' },
  '251': { areaCode: '251', location: 'Mobile', state: 'AL', region: 'South Alabama' },
  '256': { areaCode: '256', location: 'Huntsville', state: 'AL', region: 'North Alabama' },
  '334': { areaCode: '334', location: 'Montgomery', state: 'AL', region: 'Central Alabama' },
  '659': { areaCode: '659', location: 'Birmingham', state: 'AL', region: 'Central Alabama' },
  '938': { areaCode: '938', location: 'Huntsville', state: 'AL', region: 'North Alabama' },
  
  // Louisiana
  '225': { areaCode: '225', location: 'Baton Rouge', state: 'LA', region: 'Capital Region' },
  '318': { areaCode: '318', location: 'Shreveport', state: 'LA', region: 'Northwest Louisiana' },
  '337': { areaCode: '337', location: 'Lafayette', state: 'LA', region: 'Acadiana' },
  '504': { areaCode: '504', location: 'New Orleans', state: 'LA', region: 'Greater New Orleans' },
  '985': { areaCode: '985', location: 'Hammond', state: 'LA', region: 'Northshore' },
  
  // Kentucky
  '270': { areaCode: '270', location: 'Bowling Green', state: 'KY', region: 'Western Kentucky' },
  '364': { areaCode: '364', location: 'Owensboro', state: 'KY', region: 'Western Kentucky' },
  '502': { areaCode: '502', location: 'Louisville', state: 'KY', region: 'Louisville Metro' },
  '606': { areaCode: '606', location: 'Ashland', state: 'KY', region: 'Eastern Kentucky' },
  '859': { areaCode: '859', location: 'Lexington', state: 'KY', region: 'Bluegrass Region' },
  
  // Oregon
  '458': { areaCode: '458', location: 'Eugene', state: 'OR', region: 'Willamette Valley' },
  '503': { areaCode: '503', location: 'Portland', state: 'OR', region: 'Portland Metro' },
  '541': { areaCode: '541', location: 'Eugene', state: 'OR', region: 'Willamette Valley' },
  '971': { areaCode: '971', location: 'Portland', state: 'OR', region: 'Portland Metro' },
  
  // Oklahoma
  '405': { areaCode: '405', location: 'Oklahoma City', state: 'OK', region: 'Central Oklahoma' },
  '539': { areaCode: '539', location: 'Tulsa', state: 'OK', region: 'Northeast Oklahoma' },
  '580': { areaCode: '580', location: 'Lawton', state: 'OK', region: 'Southwest Oklahoma' },
  '918': { areaCode: '918', location: 'Tulsa', state: 'OK', region: 'Northeast Oklahoma' },
  
  // Connecticut
  '203': { areaCode: '203', location: 'Bridgeport', state: 'CT', region: 'Southwest Connecticut' },
  '475': { areaCode: '475', location: 'Bridgeport', state: 'CT', region: 'Southwest Connecticut' },
  '860': { areaCode: '860', location: 'Hartford', state: 'CT', region: 'Central Connecticut' },
  '959': { areaCode: '959', location: 'Hartford', state: 'CT', region: 'Central Connecticut' },
  
  // Iowa
  '319': { areaCode: '319', location: 'Cedar Rapids', state: 'IA', region: 'Eastern Iowa' },
  '515': { areaCode: '515', location: 'Des Moines', state: 'IA', region: 'Central Iowa' },
  '563': { areaCode: '563', location: 'Davenport', state: 'IA', region: 'Eastern Iowa' },
  '641': { areaCode: '641', location: 'Mason City', state: 'IA', region: 'North Central Iowa' },
  '712': { areaCode: '712', location: 'Sioux City', state: 'IA', region: 'Western Iowa' },
  
  // Mississippi
  '228': { areaCode: '228', location: 'Gulfport', state: 'MS', region: 'Mississippi Gulf Coast' },
  '601': { areaCode: '601', location: 'Jackson', state: 'MS', region: 'Central Mississippi' },
  '662': { areaCode: '662', location: 'Tupelo', state: 'MS', region: 'Northeast Mississippi' },
  '769': { areaCode: '769', location: 'Jackson', state: 'MS', region: 'Central Mississippi' },
  
  // Arkansas
  '479': { areaCode: '479', location: 'Fort Smith', state: 'AR', region: 'Western Arkansas' },
  '501': { areaCode: '501', location: 'Little Rock', state: 'AR', region: 'Central Arkansas' },
  '870': { areaCode: '870', location: 'Jonesboro', state: 'AR', region: 'Northeast Arkansas' },
  
  // Kansas
  '316': { areaCode: '316', location: 'Wichita', state: 'KS', region: 'South Central Kansas' },
  '620': { areaCode: '620', location: 'Hutchinson', state: 'KS', region: 'South Central Kansas' },
  '785': { areaCode: '785', location: 'Topeka', state: 'KS', region: 'Northeast Kansas' },
  '913': { areaCode: '913', location: 'Kansas City', state: 'KS', region: 'Greater Kansas City' },
  
  // Utah
  '385': { areaCode: '385', location: 'Salt Lake City', state: 'UT', region: 'Wasatch Front' },
  '435': { areaCode: '435', location: 'Logan', state: 'UT', region: 'Northern Utah' },
  '801': { areaCode: '801', location: 'Salt Lake City', state: 'UT', region: 'Wasatch Front' },
  
  // Nevada
  '702': { areaCode: '702', location: 'Las Vegas', state: 'NV', region: 'Southern Nevada' },
  '725': { areaCode: '725', location: 'Las Vegas', state: 'NV', region: 'Southern Nevada' },
  '775': { areaCode: '775', location: 'Reno', state: 'NV', region: 'Northern Nevada' },
  
  // New Mexico
  '505': { areaCode: '505', location: 'Albuquerque', state: 'NM', region: 'Central New Mexico' },
  '575': { areaCode: '575', location: 'Las Cruces', state: 'NM', region: 'Southern New Mexico' },
  
  // West Virginia
  '304': { areaCode: '304', location: 'Charleston', state: 'WV', region: 'Central West Virginia' },
  '681': { areaCode: '681', location: 'Charleston', state: 'WV', region: 'Central West Virginia' },
  
  // Nebraska
  '308': { areaCode: '308', location: 'North Platte', state: 'NE', region: 'Western Nebraska' },
  '402': { areaCode: '402', location: 'Omaha', state: 'NE', region: 'Eastern Nebraska' },
  '531': { areaCode: '531', location: 'Omaha', state: 'NE', region: 'Eastern Nebraska' },
  
  // Idaho
  '208': { areaCode: '208', location: 'Boise', state: 'ID', region: 'Southwest Idaho' },
  '986': { areaCode: '986', location: 'Coeur d\'Alene', state: 'ID', region: 'Northern Idaho' },
  
  // Hawaii
  '808': { areaCode: '808', location: 'Honolulu', state: 'HI', region: 'Hawaii' },
  
  // New Hampshire
  '603': { areaCode: '603', location: 'Manchester', state: 'NH', region: 'New Hampshire' },
  
  // Maine
  '207': { areaCode: '207', location: 'Portland', state: 'ME', region: 'Maine' },
  
  // Rhode Island
  '401': { areaCode: '401', location: 'Providence', state: 'RI', region: 'Rhode Island' },
  
  // Montana
  '406': { areaCode: '406', location: 'Billings', state: 'MT', region: 'Montana' },
  
  // Delaware
  '302': { areaCode: '302', location: 'Wilmington', state: 'DE', region: 'Delaware' },
  
  // South Dakota
  '605': { areaCode: '605', location: 'Sioux Falls', state: 'SD', region: 'South Dakota' },
  
  // North Dakota
  '701': { areaCode: '701', location: 'Fargo', state: 'ND', region: 'North Dakota' },
  
  // Alaska
  '907': { areaCode: '907', location: 'Anchorage', state: 'AK', region: 'Alaska' },
  
  // Vermont
  '802': { areaCode: '802', location: 'Burlington', state: 'VT', region: 'Vermont' },
  
  // Wyoming
  '307': { areaCode: '307', location: 'Cheyenne', state: 'WY', region: 'Wyoming' },
  
  // District of Columbia
  '202': { areaCode: '202', location: 'Washington', state: 'DC', region: 'District of Columbia' },
};

/**
 * Extract area code from a phone number
 * @param phoneNumber - Phone number in any format
 * @returns Area code string or null if not found
 */
export function extractAreaCode(phoneNumber: string | null | undefined): string | null {
  if (!phoneNumber) return null;
  
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  
  // Handle US numbers (10 digits) or international with country code (11+ digits starting with 1)
  if (digits.length >= 10) {
    // If it starts with 1, skip it (country code)
    const startIndex = digits.length === 11 && digits[0] === '1' ? 1 : 0;
    const areaCode = digits.substring(startIndex, startIndex + 3);
    
    // Validate area code (must be 3 digits, first digit 2-9, second digit 0-9, third digit 0-9)
    if (areaCode.length === 3 && /^[2-9]\d{2}$/.test(areaCode)) {
      return areaCode;
    }
  }
  
  return null;
}

/**
 * Get location information for an area code
 * @param areaCode - 3-digit area code
 * @returns AreaCodeInfo object or null if not found
 */
export function getAreaCodeInfo(areaCode: string | null | undefined): AreaCodeInfo | null {
  if (!areaCode) return null;
  
  // Normalize area code (remove non-digits, take first 3 digits)
  const normalized = areaCode.replace(/\D/g, '').substring(0, 3);
  
  if (normalized.length !== 3) return null;
  
  return AREA_CODE_MAP[normalized] || null;
}

/**
 * Get location string for a phone number
 * @param phoneNumber - Phone number in any format
 * @returns Formatted location string (e.g., "Bakersfield, CA") or null
 */
export function getPhoneLocation(phoneNumber: string | null | undefined): string | null {
  const areaCode = extractAreaCode(phoneNumber);
  if (!areaCode) return null;
  
  const info = getAreaCodeInfo(areaCode);
  if (!info) return null;
  
  return `${info.location}, ${info.state}`;
}

/**
 * Get full area code information for a phone number
 * @param phoneNumber - Phone number in any format
 * @returns AreaCodeInfo object or null
 */
export function getPhoneAreaCodeInfo(phoneNumber: string | null | undefined): AreaCodeInfo | null {
  const areaCode = extractAreaCode(phoneNumber);
  if (!areaCode) return null;
  
  return getAreaCodeInfo(areaCode);
}

