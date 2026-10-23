INSERT INTO cities (name, name_mm, is_popular) VALUES
  ('Yangon', 'ရန်ကုန်', true),
  ('Mandalay', 'မန္တလေး', true),
  ('Naypyidaw', 'နေပြည်တော်', true),
  ('Bagan', 'ပုဂံ', true),
  ('Taunggyi', 'တောင်ကြီး', false),
  ('Mawlamyine', 'မော်လမြိုင်', false),
  ('Pathein', 'ပုသိမ်', false)
ON CONFLICT (name) DO NOTHING;
