-- Add more operators with real logos
INSERT INTO operators (name, logo_url, description, contact_phone, is_active) VALUES
  ('Shwe Myanmar', 'https://res.cloudinary.com/innoveller/image/upload/v1726518352/operator-thumbnails/52.png', 'Premium express bus service across Myanmar with modern fleet', '+959123456789', true),
  ('Shwe Lun Pyan', 'https://res.cloudinary.com/innoveller/image/upload/v1726518352/operator-thumbnails/31.png', 'Reliable overnight bus services across Myanmar', '+959123456790', true),
  ('Aung Theim Paik', 'https://res.cloudinary.com/innoveller/image/upload/v1726518352/operator-thumbnails/206.png', 'Long-distance express routes with experienced drivers', '+959123456791', true),
  ('Mya Sandar', 'https://res.cloudinary.com/innoveller/image/upload/v1726518352/operator-thumbnails/392.png', 'Affordable and safe travel for budget-conscious travelers', '+959123456793', true),
  ('Nant Kham Mam', 'https://res.cloudinary.com/innoveller/image/upload/v1726518352/operator-thumbnails/397.png', 'Premium VIP buses with luxury amenities', '+959123456794', true),
  ('OK Express', 'https://res.cloudinary.com/innoveller/image/upload/v1726518352/operator-thumbnails/97.png', 'One of the most popular fast and reliable operators', '+959123456801', true),
  ('Shwe Keinnery', 'https://res.cloudinary.com/innoveller/image/upload/v1726518352/operator-thumbnails/533.png', 'Luxury travel experience with top-tier amenities', '+959123456796', true),
  ('Lwin Mann', 'https://res.cloudinary.com/innoveller/image/upload/v1726518352/operator-thumbnails/398.png', 'Trusted operator for central Myanmar routes', '+959123456798', true),
  ('Boss Express', 'https://res.cloudinary.com/innoveller/image/upload/v1726518352/operator-thumbnails/48.png', 'Premium travel services with luxury coaches', '+959123456810', true),
  ('Tat Nay Lin', 'https://res.cloudinary.com/innoveller/image/upload/v1726518352/operator-thumbnails/39.png', 'Long-distance express with comfortable seating', '+959123456813', true);

-- Add buses for operators  
INSERT INTO buses (operator_id, bus_number, bus_type, total_seats, amenities)
SELECT id, 'SM-001', 'VIP', 32, ARRAY['AC', 'WiFi', 'USB Charging', 'Reclining Seats', 'Water'] FROM operators WHERE name = 'Shwe Myanmar';

INSERT INTO buses (operator_id, bus_number, bus_type, total_seats, amenities)
SELECT id, 'SM-002', 'Luxury', 28, ARRAY['AC', 'WiFi', 'USB Charging', 'Massage Seats', 'Snacks', 'Water'] FROM operators WHERE name = 'Shwe Myanmar';

INSERT INTO buses (operator_id, bus_number, bus_type, total_seats, amenities)
SELECT id, 'SM-003', 'Express', 40, ARRAY['AC', 'Reclining Seats', 'Water'] FROM operators WHERE name = 'Shwe Myanmar';

INSERT INTO buses (operator_id, bus_number, bus_type, total_seats, amenities)
SELECT id, 'SLP-001', 'VIP', 32, ARRAY['AC', 'WiFi', 'USB Charging', 'Reclining Seats'] FROM operators WHERE name = 'Shwe Lun Pyan';

INSERT INTO buses (operator_id, bus_number, bus_type, total_seats, amenities)
SELECT id, 'OK-001', 'VIP', 32, ARRAY['AC', 'WiFi', 'USB Charging', 'Personal Screen'] FROM operators WHERE name = 'OK Express';

INSERT INTO buses (operator_id, bus_number, bus_type, total_seats, amenities)
SELECT id, 'OK-002', 'Luxury', 24, ARRAY['AC', 'WiFi', 'Massage Seats', 'Snacks', 'Entertainment'] FROM operators WHERE name = 'OK Express';

INSERT INTO buses (operator_id, bus_number, bus_type, total_seats, amenities)
SELECT id, 'MS-001', 'Standard', 44, ARRAY['AC', 'Water'] FROM operators WHERE name = 'Mya Sandar';

INSERT INTO buses (operator_id, bus_number, bus_type, total_seats, amenities)
SELECT id, 'NKM-001', 'VIP', 28, ARRAY['AC', 'WiFi', 'USB Charging', 'Reclining Seats', 'Blanket'] FROM operators WHERE name = 'Nant Kham Mam';

