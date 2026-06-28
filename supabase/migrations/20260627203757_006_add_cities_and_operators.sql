-- ============================================
-- MM-BusTicket Pro - Complete Myanmar Cities and Operators
-- ============================================

-- Add all Myanmar cities (batch insert)
INSERT INTO cities (name, name_mm, is_popular)
VALUES
  -- Ayeyarwady Region
  ('Hinthada', 'ဟင်္သာတ', false),
  ('Myaungmya', 'မြောင်းမြ', false),
  ('Maubin', 'မအူပင်', false),
  ('Bogale', 'ဗိုလ်တထိုင်', false),
  ('Kyaiklat', 'ကျိုက်လတ်', false),
  
  -- Bago Region
  ('Shwegyin', 'ရွှေကျင်', false),
  ('Nyaunglebin', 'ညောင်လေးပင်', false),
  
  -- Magway Region
  ('Minbu', 'မင်းဘူး', false),
  ('Thayet', 'သရက်', false),
  ('Pakokku', 'ပခုက္ကူ', false),
  ('Gangaw', 'ဂန့်ဂေါ', false),
  ('Chauk', 'ချေါက်', false),
  ('Salin', 'ဆလင်း', false),
  
  -- Mandalay Region
  ('Kyaukse', 'ကျောက်ဆည်', false),
  ('Yamethin', 'ရမည်သင်', false),
  ('Myittha', 'မြိတ်သာ', false),
  
  -- Shan State
  ('Hsipaw', 'သီပေါ', false),
  ('Nyaung Shwe', 'ညောင်ရွှေ', false),
  ('Pindaya', 'ပင်းတယ', false),
  ('Muse', 'မူဆယ်', false),
  ('Nam Kham', 'နမ္မခမ်း', false),
  ('Kutkai', 'ကွတ်ခိုင်', false),
  ('Mongyai', 'မိုင်းရယ်', false),
  ('Mongla', 'မိုင်းလာ', false),
  
  -- Kayah State
  ('Loikaw', 'လွိုင်ကော်', false),
  ('Demoso', 'ဒီမိုဆို', false),
  
  -- Kayin State
  ('Myawaddy', 'မြဝတီ', false),
  ('Kawkareik', 'ကော့ကရိတ်', false),
  
  -- Mon State
  ('Thaton', 'သထုံ', false),
  ('Kyaik Hto', 'ကျိုက်ထို', false),
  ('Thanbyuzayat', 'သဗုဇရှစ်', false),
  ('Ye', 'ရေး', false),
  
  -- Tanintharyi Region
  ('Myeik', 'မြိတ်', false),
  ('Kawthaung', 'ကော့သောင်', false),
  
  -- Rakhine State
  ('Sittwe', 'စစ်တွေ', false),
  ('Kyaukpyu', 'ကျောက်ဖရား', false),
  ('Thandwe', 'သံတွဲ', false),
  ('Ngapali', 'ငပိုလီ', false),
  
  -- Chin State
  ('Hakha', 'ဟားခါး', false),
  ('Falam', 'ဖလမ်း', false),
  ('Mindat', 'မင်းတပ်', false),
  ('Matupi', 'မတူပီ', false),
  
  -- Kachin State
  ('Bhamo', 'ဗန်းမော်', false),
  ('Putao', 'ပူတာအို', false),
  ('Mogaung', 'မိုးကောင်း', false),
  
  -- Sagaing Region
  ('Katha', 'ကသာ', false),
  ('Kale', 'ကလေး', false),
  ('Kalewa', 'ကလေးဝ', false),
  ('Tamu', 'တမူး', false),
  ('Mawlaik', 'မော်လိုက်', false),
  ('Indaw', 'အင်းတော်', false),
  ('Pinlebu', 'ပင်လယ်ဗူး', false),
  
  -- Naypyitaw areas
  ('Pyinmana', 'ပျဉ်းမနား', false),
  ('Lewek', 'လယ်ဝေး', false)
ON CONFLICT (name) DO NOTHING;

-- Add more bus operators with Cloudinary logos
INSERT INTO operators (name, logo_url, description, is_active, contact_phone)
VALUES
  ('Shwe Kayar Express', 'https://res.cloudinary.com/innoveller/image/upload/v1726518352/operator-thumbnails/52.png', 'Premium VIP buses serving Yangon-Mandalay route.', true, '+95950000001'),
  ('Akarit Express', 'https://res.cloudinary.com/innoveller/image/upload/v1726518352/operator-thumbnails/44.png', 'Comfortable and reliable bus services across Myanmar.', true, '+95950000002'),
  ('Mya Sandar Express', 'https://res.cloudinary.com/innoveller/image/upload/v1726518352/operator-thumbnails/392.png', 'Trusted operator with modern fleet to Bagan and Inle.', true, '+95950000003'),
  ('Kyal Nann Taw Express', 'https://res.cloudinary.com/innoveller/image/upload/v1726518352/operator-thumbnails/48.png', 'Express services on Yangon-Mandalay and circular routes.', true, '+95950000004'),
  ('Elite Express', 'https://res.cloudinary.com/innoveller/image/upload/v1726518352/operator-thumbnails/206.png', 'Luxury VIP buses with premium amenities and WiFi.', true, '+95950000005'),
  ('Shwe Pyi Yadana', 'https://res.cloudinary.com/innoveller/image/upload/v1726518352/operator-thumbnails/398.png', 'Reliable and affordable bus services to all major cities.', true, '+95950000006'),
  ('Golden Country Express', 'https://res.cloudinary.com/innoveller/image/upload/v1726518352/operator-thumbnails/397.png', 'Connecting Yangon to Shan State and beyond.', true, '+95950000007'),
  ('Yoe Yar Express', 'https://res.cloudinary.com/innoveller/image/upload/v1726518352/operator-thumbnails/97.png', 'Popular choice for budget travelers across Myanmar.', true, '+95950000008'),
  ('Shwe Nadi', 'https://res.cloudinary.com/innoveller/image/upload/v1726518352/operator-thumbnails/31.png', 'Comfortable sleeper buses for overnight journeys.', true, '+95950000009'),
  ('Yatanarpaulin Express', 'https://res.cloudinary.com/innoveller/image/upload/v1726518352/operator-thumbnails/39.png', 'Established operator with extensive network coverage.', true, '+95950000010'),
  ('Mandalar Htun', 'https://res.cloudinary.com/innoveller/image/upload/v1726518352/operator-thumbnails/41.png', 'Serving Mandalay region and northern destinations.', true, '+95950000011'),
  ('Aung Yadana Express', 'https://res.cloudinary.com/innoveller/image/upload/v1726518352/operator-thumbnails/309.png', 'Quality service with experienced drivers.', true, '+95950000012'),
  ('Shwe Sin Set Kyar', 'https://res.cloudinary.com/innoveller/image/upload/v1726518352/operator-thumbnails/35.png', 'Popular overnight express to Bagan and Inle.', true, '+95950000013'),
  ('Five Star Express', 'https://res.cloudinary.com/innoveller/image/upload/v1726518352/operator-thumbnails/533.png', 'Five-star service on major routes.', true, '+95950000014')
ON CONFLICT DO NOTHING;