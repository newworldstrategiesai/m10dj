-- Import Top 100 Venues within 50 miles of Memphis
-- Paste this into Supabase SQL Editor
-- This will insert all 82 venues from your CSV file

-- Optional: Delete existing venues first (uncomment if you want to start fresh)
-- DELETE FROM preferred_venues WHERE city IN ('Memphis', 'Collierville', 'Cordova', 'Bartlett', 'Arlington', 'Eads', 'Southaven', 'Horn Lake', 'Nesbit', 'Lake Cormorant', 'Wilson', 'Como', 'Holly Springs', 'Hernando');

-- Update existing venues with correct addresses
UPDATE preferred_venues 
SET address = '12055 West Donelson Rd', venue_type = 'banquet_hall', venue_name = 'Orion Hill'
WHERE (venue_name ILIKE '%Orion Hill%' OR venue_name ILIKE '%Orion%') 
  AND city = 'Arlington' 
  AND state = 'TN';

UPDATE preferred_venues 
SET address = '8545 Collierville Arlington Rd'
WHERE venue_name = 'Southern Grace Weddings & Events' 
  AND city = 'Arlington' 
  AND state = 'TN';

INSERT INTO preferred_venues (venue_name, phone, email, address, city, state, zip_code, venue_type, capacity_min, capacity_max, is_active) VALUES
('The Peabody Hotel (Memphis)', '901-529-4000', NULL, '149 Union Ave.', 'Memphis', 'TN', '38103', 'hotel', 50, 400, true),
('Memphis Botanic Garden', '901-636-4100', NULL, '750 Cherry Rd', 'Memphis', 'TN', '38117', 'outdoor', 50, 300, true),
('Dixon Gallery and Gardens', '901-761-5250', NULL, '4339 Park Ave', 'Memphis', 'TN', '38117', 'historic', 30, 150, true),
('Woodruff-Fontaine House Museum', '901-272-4281', NULL, '680 Adams Ave', 'Memphis', 'TN', '38105', 'historic', 30, 100, true),
('The Atrium at Overton Square', '901-325-5959', NULL, '2015 Madison Ave #101', 'Memphis', 'TN', '38104', 'wedding', 50, 200, true),
('The Central Station Hotel', '901-522-4044', NULL, '545 S Main St', 'Memphis', 'TN', '38103', 'hotel', 50, 300, true),
('Avon Acres (Event Center)', '901-452-4789', NULL, '5049 Austin Peay Hwy', 'Memphis', 'TN', '38134', 'wedding', 50, 250, true),
('Memphis Brooks Museum of Art', '901-544-6200', NULL, '1934 Poplar Ave', 'Memphis', 'TN', '38104', 'historic', 50, 200, true),
('Graceland''s Chapel in the Woods', '901-332-2800', NULL, '3600 Elvis Presley Blvd', 'Memphis', 'TN', '38116', 'outdoor', 20, 80, true),
('Elmwood Cemetery', '901-774-3212', NULL, '824 S Dudley St', 'Memphis', 'TN', '38106', 'outdoor', 30, 150, true),
('Hi-Tone Café (event space)', '901-249-7838', NULL, '2715 Summer Ave', 'Memphis', 'TN', '38112', 'restaurant', 30, 100, true),
('Pink Palace Museum & Planetarium', '901-320-6327', NULL, '3050 Central Ave', 'Memphis', 'TN', '38111', 'historic', 50, 200, true),
('River Inn of Harbor Town', '901-881-8184', NULL, '347 S Front St', 'Memphis', 'TN', '38103', 'hotel', 50, 200, true),
('James Lee House', '901-274-2458', NULL, '239 Adams Ave', 'Memphis', 'TN', '38103', 'historic', 30, 100, true),
('FedEx Event Center at Shelby Farms', '901-222-3476', NULL, '4155 Ridgeway Rd', 'Memphis', 'TN', '38125', 'corporate', 100, 500, true),
('Orion Hill', '901-654-4809', NULL, '12055 West Donelson Rd', 'Arlington', 'TN', '38002', 'banquet_hall', 50, 300, true),
('Acre (restaurant/event space)', '901-504-1030', NULL, '1636 Madison Ave', 'Memphis', 'TN', '38104', 'restaurant', 30, 150, true),
('409 South Main', '901-584-0409', NULL, '409 S Main St', 'Memphis', 'TN', '38103', 'wedding', 50, 200, true),
('Balinese Ballroom', '901-327-5549', NULL, '117 N 2nd St', 'Memphis', 'TN', '38103', 'banquet_hall', 50, 300, true),
('Old Dominick Distillery', '901-866-2383', NULL, '3840 Summer Ave', 'Memphis', 'TN', '38122', 'restaurant', 50, 200, true),
('Grand Carousel Pavilion (Children''s Museum of Memphis)', '901-458-2678', NULL, '2525 Central Ave', 'Memphis', 'TN', '38104', 'wedding', 50, 200, true),
('The Cadre Building', '901-257-6077', NULL, '528 Monroe Ave', 'Memphis', 'TN', '38103', 'wedding', 50, 250, true),
('The Columns at One Commerce Square', '901-543-1155', NULL, '45 S Main St', 'Memphis', 'TN', '38103', 'corporate', 50, 300, true),
('Propcellar', '901-745-7990', NULL, '579 S Main St', 'Memphis', 'TN', '38103', 'wedding', 30, 150, true),
('Jack Robinson Gallery', '901-217-6777', NULL, '556 S Main St', 'Memphis', 'TN', '38103', 'wedding', 30, 100, true),
('Loflin Yard', '901-800-4774', NULL, '468 Tennessee St', 'Memphis', 'TN', '38126', 'outdoor', 50, 200, true),
('Wiseacre Brewing Company', '901-729-7110', NULL, '1576 Madison Ave', 'Memphis', 'TN', '38104', 'restaurant', 50, 200, true),
('Annesdale Mansion', '901-324-8884', NULL, '648 S Mendenhall Rd', 'Memphis', 'TN', '38117', 'historic', 50, 200, true),
('National Ornamental Metal Museum', '901-774-6380', NULL, '374 Metal Museum Dr', 'Memphis', 'TN', '38106', 'historic', 30, 150, true),
('Mallard''s Croft at Tate Farms', '662-393-5398', NULL, '799 E Tate Rd', 'Horn Lake', 'MS', '38637', 'outdoor', 50, 300, true),
('The Gin at Nesbit', '662-808-3939', NULL, '189 Tom Oyer Rd', 'Nesbit', 'MS', '38651', 'wedding', 50, 250, true),
('Hedge Farms & Events', '662-386-1768', NULL, '3225 Merlin Trce', 'Southaven', 'MS', '38672', 'outdoor', 50, 300, true),
('Arrive Hotel (Memphis Downtown)', '901-249-1830', NULL, '161 Union Ave', 'Memphis', 'TN', '38103', 'hotel', 50, 200, true),
('Hyatt Centric Beale Street Memphis', '901-649-1234', NULL, '169 Union Ave', 'Memphis', 'TN', '38103', 'hotel', 50, 300, true),
('The Memphian Hotel', '901-537-1414', NULL, '106 McLean Blvd', 'Memphis', 'TN', '38104', 'hotel', 50, 200, true),
('The Kent (Memphis)', '901-217-4000', NULL, '150 N 2nd St', 'Memphis', 'TN', '38103', 'hotel', 50, 200, true),
('Maple Grove Farm (Collierville)', '901-854-0291', NULL, '10641 S Houston Levee Rd', 'Collierville', 'TN', '38017', 'outdoor', 50, 300, true),
('Memphis National Golf Club', '901-853-9187', NULL, '116 Willow Grove Cir', 'Collierville', 'TN', '38017', 'country_club', 50, 300, true),
('The Quonset (Collierville)', '901-850-0531', NULL, '109 N Center St', 'Collierville', 'TN', '38017', 'wedding', 50, 200, true),
('D''LUXE Venue (Cordova)', '901-754-3097', NULL, '11224 Trinity Rd', 'Cordova', 'TN', '38016', 'wedding', 50, 250, true),
('Hilton Memphis', '901-362-9300', NULL, '939 Ridge Lake Blvd', 'Memphis', 'TN', '38120', 'hotel', 100, 500, true),
('Southern Grace Weddings & Events', '901-768-6354', NULL, '8545 Collierville Arlington Rd', 'Arlington', 'TN', '38002', 'banquet_hall', 50, 300, true),
('Green River Place', '662-266-1798', NULL, '770 Green River Lane', 'Lake Cormorant', 'MS', '38641', 'outdoor', 50, 250, true),
('The Grange at Wilson Gardens', '870-512-3008', NULL, '29421 Grange Rd', 'Wilson', 'AR', '72395', 'outdoor', 50, 300, true),
('Village of Wilson', '870-654-9850', NULL, '23728 Village Loop Rd', 'Wilson', 'AR', '72395', 'wedding', 50, 250, true),
('211 Main Hall & Gardens', '662-234-6211', NULL, '211 E Main St', 'Como', 'MS', '38619', 'wedding', 50, 200, true),
('Blackberry Pines', '662-252-9890', NULL, '13865 Goodman Rd', 'Holly Springs', 'MS', '38635', 'outdoor', 50, 250, true),
('Shelby Farms Park – Woodland Discovery Trail (event space)', NULL, NULL, '6903 Great View Dr', 'Memphis', 'TN', '38134', 'outdoor', 50, 200, true),
('Cedar Hall', '901-758-5000', NULL, '777 Butler Ave', 'Memphis', 'TN', '38133', 'wedding', 50, 250, true),
('Carahills Estate', '901-799-8880', NULL, '8403 Como Park Blvd', 'Cordova', 'TN', '38018', 'wedding', 50, 300, true),
('The Buckland Manor', '901-873-2882', NULL, '30 Snowden Ln', 'Eads', 'TN', '38028', 'historic', 50, 200, true),
('Colonial Country Club', '901-382-0533', NULL, '300 Colonial Trce', 'Memphis', 'TN', '38125', 'country_club', 50, 300, true),
('Banquet Halls of the Mid-South', '901-382-1000', NULL, '2758 Bartlett Blvd', 'Memphis', 'TN', '38134', 'banquet_hall', 50, 400, true),
('Tuscan Ridge', '901-610-6944', 'info.tuscanridge@gmail.com', '1701 Reid Hooker Rd', 'Eads', 'TN', '38028', 'wedding', 50, 250, true),
('Itta Bena (Alta Adams)', '901-726-1007', NULL, '143 Beale St', 'Memphis', 'TN', '38103', 'restaurant', 30, 100, true),
('Tin Roof Memphis', '901-526-6390', NULL, '152 Beale St', 'Memphis', 'TN', '38103', 'restaurant', 50, 200, true),
('Rock ''n'' Soul Museum', '901-205-2533', NULL, '191 Beale St', 'Memphis', 'TN', '38103', 'historic', 50, 200, true),
('Playhouse on the Square', '901-754-2600', NULL, '66 S Cooper St', 'Memphis', 'TN', '38104', 'wedding', 50, 200, true),
('Landers Center', '662-449-5000', NULL, '4560 Venture Dr', 'Southaven', 'MS', '38672', 'corporate', 200, 1000, true),
('Halloran Centre', '901-527-7529', NULL, '838 N 2nd St', 'Memphis', 'TN', '38105', 'wedding', 50, 300, true),
('DoubleTree by Hilton Memphis Downtown', '901-527-6464', NULL, '185 Union Ave', 'Memphis', 'TN', '38103', 'hotel', 50, 300, true),
('Memphis Zoo (Administration/Event Center)', '901-636-4703', NULL, '2000 Prentiss Pl', 'Memphis', 'TN', '38112', 'outdoor', 100, 500, true),
('Stax Museum of American Soul Music', '901-942-1250', NULL, '926 E McLemore Ave', 'Memphis', 'TN', '38106', 'historic', 50, 200, true),
('Chimes on Beale (Occasions Events)', '901-545-0500', NULL, '203 Beale St', 'Memphis', 'TN', '38103', 'wedding', 50, 200, true),
('Sheraton Memphis Downtown Hotel', '901-528-4000', NULL, '250 N Main St', 'Memphis', 'TN', '38103', 'hotel', 50, 400, true),
('Windyke Country Club', '901-385-8831', NULL, '3020 Brown Rd', 'Bartlett', 'TN', '38134', 'country_club', 50, 300, true),
('Historic Ann''s 1893', '901-382-8457', NULL, '6778 Stage Rd', 'Bartlett', 'TN', '38134', 'historic', 50, 200, true),
('The Magnolia Room', '901-382-4000', NULL, '7742 Stage Rd', 'Bartlett', 'TN', '38134', 'wedding', 50, 250, true),
('River Hall at the River Inn', '901-268-8500', NULL, '347 S Front St', 'Memphis', 'TN', '38103', 'wedding', 50, 200, true),
('Crowne Plaza Memphis Downtown', '901-260-0600', NULL, '300 N 2nd St', 'Memphis', 'TN', '38105', 'hotel', 50, 300, true),
('Grandstar Event Center', '662-892-6790', NULL, '700 Dr J C Taylor Blvd', 'Horn Lake', 'MS', '38637', 'banquet_hall', 50, 400, true),
('TPC Southwind (Golf Club)', '901-531-5610', NULL, '4500 Club Grounds Dr', 'Memphis', 'TN', '38125', 'country_club', 50, 300, true),
('Memphis Marriott East', '901-767-5610', NULL, '5795 Poplar Ave', 'Memphis', 'TN', '38119', 'hotel', 50, 400, true),
('Nail & Monkey (Liberty Ranch Hernando MS)', '662-531-6313', NULL, '2740 Pleasant Hill Rd', 'Hernando', 'MS', '38632', 'outdoor', 50, 250, true);

-- Note: If you run this multiple times, you may get duplicate venues.
-- To avoid duplicates, you can first check existing venues or delete them before running.
-- To check for existing venues: SELECT venue_name, city FROM preferred_venues WHERE city IN ('Memphis', 'Collierville', 'Cordova', 'Bartlett', 'Arlington', 'Eads', 'Southaven', 'Horn Lake', 'Nesbit', 'Lake Cormorant', 'Wilson', 'Como', 'Holly Springs', 'Hernando');

