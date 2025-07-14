-- Geelong Garage Doors - Category Migration Script
-- This script will reorganize categories and migrate products

-- Step 1: Create new main categories
INSERT INTO categories (id, name, slug, description, sort_order, is_active) VALUES
-- Main Categories
(gen_random_uuid(), 'Garage Doors', 'garage-doors', 'Complete range of sectional, roller, and specialty garage doors for residential and commercial use', 10, true),
(gen_random_uuid(), 'Garage Door Openers', 'garage-door-openers', 'Automatic garage door openers including remote control units and drive systems', 20, true),
(gen_random_uuid(), 'Spare Parts & Accessories', 'spare-parts-accessories', 'Replacement parts, hardware, and accessories for garage doors and openers', 30, true),
(gen_random_uuid(), 'Remote Controls', 'remote-controls', 'Hand transmitters and remote control systems for garage door openers', 40, true),
(gen_random_uuid(), 'Clearance & Special Offers', 'clearance-special-offers', 'Discounted items, end-of-line products, and special deals', 50, true);

-- Step 2: Create subcategories
-- Get parent category IDs first
WITH parent_cats AS (
  SELECT id, name FROM categories WHERE name IN ('Garage Doors', 'Garage Door Openers', 'Spare Parts & Accessories', 'Remote Controls', 'Clearance & Special Offers')
)
INSERT INTO categories (id, name, slug, description, parent_id, sort_order, is_active) VALUES
-- Garage Doors subcategories
((SELECT id FROM parent_cats WHERE name = 'Garage Doors'), 'New Garage Doors', 'new-garage-doors', 'Brand new sectional and roller garage doors', 10, true),
((SELECT id FROM parent_cats WHERE name = 'Garage Doors'), 'Used & Clearance Doors', 'used-clearance-doors', 'Used, refurbished, and clearance garage doors', 20, true),

-- Garage Door Openers subcategories
((SELECT id FROM parent_cats WHERE name = 'Garage Door Openers'), 'New Openers', 'new-openers', 'New automatic garage door openers and control units', 10, true),
((SELECT id FROM parent_cats WHERE name = 'Garage Door Openers'), 'Used & Refurbished Openers', 'used-refurbished-openers', 'Used and professionally refurbished garage door openers', 20, true),

-- Spare Parts & Accessories subcategories
((SELECT id FROM parent_cats WHERE name = 'Spare Parts & Accessories'), 'Door Parts', 'door-parts', 'Hinges, springs, cables, panels, and hardware for garage doors', 10, true),
((SELECT id FROM parent_cats WHERE name = 'Spare Parts & Accessories'), 'Opener Parts', 'opener-parts', 'Motors, drives, chains, belts, and opener components', 20, true),
((SELECT id FROM parent_cats WHERE name = 'Spare Parts & Accessories'), 'Electronics & Controls', 'electronics-controls', 'Control boards, receivers, transmitters, and safety devices', 30, true),

-- Remote Controls subcategories
((SELECT id FROM parent_cats WHERE name = 'Remote Controls'), 'New Remote Controls', 'new-remote-controls', 'New hand transmitters and remote control systems', 10, true),
((SELECT id FROM parent_cats WHERE name = 'Remote Controls'), 'Used Remote Controls', 'used-remote-controls', 'Used and tested remote control units', 20, true),

-- Clearance subcategories
((SELECT id FROM parent_cats WHERE name = 'Clearance & Special Offers'), 'Door Clearance', 'door-clearance', 'Clearance and discounted garage doors', 10, true),
((SELECT id FROM parent_cats WHERE name = 'Clearance & Special Offers'), 'Parts Clearance', 'parts-clearance', 'Clearance spare parts and accessories', 20, true);

-- Step 3: Migration mapping for products
-- This shows which old categories should map to which new categories

-- Products to migrate to "New Garage Doors"
UPDATE products SET category_id = (
  SELECT id FROM categories WHERE slug = 'new-garage-doors'
) WHERE category_id IN (
  SELECT id FROM categories WHERE name = 'New Doors & Openers'
) AND (
  name ILIKE '%sectional%' OR 
  name ILIKE '%panelift%' OR 
  name ILIKE '%roller door%' OR 
  name ILIKE '%rollmasta%' OR
  (name ILIKE '%door%' AND name NOT ILIKE '%opener%' AND name NOT ILIKE '%remote%' AND name NOT ILIKE '%control%')
);

-- Products to migrate to "Used & Clearance Doors"
UPDATE products SET category_id = (
  SELECT id FROM categories WHERE slug = 'used-clearance-doors'
) WHERE category_id IN (
  SELECT id FROM categories WHERE name ILIKE '%clearance%sectional%' OR name ILIKE '%refurbished%door%'
) OR (
  name ILIKE '%clearance%' AND (name ILIKE '%door%' OR name ILIKE '%sectional%' OR name ILIKE '%roller%')
);

-- Products to migrate to "New Openers"
UPDATE products SET category_id = (
  SELECT id FROM categories WHERE slug = 'new-openers'
) WHERE category_id IN (
  SELECT id FROM categories WHERE name = 'New Doors & Openers'
) AND (
  name ILIKE '%gdo%' OR 
  name ILIKE '%remote control unit%' OR 
  name ILIKE '%opener%' OR
  name ILIKE '%drive%'
);

-- Products to migrate to "Used & Refurbished Openers"
UPDATE products SET category_id = (
  SELECT id FROM categories WHERE slug = 'used-refurbished-openers'
) WHERE (
  name ILIKE '%used%' AND (name ILIKE '%gdo%' OR name ILIKE '%opener%' OR name ILIKE '%control unit%')
) OR (
  name ILIKE '%reconditioned%' AND (name ILIKE '%drive%' OR name ILIKE '%opener%')
);