INSERT INTO buses (operator_id, bus_number, bus_type, total_seats, amenities)
SELECT id, 'SK-001', 'Luxury', 26, ARRAY['AC', 'WiFi', 'Massage Seats', 'Snacks', 'Personal Screen', 'Water'] FROM operators WHERE name = 'Shwe Keinnery';

INSERT INTO buses (operator_id, bus_number, bus_type, total_seats, amenities)
SELECT id, 'LM-001', 'VIP', 32, ARRAY['AC', 'WiFi', 'USB Charging', 'Reclining Seats'] FROM operators WHERE name = 'Lwin Mann';

INSERT INTO buses (operator_id, bus_number, bus_type, total_seats, amenities)
SELECT id, 'ATP-001', 'VIP', 30, ARRAY['AC', 'WiFi', 'USB Charging', 'Reclining Seats', 'Blanket'] FROM operators WHERE name = 'Aung Theim Paik';

-- Payment Gateways
INSERT INTO payment_gateways (name, display_name, gateway_type, is_active, is_test_mode, merchant_id, min_amount, max_amount, fee_percentage, fee_fixed, processing_time_minutes, instructions, display_order) 
VALUES 
  ('WavePay', 'Wave Money', 'mobile_banking', true, true, 'MM_WAVE_001', 1000, 5000000, 1.5, 0, 5, 'Pay with Wave Money mobile wallet', 1),
  ('KBZPay', 'KBZ Pay', 'mobile_banking', true, true, 'MM_KBZ_001', 1000, 5000000, 1.5, 0, 5, 'Pay with KBZ Pay mobile wallet', 2),
  ('CBPay', 'CB Bank Pay', 'mobile_banking', true, true, 'MM_CB_001', 1000, 5000000, 1.5, 0, 5, 'Pay with CB Pay mobile wallet', 3),
  ('AYAPay', 'AYA Pay', 'mobile_banking', true, true, 'MM_AYA_001', 1000, 5000000, 1.5, 0, 5, 'Pay with AYA Pay mobile wallet', 4),
  ('MPU', 'MPU Card', 'card', true, true, 'MM_MPU_001', 1000, 10000000, 2.0, 100, 10, 'Pay with MPU debit/credit card', 5),
  ('VISA', 'Visa', 'card', true, true, 'MM_VISA_001', 1000, 10000000, 2.5, 100, 10, 'Pay with Visa credit card', 6),
  ('MasterCard', 'MasterCard', 'card', true, true, 'MM_MC_001', 1000, 10000000, 2.5, 100, 10, 'Pay with MasterCard', 7);

-- Sample trips - Yangon to Mandalay (multiple daily departures)
INSERT INTO trips (route_id, bus_id, operator_id, departure_time, arrival_time, base_price, foreigner_price, available_seats, status, notes)
SELECT r.id, b.id, o.id, 
  NOW() + INTERVAL '7 hours', NOW() + INTERVAL '16 hours',
  25000, 35000, 32, 'scheduled', 'VIP Express - Morning Departure'
FROM routes r, buses b, operators o 
WHERE r.from_city_id = (SELECT id FROM cities WHERE name = 'Yangon')
AND r.to_city_id = (SELECT id FROM cities WHERE name = 'Mandalay')
AND b.bus_number = 'SM-001' AND o.name = 'Shwe Myanmar';

INSERT INTO trips (route_id, bus_id, operator_id, departure_time, arrival_time, base_price, foreigner_price, available_seats, status, notes)
SELECT r.id, b.id, o.id,
  NOW() + INTERVAL '19 hours', NOW() + INTERVAL '28 hours',
  28000, 38000, 30, 'scheduled', 'Premium Evening Service'
FROM routes r, buses b, operators o 
WHERE r.from_city_id = (SELECT id FROM cities WHERE name = 'Yangon')
AND r.to_city_id = (SELECT id FROM cities WHERE name = 'Mandalay')
AND b.bus_number = 'OK-001' AND o.name = 'OK Express';

INSERT INTO trips (route_id, bus_id, operator_id, departure_time, arrival_time, base_price, foreigner_price, available_seats, status, notes)
SELECT r.id, b.id, o.id,
  NOW() + INTERVAL '20 hours', NOW() + INTERVAL '29 hours',
  18000, 28000, 42, 'scheduled', 'Budget Express - Night'
