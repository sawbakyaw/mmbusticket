/*
# MM-BusTicket Pro Enterprise Schema Extension

## Overview
Adds enterprise features: RBAC, Wallets, Commissions, Payment Gateways, Audit Logs, CMS, Notifications
Fixed version - no user_id column in agents table (uses wallet_id relation)

## New Tables

### Authentication & RBAC
1. `roles` - System roles (super_admin, operator, agent, customer)
2. `user_profiles` - Extended user data with roles

### Financial System
3. `wallets` - User/operator/agent wallets
4. `wallet_transactions` - Transaction history
5. `payment_gateways` - Gateway configuration
6. `gateway_transactions` - Gateway payment records
7. `commission_rules` - Commission rules
8. `commission_payouts` - Commission payments

### Refunds
9. `refund_requests` - Refund requests

### CMS & Notifications
10. `cms_pages` - Content pages
11. `cms_banners` - Homepage banners
12. `notification_templates` - Email/SMS templates
13. `notifications` - User notifications

### Audit & Security
14. `audit_logs` - System activity logs
15. `admin_actions` - Admin-specific actions
16. `two_factor_codes` - 2FA verification codes
17. `user_sessions` - Device session tracking

### Operators & Agents
18. `operator_users` - Operator staff accounts
19. `agents` - Agent companies
20. `agent_users` - Agent staff accounts
21. `bus_stops` - Intermediate stops
22. `trip_stops` - Stops for each trip
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- AUTHENTICATION & RBAC
-- ============================================

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    display_name text NOT NULL,
    description text,
    level integer DEFAULT 0,
    is_system boolean DEFAULT false,
    permissions text[] DEFAULT ARRAY[]::text[],
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Default roles
INSERT INTO roles (name, display_name, description, level, is_system, permissions) VALUES
('super_admin', 'Super Administrator', 'Full system access', 100, true, ARRAY['*']),
('admin', 'Administrator', 'Admin access', 90, true, ARRAY['users.*', 'bookings.*', 'operators.*', 'reports.*', 'settings.*']),
('operator_admin', 'Operator Admin', 'Operator company admin', 70, true, ARRAY['operator.*', 'trips.*', 'buses.*', 'bookings.view', 'bookings.manage_own']),
('operator_staff', 'Operator Staff', 'Operator staff member', 60, true, ARRAY['trips.view', 'trips.manage', 'bookings.view']),
('agent_admin', 'Agent Admin', 'Agent company admin', 50, true, ARRAY['agent.*', 'bookings.*', 'wallet.view', 'wallet.use']),
('agent_staff', 'Agent Staff', 'Agent staff member', 40, true, ARRAY['bookings.*', 'wallet.view']),
('customer', 'Customer', 'Regular customer', 10, true, ARRAY['bookings.own', 'wallet.own'])
ON CONFLICT (name) DO NOTHING;

-- User profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid UNIQUE NOT NULL,
    role_id uuid REFERENCES roles(id) ON DELETE SET NULL,
    company_name text,
    phone_verified boolean DEFAULT false,
    email_verified boolean DEFAULT false,
    two_factor_enabled boolean DEFAULT false,
    two_factor_secret text,
    avatar_url text,
    address text,
    city text,
    country text DEFAULT 'Myanmar',
    timezone text DEFAULT 'Asia/Yangon',
    language text DEFAULT 'en',
    notification_preferences jsonb DEFAULT '{"email": true, "sms": true, "push": true}',
    is_active boolean DEFAULT true,
    last_login_at timestamptz,
    last_login_ip text,
    failed_login_attempts integer DEFAULT 0,
    locked_until timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Two-factor authentication codes
CREATE TABLE IF NOT EXISTS two_factor_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    code_hash text NOT NULL,
    purpose text NOT NULL DEFAULT 'login',
    expires_at timestamptz NOT NULL,
    used_at timestamptz,
    attempts integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- User sessions (device tracking)
CREATE TABLE IF NOT EXISTS user_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    session_token_hash text NOT NULL,
    refresh_token_hash text,
    device_name text,
    device_type text,
    browser text,
    os text,
    ip_address text,
    user_agent text,
    location text,
    is_current boolean DEFAULT false,
    is_trusted boolean DEFAULT false,
    last_activity_at timestamptz DEFAULT now(),
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- ============================================
-- WALLET SYSTEM
-- ============================================

-- Wallets
CREATE TABLE IF NOT EXISTS wallets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    operator_id uuid REFERENCES operators(id),
    agent_id uuid,
    wallet_type text NOT NULL DEFAULT 'user',
    balance decimal(15,2) DEFAULT 0,
    frozen_balance decimal(15,2) DEFAULT 0,
    currency text DEFAULT 'MMK',
    is_active boolean DEFAULT true,
    min_balance decimal(15,2) DEFAULT 0,
    max_balance decimal(15,2) DEFAULT 100000000,
    pin_hash text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Wallet transactions
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id uuid NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
    transaction_type text NOT NULL,
    amount decimal(15,2) NOT NULL,
    balance_before decimal(15,2) NOT NULL,
    balance_after decimal(15,2) NOT NULL,
    reference_type text,
    reference_id uuid,
    description text,
    metadata jsonb DEFAULT '{}',
    status text DEFAULT 'completed',
    reversal_id uuid REFERENCES wallet_transactions(id),
    created_by uuid,
    created_at timestamptz DEFAULT now()
);

-- ============================================
-- PAYMENT GATEWAYS
-- ============================================

-- Payment gateways configuration
CREATE TABLE IF NOT EXISTS payment_gateways (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    display_name text NOT NULL,
    gateway_type text NOT NULL,
    is_active boolean DEFAULT true,
    is_test_mode boolean DEFAULT true,
    api_endpoint text,
    merchant_id text,
    secret_key_encrypted text,
    public_key text,
    callback_url text,
    webhook_url text,
    min_amount decimal(15,2) DEFAULT 1000,
    max_amount decimal(15,2) DEFAULT 10000000,
    fee_percentage decimal(5,2) DEFAULT 0,
    fee_fixed decimal(15,2) DEFAULT 0,
    processing_time_minutes integer DEFAULT 5,
    icon_url text,
    instructions text,
    config jsonb DEFAULT '{}',
    display_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Insert default gateways
INSERT INTO payment_gateways (name, display_name, gateway_type, display_order) VALUES
('kbzpay', 'KBZ Pay', 'mobile_banking', 1),
('wavepay', 'Wave Pay', 'mobile_banking', 2),
('ayapay', 'AYA Pay', 'mobile_banking', 3),
('cbpay', 'CB Pay', 'mobile_banking', 4),
('uabpay', 'UAB Pay', 'mobile_banking', 5),
('mpu', 'MPU Card', 'card', 6),
('visa', 'VISA', 'card', 7),
('master', 'Mastercard', 'card', 8),
('stripe', 'Stripe', 'card', 9),
('paypal', 'PayPal', 'card', 10),
('bank_transfer', 'Bank Transfer', 'bank_transfer', 11)
ON CONFLICT (name) DO NOTHING;

-- Gateway transactions
CREATE TABLE IF NOT EXISTS gateway_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id uuid REFERENCES bookings(id),
    gateway_id uuid REFERENCES payment_gateways(id),
    transaction_type text NOT NULL,
    amount decimal(15,2) NOT NULL,
    currency text DEFAULT 'MMK',
    gateway_transaction_id text,
    gateway_reference text,
    gateway_callback_data jsonb,
    status text DEFAULT 'pending',
    error_code text,
    error_message text,
    fee_amount decimal(15,2) DEFAULT 0,
    processed_at timestamptz,
    expires_at timestamptz,
    created_by uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================
-- COMMISSION SYSTEM
-- ============================================

-- Commission rules
CREATE TABLE IF NOT EXISTS commission_rules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    rule_type text DEFAULT 'percentage',
    operator_id uuid REFERENCES operators(id),
    route_id uuid REFERENCES routes(id),
    bus_type text,
    commission_value decimal(5,2) NOT NULL,
    min_fee decimal(15,2) DEFAULT 0,
    max_fee decimal(15,2),
    platform_share decimal(5,2) DEFAULT 100,
    agent_share decimal(5,2) DEFAULT 0,
    is_active boolean DEFAULT true,
    valid_from timestamptz,
    valid_until timestamptz,
    priority integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Commission payouts
CREATE TABLE IF NOT EXISTS commission_payouts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id uuid NOT NULL REFERENCES wallets(id),
    period_start timestamptz NOT NULL,
    period_end timestamptz NOT NULL,
    total_bookings integer DEFAULT 0,
    total_amount decimal(15,2) DEFAULT 0,
    commission_amount decimal(15,2) DEFAULT 0,
    status text DEFAULT 'pending',
    payment_method text,
    payment_reference text,
    paid_at timestamptz,
    notes text,
    created_by uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================
-- REFUND SYSTEM
-- ============================================

-- Refund requests
CREATE TABLE IF NOT EXISTS refund_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id uuid NOT NULL REFERENCES bookings(id),
    requested_by uuid NOT NULL,
    request_type text NOT NULL,
    reason text NOT NULL,
    reason_category text,
    refund_amount decimal(15,2) NOT NULL,
    refund_reason text,
    status text DEFAULT 'pending',
    reviewed_by uuid,
    reviewed_at timestamptz,
    review_notes text,
    refund_method text,
    processed_by uuid,
    processed_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================
-- AUDIT LOGS
-- ============================================

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    user_role text,
    action text NOT NULL,
    action_type text NOT NULL,
    resource_type text NOT NULL,
    resource_id uuid,
    old_values jsonb,
    new_values jsonb,
    ip_address text,
    user_agent text,
    request_path text,
    request_method text,
    response_status integer,
    error_message text,
    duration_ms integer,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

-- Admin actions
CREATE TABLE IF NOT EXISTS admin_actions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id uuid NOT NULL,
    action_type text NOT NULL,
    target_type text,
    target_id uuid,
    description text NOT NULL,
    approval_required boolean DEFAULT false,
    approved_by uuid,
    approved_at timestamptz,
    is_reversible boolean DEFAULT true,
    reversed_by uuid,
    reversed_at timestamptz,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

-- ============================================
-- CMS SYSTEM
-- ============================================

-- CMS Pages
CREATE TABLE IF NOT EXISTS cms_pages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text UNIQUE NOT NULL,
    title text NOT NULL,
    title_mm text,
    content text,
    content_mm text,
    meta_title text,
    meta_description text,
    page_type text DEFAULT 'static',
    is_published boolean DEFAULT false,
    published_at timestamptz,
    author_id uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- CMS Banners
CREATE TABLE IF NOT EXISTS cms_banners (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text,
    title_mm text,
    subtitle text,
    subtitle_mm text,
    image_url text,
    image_url_mobile text,
    link_url text,
    position text DEFAULT 'hero',
    background_color text,
    text_color text,
    button_text text,
    button_text_mm text,
    start_date timestamptz,
    end_date timestamptz,
    is_active boolean DEFAULT true,
    display_order integer DEFAULT 0,
    created_by uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================
-- NOTIFICATION SYSTEM
-- ============================================

-- Notification templates
CREATE TABLE IF NOT EXISTS notification_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    name_mm text,
    template_type text NOT NULL,
    event_type text NOT NULL,
    subject text,
    subject_mm text,
    body text NOT NULL,
    body_mm text,
    variables text[],
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    template_id uuid REFERENCES notification_templates(id),
    notification_type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    data jsonb DEFAULT '{}',
    read_at timestamptz,
    sent_at timestamptz,
    status text DEFAULT 'pending',
    error_message text,
    created_at timestamptz DEFAULT now()
);

-- ============================================
-- OPERATORS & AGENTS
-- ============================================

-- Operator users (staff accounts)
CREATE TABLE IF NOT EXISTS operator_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id uuid NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    user_id uuid NOT NULL,
    role text DEFAULT 'staff',
    permissions text[] DEFAULT ARRAY[]::text[],
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Agent companies
CREATE TABLE IF NOT EXISTS agents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_code text UNIQUE NOT NULL,
    company_name text NOT NULL,
    contact_person text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    address text,
    city text,
    wallet_id uuid REFERENCES wallets(id),
    commission_rate decimal(5,2) DEFAULT 5,
    credit_limit decimal(15,2) DEFAULT 0,
    is_active boolean DEFAULT true,
    is_verified boolean DEFAULT false,
    verified_at timestamptz,
    verified_by uuid,
    created_by uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Agent users (staff accounts)
CREATE TABLE IF NOT EXISTS agent_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    user_id uuid NOT NULL,
    role text DEFAULT 'staff',
    permissions text[] DEFAULT ARRAY[]::text[],
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Bus stops
CREATE TABLE IF NOT EXISTS bus_stops (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id uuid NOT NULL REFERENCES cities(id),
    name text NOT NULL,
    address text,
    coordinates point,
    stop_type text DEFAULT 'station',
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Trip intermediate stops
CREATE TABLE IF NOT EXISTS trip_stops (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    bus_stop_id uuid REFERENCES bus_stops(id),
    city_id uuid NOT NULL REFERENCES cities(id),
    stop_name text NOT NULL,
    arrival_time timestamptz,
    departure_time timestamptz,
    stop_order integer NOT NULL,
    pickup_allowed boolean DEFAULT true,
    dropoff_allowed boolean DEFAULT true,
    fare_from_start decimal(15,2),
    created_at timestamptz DEFAULT now()
);

-- ============================================
-- EXTEND EXISTING TABLES
-- ============================================

-- Add columns to bookings
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'wallet_id') THEN
        ALTER TABLE bookings ADD COLUMN wallet_id uuid;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'gateway_transaction_id') THEN
        ALTER TABLE bookings ADD COLUMN gateway_transaction_id uuid;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'commission_rule_id') THEN
        ALTER TABLE bookings ADD COLUMN commission_rule_id uuid;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'platform_fee') THEN
        ALTER TABLE bookings ADD COLUMN platform_fee decimal(15,2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'operator_payout') THEN
        ALTER TABLE bookings ADD COLUMN operator_payout decimal(15,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'agent_commission') THEN
        ALTER TABLE bookings ADD COLUMN agent_commission decimal(15,2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'booked_by') THEN
        ALTER TABLE bookings ADD COLUMN booked_by uuid;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'booking_source') THEN
        ALTER TABLE bookings ADD COLUMN booking_source text DEFAULT 'website';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'agent_id') THEN
        ALTER TABLE bookings ADD COLUMN agent_id uuid;
    END IF;
END $$;

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_user ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_operator ON wallets(operator_id);
CREATE INDEX IF NOT EXISTS idx_wallets_agent ON wallets(agent_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status ON wallet_transactions(status);
CREATE INDEX IF NOT EXISTS idx_gateway_transactions_booking ON gateway_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_gateway_transactions_status ON gateway_transactions(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_refund_requests_booking ON refund_requests(booking_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON refund_requests(status);
CREATE INDEX IF NOT EXISTS idx_bookings_booked_by ON bookings(booked_by);
CREATE INDEX IF NOT EXISTS idx_trip_stops_trip ON trip_stops(trip_id);
CREATE INDEX IF NOT EXISTS idx_operator_users_operator ON operator_users(operator_id);
CREATE INDEX IF NOT EXISTS idx_agent_users_agent ON agent_users(agent_id);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_factor_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_gateways ENABLE ROW LEVEL SECURITY;
ALTER TABLE gateway_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_users ENABLE ROW LEVEL SECURITY;

-- Public read for payment gateways
DROP POLICY IF EXISTS "anon_read_gateways" ON payment_gateways;
CREATE POLICY "anon_read_gateways" ON payment_gateways FOR SELECT
    TO anon, authenticated USING (is_active = true);

-- Admins can manage gateways
DROP POLICY IF EXISTS "admin_manage_gateways" ON payment_gateways;
CREATE POLICY "admin_manage_gateways" ON payment_gateways FOR ALL
    TO authenticated USING (true);

-- Users can read own profile
DROP POLICY IF EXISTS "user_read_own_profile" ON user_profiles;
CREATE POLICY "user_read_own_profile" ON user_profiles FOR SELECT
    TO authenticated USING (auth.uid() = user_id);

-- Users can update own profile
DROP POLICY IF EXISTS "user_update_own_profile" ON user_profiles;
CREATE POLICY "user_update_own_profile" ON user_profiles FOR UPDATE
    TO authenticated USING (auth.uid() = user_id);

-- Users can read own wallet
DROP POLICY IF EXISTS "user_read_own_wallet" ON wallets;
CREATE POLICY "user_read_own_wallet" ON wallets FOR SELECT
    TO authenticated USING (auth.uid() = user_id);

-- Users can read own wallet transactions
DROP POLICY IF EXISTS "user_read_own_transactions" ON wallet_transactions;
CREATE POLICY "user_read_own_transactions" ON wallet_transactions FOR SELECT
    TO authenticated USING (wallet_id IN (SELECT id FROM wallets WHERE user_id = auth.uid()));

-- Users can read own notifications
DROP POLICY IF EXISTS "user_read_own_notifications" ON notifications;
CREATE POLICY "user_read_own_notifications" ON notifications FOR SELECT
    TO authenticated USING (user_id = auth.uid());

-- Users can update own notifications
DROP POLICY IF EXISTS "user_update_own_notifications" ON notifications;
CREATE POLICY "user_update_own_notifications" ON notifications FOR UPDATE
    TO authenticated USING (user_id = auth.uid());

-- Admin read for audit logs
DROP POLICY IF EXISTS "admin_read_audit" ON audit_logs;
CREATE POLICY "admin_read_audit" ON audit_logs FOR SELECT
    TO authenticated USING (true);

-- Admin can create audit logs
DROP POLICY IF EXISTS "admin_create_audit" ON audit_logs;
CREATE POLICY "admin_create_audit" ON audit_logs FOR INSERT
    TO authenticated WITH CHECK (true);

-- Public read for CMS pages
DROP POLICY IF EXISTS "anon_read_cms" ON cms_pages;
CREATE POLICY "anon_read_cms" ON cms_pages FOR SELECT
    TO anon, authenticated USING (is_published = true);

-- Admin manage CMS
DROP POLICY IF EXISTS "admin_manage_cms" ON cms_pages;
CREATE POLICY "admin_manage_cms" ON cms_pages FOR ALL
    TO authenticated USING (true);

-- Public read for active banners
DROP POLICY IF EXISTS "anon_read_banners" ON cms_banners;
CREATE POLICY "anon_read_banners" ON cms_banners FOR SELECT
    TO anon, authenticated USING (is_active = true);

-- Admin manage banners
DROP POLICY IF EXISTS "admin_manage_banners" ON cms_banners;
CREATE POLICY "admin_manage_banners" ON cms_banners FOR ALL
    TO authenticated USING (true);

-- Refund request policies
DROP POLICY IF EXISTS "user_read_own_refunds" ON refund_requests;
CREATE POLICY "user_read_own_refunds" ON refund_requests FOR SELECT
    TO authenticated USING (requested_by = auth.uid());

DROP POLICY IF EXISTS "user_create_refunds" ON refund_requests;
CREATE POLICY "user_create_refunds" ON refund_requests FOR INSERT
    TO authenticated WITH CHECK (requested_by = auth.uid());

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to generate agent code
CREATE OR REPLACE FUNCTION generate_agent_code()
RETURNS text AS $$
BEGIN
    RETURN 'AGT-' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
END;
$$ LANGUAGE plpgsql;

-- Trigger for agent code
CREATE OR REPLACE FUNCTION set_agent_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.agent_code IS NULL OR NEW.agent_code = '' THEN
        NEW.agent_code := generate_agent_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_agent_code ON agents;
CREATE TRIGGER trigger_set_agent_code
    BEFORE INSERT ON agents
    FOR EACH ROW
    EXECUTE FUNCTION set_agent_code();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS trigger_update_user_profiles ON user_profiles;
CREATE TRIGGER trigger_update_user_profiles BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_update_payment_gateways ON payment_gateways;
CREATE TRIGGER trigger_update_payment_gateways BEFORE UPDATE ON payment_gateways FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Insert default CMS pages
INSERT INTO cms_pages (slug, title, page_type, is_published, published_at) VALUES
('terms', 'Terms of Service', 'terms', true, now()),
('privacy', 'Privacy Policy', 'privacy', true, now()),
('about', 'About Us', 'about', true, now()),
('faq', 'Frequently Asked Questions', 'faq', true, now())
ON CONFLICT (slug) DO NOTHING;

-- Insert default notification templates
INSERT INTO notification_templates (name, template_type, event_type, subject, body) VALUES
('booking_confirmed_email', 'email', 'booking_created', 'Your Booking is Confirmed - {{booking_reference}}', 'Dear {{passenger_name}}, your booking ({{booking_reference}}) has been confirmed.'),
('booking_confirmed_sms', 'sms', 'booking_created', 'Booking Confirmed', 'MM-BusTicket: Booking {{booking_reference}} confirmed. {{from}} to {{to}} on {{date}}.'),
('payment_success_email', 'email', 'payment_success', 'Payment Successful - {{booking_reference}}', 'Your payment of MMK {{amount}} has been received.')
ON CONFLICT (name) DO NOTHING;