/*
 * MM-BusTicket Pro - Enterprise TypeScript Types
 */

import { Booking, Operator } from './types';

// ============================================
// Roles & Permissions
// ============================================

export type SystemRole =
  | 'super_admin'
  | 'admin'
  | 'operator_admin'
  | 'operator_staff'
  | 'agent_admin'
  | 'agent_staff'
  | 'customer';

export interface Role {
  id: string;
  name: SystemRole;
  display_name: string;
  description: string | null;
  level: number;
  is_system: boolean;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  role_id: string | null;
  role?: Role;
  company_name: string | null;
  phone_verified: boolean;
  email_verified: boolean;
  two_factor_enabled: boolean;
  avatar_url: string | null;
  address: string | null;
  city: string | null;
  country: string;
  timezone: string;
  language: string;
  notification_preferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  is_active: boolean;
  last_login_at: string | null;
  last_login_ip: string | null;
  failed_login_attempts: number;
  locked_until: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// Wallet System
// ============================================

export type WalletType = 'user' | 'operator' | 'agent' | 'system';
export type TransactionType = 'deposit' | 'withdraw' | 'transfer' | 'booking' | 'refund' | 'commission' | 'adjustment';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'reversed';

export interface Wallet {
  id: string;
  user_id: string | null;
  operator_id: string | null;
  agent_id: string | null;
  wallet_type: WalletType;
  balance: number;
  frozen_balance: number;
  currency: string;
  is_active: boolean;
  min_balance: number;
  max_balance: number;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  wallet?: Wallet;
  transaction_type: TransactionType;
  amount: number;
  balance_before: number;
  balance_after: number;
  reference_type: string | null;
  reference_id: string | null;
  description: string | null;
  metadata: Record<string, any>;
  status: TransactionStatus;
  reversal_id: string | null;
  created_by: string | null;
  created_at: string;
}

// ============================================
// Payment Gateways
// ============================================

export type GatewayType = 'mobile_banking' | 'card' | 'bank_transfer';
export type GatewayTransactionStatus = 'pending' | 'success' | 'failed' | 'cancelled' | 'refunded';

export interface PaymentGateway {
  id: string;
  name: string;
  display_name: string;
  gateway_type: GatewayType;
  is_active: boolean;
  is_test_mode: boolean;
  api_endpoint: string | null;
  merchant_id: string | null;
  min_amount: number;
  max_amount: number;
  fee_percentage: number;
  fee_fixed: number;
  processing_time_minutes: number;
  icon_url: string | null;
  instructions: string | null;
  config: Record<string, any>;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface GatewayTransaction {
  id: string;
  booking_id: string | null;
  gateway_id: string;
  gateway?: PaymentGateway;
  transaction_type: 'payment' | 'refund';
  amount: number;
  currency: string;
  gateway_transaction_id: string | null;
  gateway_reference: string | null;
  gateway_callback_data: Record<string, any> | null;
  status: GatewayTransactionStatus;
  error_code: string | null;
  error_message: string | null;
  fee_amount: number;
  processed_at: string | null;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// Commission System
// ============================================

export interface CommissionRule {
  id: string;
  name: string;
  description: string | null;
  rule_type: 'percentage' | 'fixed';
  operator_id: string | null;
  route_id: string | null;
  bus_type: string | null;
  commission_value: number;
  min_fee: number;
  max_fee: number | null;
  platform_share: number;
  agent_share: number;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface CommissionPayout {
  id: string;
  wallet_id: string;
  period_start: string;
  period_end: string;
  total_bookings: number;
  total_amount: number;
  commission_amount: number;
  status: 'pending' | 'processing' | 'paid' | 'cancelled';
  payment_method: string | null;
  payment_reference: string | null;
  paid_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// Refunds
// ============================================

export type RefundStatus = 'pending' | 'approved' | 'rejected' | 'processing' | 'completed';
export type RefundRequestType = 'full' | 'partial';

export interface RefundRequest {
  id: string;
  booking_id: string;
  booking?: Booking;
  requested_by: string;
  request_type: RefundRequestType;
  reason: string;
  reason_category: string | null;
  refund_amount: number;
  refund_reason: string | null;
  status: RefundStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  refund_method: string | null;
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// Audit Logs
// ============================================

export type ActionType = 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout' | 'export';

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_role: string | null;
  action: string;
  action_type: ActionType;
  resource_type: string;
  resource_id: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  request_path: string | null;
  request_method: string | null;
  response_status: number | null;
  error_message: string | null;
  duration_ms: number | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface AdminAction {
  id: string;
  admin_id: string;
  action_type: string;
  target_type: string | null;
  target_id: string | null;
  description: string;
  approval_required: boolean;
  approved_by: string | null;
  approved_at: string | null;
  is_reversible: boolean;
  reversed_by: string | null;
  reversed_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

// ============================================
// CMS
// ============================================

export interface CmsPage {
  id: string;
  slug: string;
  title: string;
  title_mm: string | null;
  content: string | null;
  content_mm: string | null;
  meta_title: string | null;
  meta_description: string | null;
  page_type: 'static' | 'terms' | 'privacy' | 'about' | 'faq';
  is_published: boolean;
  published_at: string | null;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CmsBanner {
  id: string;
  title: string | null;
  title_mm: string | null;
  subtitle: string | null;
  subtitle_mm: string | null;
  image_url: string | null;
  image_url_mobile: string | null;
  link_url: string | null;
  position: 'hero' | 'sidebar' | 'footer' | 'popup';
  background_color: string | null;
  text_color: string | null;
  button_text: string | null;
  button_text_mm: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  display_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// Notifications
// ============================================

export type NotificationType = 'email' | 'sms' | 'push' | 'in_app';
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'read';

export interface NotificationTemplate {
  id: string;
  name: string;
  name_mm: string | null;
  template_type: NotificationType;
  event_type: string;
  subject: string | null;
  subject_mm: string | null;
  body: string;
  body_mm: string | null;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  template_id: string | null;
  notification_type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any>;
  read_at: string | null;
  sent_at: string | null;
  status: NotificationStatus;
  error_message: string | null;
  created_at: string;
}

// ============================================
// Agents
// ============================================

export interface Agent {
  id: string;
  agent_code: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string | null;
  city: string | null;
  wallet_id: string | null;
  wallet?: Wallet;
  commission_rate: number;
  credit_limit: number;
  is_active: boolean;
  is_verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentUser {
  id: string;
  agent_id: string;
  agent?: Agent;
  user_id: string;
  role: 'admin' | 'staff';
  permissions: string[];
  is_active: boolean;
  created_at: string;
}

// ============================================
// Operator Users
// ============================================

export interface OperatorUser {
  id: string;
  operator_id: string;
  operator?: Operator;
  user_id: string;
  role: 'admin' | 'manager' | 'staff';
  permissions: string[];
  is_active: boolean;
  created_at: string;
}

// ============================================
// Extended Booking
// ============================================

export interface ExtendedBooking extends Booking {
  wallet_id: string | null;
  gateway_transaction_id: string | null;
  commission_rule_id: string | null;
  platform_fee: number;
  operator_payout: number | null;
  agent_commission: number;
  booked_by: string | null;
  booking_source: string;
  agent_id: string | null;
}

// ============================================
// Dashboard Stats
// ============================================

export interface DashboardStats {
  totalBookings: number;
  totalRevenue: number;
  totalPassengers: number;
  activeOperators: number;
  activeAgents: number;
  pendingRefunds: number;
  totalWalletBalance: number;
  todayBookings: number;
  todayRevenue: number;
  monthlyGrowth: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    fill?: boolean;
  }[];
}

// ============================================
// Auth Context
// ============================================

export interface AuthUser {
  id: string;
  email: string;
  phone: string | null;
  role: SystemRole;
  profile: UserProfile | null;
  wallet: Wallet | null;
  operatorId?: string;
  agentId?: string;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  phone: string;
  name: string;
  role?: SystemRole;
}

// ============================================
// Session Management
// ============================================

export interface UserSession {
  id: string;
  user_id: string;
  device_name: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  ip_address: string | null;
  location: string | null;
  is_current: boolean;
  is_trusted: boolean;
  last_activity_at: string;
  expires_at: string;
  created_at: string;
}