FROM routes r, buses b, operators o 
WHERE r.from_city_id = (SELECT id FROM cities WHERE name = 'Yangon')
AND r.to_city_id = (SELECT id FROM cities WHERE name = 'Mandalay')
AND b.bus_number = 'MS-001' AND o.name = 'Mya Sandar';

-- Tomorrow's trips
INSERT INTO trips (route_id, bus_id, operator_id, departure_time, arrival_time, base_price, foreigner_price, available_seats, status, notes)
SELECT r.id, b.id, o.id, 
  NOW() + INTERVAL '31 hours', NOW() + INTERVAL '40 hours',
  25000, 35000, 32, 'scheduled', 'VIP Express - Tomorrow'
FROM routes r, buses b, operators o 
WHERE r.from_city_id = (SELECT id FROM cities WHERE name = 'Yangon')
AND r.to_city_id = (SELECT id FROM cities WHERE name = 'Mandalay')
AND b.bus_number = 'SM-001' AND o.name = 'Shwe Myanmar';

-- Day after tomorrow
INSERT INTO trips (route_id, bus_id, operator_id, departure_time, arrival_time, base_price, foreigner_price, available_seats, status, notes)
SELECT r.id, b.id, o.id, 
  NOW() + INTERVAL '55 hours', NOW() + INTERVAL '64 hours',
  25000, 35000, 32, 'scheduled', 'VIP Express'
FROM routes r, buses b, operators o 
WHERE r.from_city_id = (SELECT id FROM cities WHERE name = 'Yangon')
AND r.to_city_id = (SELECT id FROM cities WHERE name = 'Mandalay')
AND b.bus_number = 'SM-001' AND o.name = 'Shwe Myanmar';

-- Yangon to Bagan
INSERT INTO trips (route_id, bus_id, operator_id, departure_time, arrival_time, base_price, foreigner_price, available_seats, status, notes)
SELECT r.id, b.id, o.id,
  NOW() + INTERVAL '8 hours', NOW() + INTERVAL '16 hours',
  28000, 38000, 24, 'scheduled', 'Luxury Service to Bagan'
FROM routes r, buses b, operators o 
WHERE r.from_city_id = (SELECT id FROM cities WHERE name = 'Yangon')
AND r.to_city_id = (SELECT id FROM cities WHERE name = 'Bagan/Nyaung-U')
AND b.bus_number = 'SK-001' AND o.name = 'Shwe Keinnery';

INSERT INTO trips (route_id, bus_id, operator_id, departure_time, arrival_time, base_price, foreigner_price, available_seats, status, notes)
SELECT r.id, b.id, o.id,
  NOW() + INTERVAL '21 hours', NOW() + INTERVAL '30 hours',
  23000, 33000, 30, 'scheduled', 'Overnight to Bagan'
FROM routes r, buses b, operators o 
WHERE r.from_city_id = (SELECT id FROM cities WHERE name = 'Yangon')
AND r.to_city_id = (SELECT id FROM cities WHERE name = 'Bagan/Nyaung-U')
AND b.bus_number = 'LM-001' AND o.name = 'Lwin Mann';

-- Yangon to Taunggyi
INSERT INTO trips (route_id, bus_id, operator_id, departure_time, arrival_time, base_price, foreigner_price, available_seats, status, notes)
SELECT r.id, b.id, o.id,
  NOW() + INTERVAL '7 hours', NOW() + INTERVAL '15 hours',
  30000, 40000, 24, 'scheduled', 'Luxury to Inle Lake'
FROM routes r, buses b, operators o 
WHERE r.from_city_id = (SELECT id FROM cities WHERE name = 'Yangon')
AND r.to_city_id = (SELECT id FROM cities WHERE name = 'Taunggyi')
AND b.bus_number = 'SK-001' AND o.name = 'Shwe Keinnery';

INSERT INTO trips (route_id, bus_id, operator_id, departure_time, arrival_time, base_price, foreigner_price, available_seats, status, notes)
SELECT r.id, b.id, o.id,
  NOW() + INTERVAL '20 hours', NOW() + INTERVAL '28 hours',
  25000, 35000, 26, 'scheduled', 'VIP Night Service'
FROM routes r, buses b, operators o 
WHERE r.from_city_id = (SELECT id FROM cities WHERE name = 'Yangon')
AND r.to_city_id = (SELECT id FROM cities WHERE name = 'Taunggyi')
AND b.bus_number = 'NKM-001' AND o.name = 'Nant Kham Mam';

