type Filter = { column: string; operator: string; value: unknown };
type TableRows = Database['public']['Tables'];
type QueryResult<T> = { data: T; error: Error | null; count: number | null };
type QueryData<Row, Cardinality extends 'many' | 'single' | 'maybeSingle'> = Cardinality extends 'many' ? Row[] : Row | null;

class QueryBuilder<Row, Cardinality extends 'many' | 'single' | 'maybeSingle' = 'many'> implements PromiseLike<QueryResult<QueryData<Row, Cardinality>>> {
  private operation = 'select';
  private columns = '*';
  private values: Record<string, unknown> | null = null;
  private filters: Filter[] = [];
  private orders: { column: string; ascending: boolean }[] = [];
  private rowLimit: number | null = null;
  private countMode = false;
  private headMode = false;
  private cardinality: Cardinality = 'many' as Cardinality;

  constructor(private table: string) {}

  select(columns = '*', options?: { count?: string; head?: boolean }) {
    this.columns = columns;
    this.countMode = options?.count === 'exact';
    this.headMode = options?.head === true;
    return this;
  }

  insert(values: Record<string, unknown> | Record<string, unknown>[]) {
    this.operation = 'insert';
    this.values = Array.isArray(values) ? values[0] : values;
    return this;
  }

  update(values: Record<string, unknown>) {
    this.operation = 'update';
    this.values = values;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  eq(column: string, value: unknown) { this.filters.push({ column, operator: 'eq', value }); return this; }
  neq(column: string, value: unknown) { this.filters.push({ column, operator: 'neq', value }); return this; }
  in(column: string, value: unknown[]) { this.filters.push({ column, operator: 'in', value }); return this; }
  gt(column: string, value: unknown) { this.filters.push({ column, operator: 'gt', value }); return this; }
  gte(column: string, value: unknown) { this.filters.push({ column, operator: 'gte', value }); return this; }
  lt(column: string, value: unknown) { this.filters.push({ column, operator: 'lt', value }); return this; }
  lte(column: string, value: unknown) { this.filters.push({ column, operator: 'lte', value }); return this; }
  order(column: string, options?: { ascending?: boolean }) { this.orders.push({ column, ascending: options?.ascending !== false }); return this; }
  limit(value: number) { this.rowLimit = value; return this; }
  single(): QueryBuilder<Row, 'single'> { this.cardinality = 'single' as Cardinality; return this as unknown as QueryBuilder<Row, 'single'>; }
  maybeSingle(): QueryBuilder<Row, 'maybeSingle'> { this.cardinality = 'maybeSingle' as Cardinality; return this as unknown as QueryBuilder<Row, 'maybeSingle'>; }

  async then<TResult1 = QueryResult<QueryData<Row, Cardinality>>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<QueryData<Row, Cardinality>>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute(): Promise<QueryResult<QueryData<Row, Cardinality>>> {
    try {
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          table: this.table,
          operation: this.operation,
          columns: this.columns,
          values: this.values,
          filters: this.filters,
          orders: this.orders,
          limit: this.rowLimit,
          count: this.countMode,
          head: this.headMode,
        }),
      });
      const result = await response.json();
      if (!response.ok) return { data: null as QueryData<Row, Cardinality>, error: new Error(result.error || 'Database request failed'), count: null };
      let data = result.data;
      if (this.cardinality !== 'many' && Array.isArray(data)) {
        data = data[0] ?? null;
        if (!data && this.cardinality === 'single') return { data: null as QueryData<Row, Cardinality>, error: new Error('No rows found'), count: result.count ?? null };
      }
      return { data: data as QueryData<Row, Cardinality>, error: null, count: result.count ?? null };
    } catch {
      return { data: null as QueryData<Row, Cardinality>, error: new Error('Database request failed'), count: null };
    }
  }
}

function dispatchAuth(event: string, user?: any) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('app-auth-change', { detail: { event, user } }));
}

