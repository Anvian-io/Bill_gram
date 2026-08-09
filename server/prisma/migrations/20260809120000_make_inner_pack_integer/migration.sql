-- Convert existing inner_pack values to integer-compatible values.
-- Note: this avoids creating a replacement table.
UPDATE "products"
SET "inner_pack" = CASE
  WHEN "inner_pack" IS NULL OR "inner_pack" = '' THEN NULL
  ELSE CAST("inner_pack" AS INTEGER)
END;