-- Products to migrate to "New Remote Controls"
UPDATE products SET category_id = (
  SELECT id FROM categories WHERE slug = 'new-remote-controls'
) WHERE category_id IN (
  SELECT id FROM categories WHERE name = 'Garage Remote Control'
) AND name NOT ILIKE '%used%' AND name NOT ILIKE '%pre-used%';

-- Products to migrate to "Used Remote Controls"
UPDATE products SET category_id = (
  SELECT id FROM categories WHERE slug = 'used-remote-controls'
) WHERE (
  name ILIKE '%used%' OR name ILIKE '%pre-used%'
) AND (
  name ILIKE '%transmitter%' OR name ILIKE '%remote%'
);

-- Products to migrate to "Door Parts"
UPDATE products SET category_id = (
  SELECT id FROM categories WHERE slug = 'door-parts'
) WHERE category_id IN (
  SELECT id FROM categories WHERE name ILIKE '%spare parts%'
) AND (
  name ILIKE '%hinge%' OR 
  name ILIKE '%spring%' OR 
  name ILIKE '%cable%' OR 
  name ILIKE '%panel%' OR 
  name ILIKE '%section%' OR
  name ILIKE '%bracket%' OR
  name ILIKE '%track%' OR
  name ILIKE '%roller%' OR
  name ILIKE '%sheave%' OR
  name ILIKE '%wheel%' OR
  name ILIKE '%pulley%'
);

-- Products to migrate to "Opener Parts"
UPDATE products SET category_id = (
  SELECT id FROM categories WHERE slug = 'opener-parts'
) WHERE category_id IN (
  SELECT id FROM categories WHERE name ILIKE '%spare parts%'
) AND (
  name ILIKE '%motor%' OR 
  name ILIKE '%drive%' OR 
  name ILIKE '%chain%' OR 
  name ILIKE '%belt%' OR 
  name ILIKE '%trolley%' OR
  name ILIKE '%sprocket%' OR
  name ILIKE '%gear%' OR
  name ILIKE '%coupling%'
);

-- Products to migrate to "Electronics & Controls"
UPDATE products SET category_id = (
  SELECT id FROM categories WHERE slug = 'electronics-controls'
) WHERE category_id IN (
  SELECT id FROM categories WHERE name ILIKE '%spare parts%'
) AND (
  name ILIKE '%control board%' OR 
  name ILIKE '%receiver%' OR 
  name ILIKE '%transmitter%' OR 
  name ILIKE '%circuit%' OR 
  name ILIKE '%electronic%' OR
  name ILIKE '%sensor%' OR
  name ILIKE '%safety%' OR
  name ILIKE '%limit switch%' OR
  name ILIKE '%acdc%'
);

-- Step 4: Handle clearance items
UPDATE products SET category_id = (
  SELECT id FROM categories WHERE slug = 'door-clearance'
) WHERE name ILIKE '%clearance%' AND (
  name ILIKE '%door%' OR name ILIKE '%sectional%' OR name ILIKE '%roller%'
);

UPDATE products SET category_id = (
  SELECT id FROM categories WHERE slug = 'parts-clearance'
) WHERE name ILIKE '%clearance%' AND NOT (
  name ILIKE '%door%' OR name ILIKE '%sectional%' OR name ILIKE '%roller%'
);

-- Step 5: Handle any remaining uncategorized products
-- Move remaining products from old categories to appropriate new ones
UPDATE products SET category_id = (
  SELECT id FROM categories WHERE slug = 'spare-parts-accessories'
) WHERE category_id IN (
  SELECT id FROM categories WHERE name = 'Uncategorized' OR name ILIKE '%uncategorized%'
);

-- Step 6: Verification queries (run these to check migration)
-- Check product distribution after migration
SELECT 
  c.name as category_name,
  c.slug,
  COUNT(p.id) as product_count
FROM categories c
LEFT JOIN products p ON c.id = p.category_id
WHERE c.is_active = true
GROUP BY c.id, c.name, c.slug
ORDER BY c.sort_order, c.name;

-- Check for products without categories
SELECT COUNT(*) as orphaned_products 
FROM products p 
LEFT JOIN categories c ON p.category_id = c.id 
WHERE c.id IS NULL;

-- Final cleanup - deactivate old categories (don't delete to preserve history)
UPDATE categories SET is_active = false WHERE name IN (
  'Clearance Garage Sectional/ Panelift',
  'Clearance Garage Sectional/ Panelift, Uncategorized',
  'New Doors & Openers',
  'New Garage Door Spare Parts & Opener Accessories',
  'New Garage Door Spare Parts & Opener Accessories, New Garage Door Spare Parts & Opener Accessories',
  'Refurbished / Clearance / Used Garage Door Spare Parts and Opener Accessories',
  'Refurbished / Clearance / Used Garage Door Spare Parts and Opener Accessories, Refurbished / Clearance / Used Garage Doors & Openers',
  'Refurbished / Clearance / Used Garage Door Spare Parts and Opener Accessories, Second Hand Discounted Parts',
  'Refurbished / Clearance / Used Garage Doors & Openers',
  'Refurbished Parts',
  'Uncategorized'
);

-- Keep only the new structure active
UPDATE categories SET is_active = true WHERE slug IN (
  'garage-doors', 'garage-door-openers', 'spare-parts-accessories', 'remote-controls', 'clearance-special-offers',
  'new-garage-doors', 'used-clearance-doors', 'new-openers', 'used-refurbished-openers',
  'door-parts', 'opener-parts', 'electronics-controls', 'new-remote-controls', 'used-remote-controls',
  'door-clearance', 'parts-clearance'
);