function from<K extends keyof TableRows>(table: K): QueryBuilder<TableRows[K]['Row'] & Record<string, any>>;
function from(table: string): QueryBuilder<any>;
function from(table: string) {
  return new QueryBuilder(table);
}

export const database = {
  from,
  rpc: async (name: string) => {
    const response = await fetch('/api/rpc', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    const result = await response.json();
    return { data: result.data ?? null, error: response.ok ? null : new Error(result.error || 'Request failed') };
  },
  auth: {
    async getSession() {
      const response = await fetch('/api/auth/session', { credentials: 'same-origin' });
      const result = await response.json();
      return { data: { session: result.user ? { user: result.user } : null }, error: null };
    },
    onAuthStateChange(callback: (event: string, session: any) => void) {
      const listener = (event: Event) => {
        const detail = (event as CustomEvent).detail;
        callback(detail.event, detail.user ? { user: detail.user } : null);
      };
      window.addEventListener('app-auth-change', listener);
      return { data: { subscription: { unsubscribe: () => window.removeEventListener('app-auth-change', listener) } } };
    },
    async signUp({ email, password, options }: { email: string; password: string; options?: { data?: { name?: string; phone?: string } } }) {
      const result = await requestAuth('/api/auth/signup', { email, password, ...options?.data });
      if (result.data?.user) dispatchAuth('SIGNED_IN', await getSessionUser());
      return result;
    },
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      const result = await requestAuth('/api/auth/signin', { email, password });
      if (result.data?.user) dispatchAuth('SIGNED_IN', await getSessionUser());
      return result;
    },
    async signOut() {
      await fetch('/api/auth/signout', { method: 'POST', credentials: 'same-origin' });
      dispatchAuth('SIGNED_OUT');
      return { error: null };
    },
  },
};

async function getSessionUser() {
  const response = await fetch('/api/auth/session', { credentials: 'same-origin' });
  return (await response.json()).user;
}

