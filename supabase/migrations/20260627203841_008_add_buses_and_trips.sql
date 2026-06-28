-- ============================================
-- Add buses for all operators
-- ============================================

-- Create buses for each operator
INSERT INTO buses (operator_id, bus_number, bus_type, total_seats, amenities)
SELECT 
  o.id,
  'MM-' || LPAD((ROW_NUMBER() OVER ())::TEXT, 4, '0'),
  CASE (ROW_NUMBER() OVER ()) % 5
    WHEN 0 THEN 'VIP'
    WHEN 1 THEN 'Express'
    WHEN 2 THEN 'Sleeper'
    WHEN 3 THEN 'Standard'
    ELSE 'Luxury'
  END,
  CASE (ROW_NUMBER() OVER ()) % 5
    WHEN 0 THEN 36
    WHEN 1 THEN 44
    WHEN 2 THEN 40
    WHEN 3 THEN 32
    ELSE 28
  END,
  CASE (ROW_NUMBER() OVER ()) % 5
    WHEN 0 THEN ARRAY['WiFi', 'AC', 'USB Charging']
    WHEN 1 THEN ARRAY['WiFi', 'AC', 'Blanket', 'Snacks']
    WHEN 2 THEN ARRAY['AC', 'Reclining Seats', 'Blanket', 'Pillow']
    WHEN 3 THEN ARRAY['AC', 'USB Charging']
    ELSE ARRAY['WiFi', 'AC', 'USB Charging', 'Blanket', 'Snacks', 'Mineral Water']
  END
FROM operators o
CROSS JOIN generate_series(1, 3) gs
WHERE o.is_active = true;

-- Create trips for popular routes
DO $$
DECLARE
  bus_record RECORD;
  route_record RECORD;
  dep_time TIMESTAMP WITH TIME ZONE;
  base_pric NUMERIC;
BEGIN
  FOR route_record IN 
    SELECT id, estimated_duration_minutes
    FROM routes
    WHERE is_active = true
    ORDER BY RANDOM()
    LIMIT 20
  LOOP
    FOR bus_record IN 
      SELECT id, operator_id, total_seats
      FROM buses
      ORDER BY RANDOM()
      LIMIT 3
    LOOP
      -- Morning departure
      dep_time := CURRENT_DATE + INTERVAL '1 day' + INTERVAL '6 hours';
      base_pric := 15000 + (route_record.estimated_duration_minutes::NUMERIC * 50);
      
      INSERT INTO trips (route_id, bus_id, operator_id, departure_time, arrival_time,
                        base_price, foreigner_price, available_seats, status)
      VALUES (
        route_record.id,
        bus_record.id,
        bus_record.operator_id,
        dep_time,
        dep_time + (route_record.estimated_duration_minutes || ' minutes')::INTERVAL,
        base_pric,
        base_pric * 1.5,
        bus_record.total_seats,
        'scheduled'
      );
      
      -- Evening departure
      dep_time := CURRENT_DATE + INTERVAL '1 day' + INTERVAL '20 hours';
      
      INSERT INTO trips (route_id, bus_id, operator_id, departure_time, arrival_time,
                        base_price, foreigner_price, available_seats, status)
      VALUES (
        route_record.id,
        bus_record.id,
        bus_record.operator_id,
        dep_time,
        dep_time + (route_record.estimated_duration_minutes || ' minutes')::INTERVAL,
        base_pric,
        base_pric * 1.5,
        bus_record.total_seats,
        'scheduled'
      );
    END LOOP;
  END LOOP;
END $$;