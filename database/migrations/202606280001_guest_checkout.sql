BEGIN;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS schedule_id uuid GENERATED ALWAYS AS (trip_id) STORED;

UPDATE bookings SET status = 'confirmed' WHERE payment_status = 'paid' AND status = 'pending';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bookings_status_check' AND conrelid = 'bookings'::regclass
  ) THEN
    ALTER TABLE bookings ADD CONSTRAINT bookings_status_check CHECK (status IN ('pending', 'confirmed', 'cancelled'));
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS passengers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone_number text NOT NULL,
  nrc_number text,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO passengers (booking_id, full_name, phone_number, nrc_number)
SELECT b.id, b.passenger_name, regexp_replace(b.passenger_phone, '[[:space:]-]', '', 'g'), b.passenger_nrc
FROM bookings b
WHERE NOT EXISTS (SELECT 1 FROM passengers p WHERE p.booking_id = b.id);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  payment_method text,
  transaction_ref text,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'verified', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz,
  verified_by uuid REFERENCES app_users(id)
);

INSERT INTO payments (booking_id, payment_method, transaction_ref, payment_status, verified_at)
SELECT b.id, b.payment_method, b.payment_reference,
       CASE WHEN b.payment_status = 'paid' THEN 'verified' WHEN b.payment_status IN ('failed', 'rejected') THEN 'rejected' ELSE 'pending' END,
       CASE WHEN b.payment_status = 'paid' THEN b.booked_at ELSE NULL END
FROM bookings b
WHERE NOT EXISTS (SELECT 1 FROM payments p WHERE p.booking_id = b.id);

CREATE INDEX IF NOT EXISTS bookings_phone_idx ON bookings(passenger_phone, booked_at DESC);
CREATE INDEX IF NOT EXISTS passengers_phone_lookup_idx ON passengers(phone_number);
CREATE INDEX IF NOT EXISTS passengers_booking_idx ON passengers(booking_id);
CREATE INDEX IF NOT EXISTS payments_booking_created_idx ON payments(booking_id, created_at DESC);

CREATE OR REPLACE FUNCTION create_guest_booking(
  p_trip_id uuid,
  p_session_id text,
  p_seat_numbers text[],
  p_full_name text,
  p_phone_number text,
  p_email text,
  p_nrc_number text,
  p_is_foreigner boolean,
  p_notes text
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_trip trips%ROWTYPE;
  v_booking bookings%ROWTYPE;
  v_seat_ids uuid[];
  v_total numeric(14,2);
  v_phone_number text := regexp_replace(coalesce(p_phone_number, ''), '[[:space:]-]', '', 'g');
BEGIN
  IF p_trip_id IS NULL OR p_session_id IS NULL OR length(p_session_id) < 12 OR length(p_session_id) > 100
     OR coalesce(array_length(p_seat_numbers, 1), 0) NOT BETWEEN 1 AND 8
     OR length(trim(coalesce(p_full_name, ''))) NOT BETWEEN 1 AND 120
     OR v_phone_number !~ '^[0-9]{7,15}$'
     OR (p_email IS NOT NULL AND (length(p_email) > 254 OR p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'))
     OR (NOT coalesce(p_is_foreigner, false) AND length(trim(coalesce(p_nrc_number, ''))) = 0)
     OR length(coalesce(p_nrc_number, '')) > 100 OR length(coalesce(p_notes, '')) > 1000 THEN
    RAISE EXCEPTION 'Booking details are incomplete or invalid.' USING ERRCODE = '22023';
  END IF;

  IF (SELECT count(DISTINCT seat_number) FROM unnest(p_seat_numbers) AS seats(seat_number)) <> cardinality(p_seat_numbers) THEN
    RAISE EXCEPTION 'Duplicate seats are not allowed.' USING ERRCODE = '22023';
  END IF;

  PERFORM clean_expired_locks();
  SELECT * INTO v_trip FROM trips WHERE id = p_trip_id AND status = 'scheduled' FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Trip is not available.' USING ERRCODE = 'P0001';
  END IF;

  SELECT array_agg(locked_seat.id ORDER BY locked_seat.seat_number) INTO v_seat_ids
  FROM (
    SELECT s.id, s.seat_number FROM seats s JOIN seat_locks l ON l.seat_id = s.id
    WHERE s.trip_id = p_trip_id AND s.seat_number = ANY(p_seat_numbers)
      AND s.status = 'locked' AND l.session_id = p_session_id AND l.expires_at > now()
    FOR UPDATE OF s, l
  ) AS locked_seat;

  IF coalesce(cardinality(v_seat_ids), 0) <> cardinality(p_seat_numbers) THEN
    RAISE EXCEPTION 'One or more selected seats are no longer reserved for you.' USING ERRCODE = 'P0001';
  END IF;

  v_total := (CASE WHEN p_is_foreigner AND v_trip.foreigner_price IS NOT NULL THEN v_trip.foreigner_price ELSE v_trip.base_price END) * cardinality(p_seat_numbers);

  INSERT INTO bookings (trip_id, operator_id, passenger_name, passenger_phone, passenger_email, passenger_nrc,
                        seat_numbers, total_amount, payment_method, payment_status, status, is_foreigner, notes)
  VALUES (p_trip_id, v_trip.operator_id, trim(p_full_name), v_phone_number, nullif(trim(p_email), ''),
          CASE WHEN p_is_foreigner THEN NULL ELSE nullif(trim(p_nrc_number), '') END,
          p_seat_numbers, v_total, NULL, 'pending', 'pending', p_is_foreigner, nullif(trim(p_notes), ''))
  RETURNING * INTO v_booking;

  INSERT INTO passengers (booking_id, full_name, phone_number, nrc_number)
  VALUES (v_booking.id, trim(p_full_name), v_phone_number, CASE WHEN p_is_foreigner THEN NULL ELSE nullif(trim(p_nrc_number), '') END);

  INSERT INTO payments (booking_id, payment_status) VALUES (v_booking.id, 'pending');

  UPDATE seats SET status = 'booked' WHERE id = ANY(v_seat_ids);
  DELETE FROM seat_locks WHERE seat_id = ANY(v_seat_ids) AND session_id = p_session_id;
  UPDATE trips SET available_seats = GREATEST(available_seats - cardinality(v_seat_ids), 0) WHERE id = p_trip_id;

  RETURN jsonb_build_object('id', v_booking.id, 'booking_reference', v_booking.booking_reference,
    'trip_id', v_booking.trip_id, 'passenger_name', v_booking.passenger_name,
    'passenger_phone', v_booking.passenger_phone, 'seat_numbers', v_booking.seat_numbers,
    'total_amount', v_booking.total_amount, 'payment_method', v_booking.payment_method,
    'payment_status', v_booking.payment_status, 'status', v_booking.status,
    'is_foreigner', v_booking.is_foreigner, 'booked_at', v_booking.booked_at, 'created_at', v_booking.created_at);
END;
$$;

COMMIT;