async function requestAuth(path: string, body: Record<string, unknown>) {
  try {
    const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok) return { data: { user: null }, error: new Error(result.error || 'Authentication failed') };
    return { data: { user: result.user }, error: null };
  } catch {
    return { data: { user: null }, error: new Error('Authentication request failed') };
  }
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      cities: {
        Row: {
          id: string;
          name: string;
          name_mm: string | null;
          is_popular: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          name_mm?: string | null;
          is_popular?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          name_mm?: string | null;
          is_popular?: boolean;
          created_at?: string;
        };
      };
      operators: {
        Row: {
          id: string;
          name: string;
          logo_url: string | null;
          description: string | null;
          contact_phone: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          logo_url?: string | null;
          description?: string | null;
          contact_phone?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          logo_url?: string | null;
          description?: string | null;
          contact_phone?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
      buses: {
        Row: {
          id: string;
          operator_id: string;
          bus_number: string;
          bus_type: string;
          total_seats: number;
          amenities: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          operator_id: string;
          bus_number: string;
          bus_type?: string;
          total_seats?: number;
          amenities?: string[];
          created_at?: string;
        };
      };
      routes: {
        Row: {
          id: string;
          from_city_id: string;
          to_city_id: string;
          distance_km: number | null;
          estimated_duration_minutes: number | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          from_city_id: string;
          to_city_id: string;
          distance_km?: number | null;
          estimated_duration_minutes?: number | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
      trips: {
        Row: {
          id: string;
          route_id: string;
          bus_id: string;
          operator_id: string;
          departure_time: string;
          arrival_time: string | null;
          base_price: number;
          foreigner_price: number | null;
          available_seats: number;
          status: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          route_id: string;
          bus_id: string;
          operator_id: string;
          departure_time: string;
          arrival_time?: string | null;
          base_price: number;
          foreigner_price?: number | null;
          available_seats?: number;
          status?: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          route_id?: string;
          bus_id?: string;
          operator_id?: string;
          departure_time?: string;
          arrival_time?: string | null;
          base_price?: number;
          foreigner_price?: number | null;
          available_seats?: number;
          status?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
      seats: {
        Row: {
          id: string;
          trip_id: string;
          seat_number: string;
          row_number: number;
          column_number: number;
          seat_type: string;
          status: string;
          price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          seat_number: string;
          row_number: number;
          column_number: number;
          seat_type?: string;
          status?: string;
          price: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          seat_number?: string;
          row_number?: number;
          column_number?: number;
          seat_type?: string;
          status?: string;
          price?: number;
          created_at?: string;
        };
      };
      seat_locks: {
        Row: {
          id: string;
          seat_id: string;
          trip_id: string;
          session_id: string;
          locked_at: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          seat_id: string;
          trip_id: string;
          session_id: string;
          locked_at?: string;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          seat_id?: string;
          trip_id?: string;
          session_id?: string;
          locked_at?: string;
          expires_at?: string;
          created_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          booking_reference: string;
          trip_id: string;
          schedule_id: string;
          status: 'pending' | 'confirmed' | 'cancelled';
          passenger_name: string;
          passenger_phone: string;
          passenger_email: string | null;
          passenger_nrc: string | null;
          seat_numbers: string[];
          total_amount: number;
          payment_method: string | null;
          payment_status: string;
          payment_reference: string | null;
          is_foreigner: boolean;
          notes: string | null;
          booked_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_reference?: string;
          trip_id: string;
          passenger_name: string;
          passenger_phone: string;
          status?: 'pending' | 'confirmed' | 'cancelled';
          passenger_email?: string | null;
          passenger_nrc?: string | null;
          seat_numbers: string[];
          total_amount: number;
          payment_method?: string | null;
          payment_status?: string;
          payment_reference?: string | null;
          is_foreigner?: boolean;
          notes?: string | null;
          booked_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_reference?: string;
          trip_id?: string;
          passenger_name?: string;
          passenger_phone?: string;
          passenger_email?: string | null;
          passenger_nrc?: string | null;
          seat_numbers?: string[];
          total_amount?: number;
          payment_method?: string | null;
          payment_status?: string;
          payment_reference?: string | null;
          is_foreigner?: boolean;
          notes?: string | null;
          booked_at?: string;
          created_at?: string;
        };
      };
      passengers: {
        Row: {
          id: string;
          booking_id: string;
          full_name: string;
          phone_number: string;
          nrc_number: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          full_name: string;
          phone_number: string;
          nrc_number?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          full_name?: string;
          phone_number?: string;
          nrc_number?: string | null;
          created_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          booking_id: string;
          payment_method: string | null;
          transaction_ref: string | null;
          payment_status: 'pending' | 'verified' | 'rejected';
          created_at: string;
          verified_at: string | null;
          verified_by: string | null;
        };
        Insert: {
          id?: string;
          booking_id: string;
          payment_method?: string | null;
          transaction_ref?: string | null;
          payment_status?: 'pending' | 'verified' | 'rejected';
          created_at?: string;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Update: {
          id?: string;
          booking_id?: string;
          payment_method?: string | null;
          transaction_ref?: string | null;
          payment_status?: 'pending' | 'verified' | 'rejected';
          created_at?: string;
          verified_at?: string | null;
          verified_by?: string | null;
        };
      };
    };
    Views: {};
    Functions: {
      generate_trip_seats: {
        Args: { trip_uuid: string; bus_total_seats: number; seat_price: number };
        Returns: void;
      };
      clean_expired_locks: {
        Args: {};
        Returns: void;
      };
      create_guest_booking: {
        Args: {
          p_trip_id: string;
          p_session_id: string;
          p_seat_numbers: string[];
          p_full_name: string;
          p_phone_number: string;
          p_email: string | null;
          p_nrc_number: string | null;
          p_is_foreigner: boolean;
          p_notes: string | null;
        };
        Returns: Json;
      };
    };
    Enums: {};
  };
}