-- Yangon to Mawlamyine
INSERT INTO trips (route_id, bus_id, operator_id, departure_time, arrival_time, base_price, foreigner_price, available_seats, status, notes)
SELECT r.id, b.id, o.id,
  NOW() + INTERVAL '8 hours', NOW() + INTERVAL '12 hours',
  12000, 18000, 42, 'scheduled', 'Standard Service'
FROM routes r, buses b, operators o 
WHERE r.from_city_id = (SELECT id FROM cities WHERE name = 'Yangon')
AND r.to_city_id = (SELECT id FROM cities WHERE name = 'Mawlamyine')
AND b.bus_number = 'MS-001' AND o.name = 'Mya Sandar';

-- Yangon to Ngwe Saung (Beach)
INSERT INTO trips (route_id, bus_id, operator_id, departure_time, arrival_time, base_price, foreigner_price, available_seats, status, notes)
SELECT r.id, b.id, o.id,
  NOW() + INTERVAL '7 hours', NOW() + INTERVAL '10 hours',
  15000, 22000, 30, 'scheduled', 'Beach Express'
FROM routes r, buses b, operators o 
WHERE r.from_city_id = (SELECT id FROM cities WHERE name = 'Yangon')
AND r.to_city_id = (SELECT id FROM cities WHERE name = 'Ngwe Saung')
AND b.bus_number = 'ATP-001' AND o.name = 'Aung Theim Paik';

-- Yangon to Chaung Thar (Beach)
INSERT INTO trips (route_id, bus_id, operator_id, departure_time, arrival_time, base_price, foreigner_price, available_seats, status, notes)
SELECT r.id, b.id, o.id,
  NOW() + INTERVAL '8 hours', NOW() + INTERVAL '11 hours',
  14000, 20000, 30, 'scheduled', 'Beach Shuttle'
FROM routes r, buses b, operators o 
WHERE r.from_city_id = (SELECT id FROM cities WHERE name = 'Yangon')
AND r.to_city_id = (SELECT id FROM cities WHERE name = 'Chaung Thar')
AND b.bus_number = 'SLP-001' AND o.name = 'Shwe Lun Pyan';

-- Yangon to Pyin Oo Lwin
INSERT INTO trips (route_id, bus_id, operator_id, departure_time, arrival_time, base_price, foreigner_price, available_seats, status, notes)
SELECT r.id, b.id, o.id,
  NOW() + INTERVAL '7 hours', NOW() + INTERVAL '13 hours',
  20000, 30000, 28, 'scheduled', 'Hill Station Express'
FROM routes r, buses b, operators o 
WHERE r.from_city_id = (SELECT id FROM cities WHERE name = 'Yangon')
AND r.to_city_id = (SELECT id FROM cities WHERE name = 'Pyin Oo Lwin')
AND b.bus_number = 'ATP-001' AND o.name = 'Aung Theim Paik';

-- Yangon to Pathein
INSERT INTO trips (route_id, bus_id, operator_id, departure_time, arrival_time, base_price, foreigner_price, available_seats, status, notes)
SELECT r.id, b.id, o.id,
  NOW() + INTERVAL '8 hours', NOW() + INTERVAL '11 hours',
  12000, 18000, 42, 'scheduled', 'Delta Express'
FROM routes r, buses b, operators o 
WHERE r.from_city_id = (SELECT id FROM cities WHERE name = 'Yangon')
AND r.to_city_id = (SELECT id FROM cities WHERE name = 'Pathein')
AND b.bus_number = 'MS-001' AND o.name = 'Mya Sandar';

-- Yangon to Hpa-An
INSERT INTO trips (route_id, bus_id, operator_id, departure_time, arrival_time, base_price, foreigner_price, available_seats, status, notes)
SELECT r.id, b.id, o.id,
  NOW() + INTERVAL '7 hours', NOW() + INTERVAL '10 hours',
  13000, 18000, 30, 'scheduled', 'Kayin State Express'
FROM routes r, buses b, operators o 
WHERE r.from_city_id = (SELECT id FROM cities WHERE name = 'Yangon')
AND r.to_city_id = (SELECT id FROM cities WHERE name = 'Hpa-An')
AND b.bus_number = 'ATP-001' AND o.name = 'Aung Theim Paik';
