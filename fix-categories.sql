-- Fix existing categories by setting default icon and color values
UPDATE categories SET icon = '🏠' WHERE icon IS NULL;
UPDATE categories SET color = '#3498db' WHERE color IS NULL;

-- Now alter the columns to make them NOT NULL
ALTER TABLE categories ALTER COLUMN "imageUrl" DROP NOT NULL;
ALTER TABLE categories ALTER COLUMN "type" DROP NOT NULL;
ALTER TABLE categories ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE categories ALTER COLUMN "icon" SET NOT NULL;
ALTER TABLE categories ALTER COLUMN "color" SET NOT NULL; 