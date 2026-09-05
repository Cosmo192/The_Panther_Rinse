WITH RECURSIVE machine_numbers(number) AS (
  SELECT 1
  UNION ALL
  SELECT number + 1 FROM machine_numbers WHERE number < 15
)
INSERT INTO machines (id, type, status, in_use_since, qr_token)
SELECT
  'washer_' || number,
  'washer',
  'free',
  NULL,
  lower(hex(randomblob(24)))
FROM machine_numbers;

WITH RECURSIVE machine_numbers(number) AS (
  SELECT 1
  UNION ALL
  SELECT number + 1 FROM machine_numbers WHERE number < 15
)
INSERT INTO machines (id, type, status, in_use_since, qr_token)
SELECT
  'dryer_' || number,
  'dryer',
  'free',
  NULL,
  lower(hex(randomblob(24)))
FROM machine_numbers;
