-- ============================================
-- Add popular routes with correct column names
-- ============================================

-- Get city IDs and create routes
DO $$
DECLARE
  yangon_id UUID;
  mandalay_id UUID;
  naypyitaw_id UUID;
  bagan_id UUID;
  taunggyi_id UUID;
  mawlamyine_id UUID;
  pathein_id UUID;
  pyin_oolwin_id UUID;
  inle_id UUID;
  kalaw_id UUID;
  tachileik_id UUID;
  lashio_id UUID;
  monywa_id UUID;
  pyay_id UUID;
  bago_id UUID;
  taungoo_id UUID;
  dawei_id UUID;
  hpaan_id UUID;
  myitkyina_id UUID;
  sitwe_id UUID;
  loikaw_id UUID;
BEGIN
  -- Get city IDs
  SELECT id INTO yangon_id FROM cities WHERE name LIKE 'Yangon%' LIMIT 1;
  SELECT id INTO mandalay_id FROM cities WHERE name LIKE 'Mandalay%' LIMIT 1;
  SELECT id INTO naypyitaw_id FROM cities WHERE name LIKE 'Naypyitaw%' LIMIT 1;
  SELECT id INTO bagan_id FROM cities WHERE name LIKE 'Bagan%' LIMIT 1;
  SELECT id INTO taunggyi_id FROM cities WHERE name = 'Taunggyi' LIMIT 1;
  SELECT id INTO mawlamyine_id FROM cities WHERE name = 'Mawlamyine' LIMIT 1;
  SELECT id INTO pathein_id FROM cities WHERE name = 'Pathein' LIMIT 1;
  SELECT id INTO pyin_oolwin_id FROM cities WHERE name = 'Pyin Oo Lwin' LIMIT 1;
  SELECT id INTO kalaw_id FROM cities WHERE name = 'Kalaw' LIMIT 1;
  SELECT id INTO tachileik_id FROM cities WHERE name = 'Tachileik' LIMIT 1;
  SELECT id INTO lashio_id FROM cities WHERE name = 'Lashio' LIMIT 1;
  SELECT id INTO monywa_id FROM cities WHERE name = 'Monywa' LIMIT 1;
  SELECT id INTO pyay_id FROM cities WHERE name = 'Pyay' LIMIT 1;
  SELECT id INTO bago_id FROM cities WHERE name = 'Bago' LIMIT 1;
  SELECT id INTO taungoo_id FROM cities WHERE name = 'Taungoo' LIMIT 1;
  SELECT id INTO dawei_id FROM cities WHERE name = 'Dawei' LIMIT 1;
  SELECT id INTO hpaan_id FROM cities WHERE name LIKE 'Hpa%' LIMIT 1;
  SELECT id INTO myitkyina_id FROM cities WHERE name = 'Myitkyina' LIMIT 1;
  SELECT id INTO sitwe_id FROM cities WHERE name = 'Sittwe' LIMIT 1;
  SELECT id INTO loikaw_id FROM cities WHERE name = 'Loikaw' LIMIT 1;
  
  -- Handle Inle (might be named differently)
  SELECT id INTO inle_id FROM cities WHERE name LIKE 'Inle%' OR name = 'Nyaung Shwe' LIMIT 1;

  -- Insert popular routes
  INSERT INTO routes (from_city_id, to_city_id, distance_km, estimated_duration_minutes, is_active)
  VALUES
    -- Yangon routes
    (yangon_id, mandalay_id, 580, 540, true),
    (mandalay_id, yangon_id, 580, 540, true),
    (yangon_id, naypyitaw_id, 320, 300, true),
    (naypyitaw_id, yangon_id, 320, 300, true),
    (yangon_id, bagan_id, 500, 480, true),
    (bagan_id, yangon_id, 500, 480, true),
    (yangon_id, taunggyi_id, 450, 420, true),
    (taunggyi_id, yangon_id, 450, 420, true),
    (yangon_id, mawlamyine_id, 300, 300, true),
    (mawlamyine_id, yangon_id, 300, 300, true),
    (yangon_id, pathein_id, 200, 240, true),
    (pathein_id, yangon_id, 200, 240, true),
    (yangon_id, pyay_id, 260, 270, true),
    (pyay_id, yangon_id, 260, 270, true),
    (yangon_id, bago_id, 80, 120, true),
    (bago_id, yangon_id, 80, 120, true),
    (yangon_id, taungoo_id, 180, 210, true),
    (taungoo_id, yangon_id, 180, 210, true),
    (yangon_id, dawei_id, 600, 600, true),
    (dawei_id, yangon_id, 600, 600, true),
    (yangon_id, hpaan_id, 250, 270, true),
    (hpaan_id, yangon_id, 250, 270, true),
    
    -- Mandalay routes
    (mandalay_id, bagan_id, 180, 180, true),
    (bagan_id, mandalay_id, 180, 180, true),
    (mandalay_id, pyin_oolwin_id, 70, 120, true),
    (pyin_oolwin_id, mandalay_id, 70, 120, true),
    (mandalay_id, monywa_id, 140, 150, true),
    (monywa_id, mandalay_id, 140, 150, true),
    (mandalay_id, lashio_id, 200, 240, true),
    (lashio_id, mandalay_id, 200, 240, true),
    (mandalay_id, taunggyi_id, 280, 300, true),
    (taunggyi_id, mandalay_id, 280, 300, true),
    
    -- Naypyitaw routes
    (naypyitaw_id, mandalay_id, 280, 270, true),
    (mandalay_id, naypyitaw_id, 280, 270, true),
    (naypyitaw_id, bagan_id, 200, 210, true),
    (bagan_id, naypyitaw_id, 200, 210, true),
    (naypyitaw_id, taunggyi_id, 200, 240, true),
    (taunggyi_id, naypyitaw_id, 200, 240, true),
    
    -- Shan State routes
    (taunggyi_id, inle_id, 40, 90, true),
    (inle_id, taunggyi_id, 40, 90, true),
    (taunggyi_id, kalaw_id, 50, 90, true),
    (kalaw_id, taunggyi_id, 50, 90, true),
    (taunggyi_id, tachileik_id, 450, 480, true),
    (tachileik_id, taunggyi_id, 450, 480, true)
  ON CONFLICT DO NOTHING;
END $$;