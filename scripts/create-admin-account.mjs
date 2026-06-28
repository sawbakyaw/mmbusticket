import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;
const adminName = process.env.ADMIN_NAME || 'System Administrator';

const missing = [
  ['SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL', supabaseUrl],
  ['SUPABASE_SERVICE_ROLE_KEY', serviceRoleKey],
  ['ADMIN_EMAIL', adminEmail],
  ['ADMIN_PASSWORD', adminPassword],
]
  .filter(([, value]) => !value)
  .map(([name]) => name);

if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function findUserByEmail(email) {
  const perPage = 100;

  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });

    if (error) {
      throw error;
    }

    const match = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (match) {
      return match;
    }

    if (data.users.length < perPage) {
      return null;
    }
  }

  throw new Error('Unable to find user after scanning the available user pages.');
}

async function upsertAdminProfile(userId) {
  const { data: role, error: roleError } = await supabase
    .from('roles')
    .select('id')
    .eq('name', 'super_admin')
    .single();

  if (roleError) {
    throw roleError;
  }

  const { error: profileError } = await supabase.from('user_profiles').upsert(
    {
      user_id: userId,
      role_id: role.id,
      email_verified: true,
      is_active: true,
    },
    { onConflict: 'user_id' }
  );

  if (profileError) {
    throw profileError;
  }

  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (walletError) {
    throw walletError;
  }

  if (!wallet) {
    const { error: createWalletError } = await supabase.from('wallets').insert({
      user_id: userId,
      wallet_type: 'user',
    });

    if (createWalletError) {
      throw createWalletError;
    }
  }
}

async function main() {
  const existingUser = await findUserByEmail(adminEmail);
  let user = existingUser;

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        name: adminName,
        role: 'super_admin',
      },
    });

    if (error) {
      throw error;
    }

    user = data.user;
  } else {
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        ...user.user_metadata,
        name: user.user_metadata?.name || adminName,
        role: 'super_admin',
      },
    });

    if (error) {
      throw error;
    }

    user = data.user;
  }

  await upsertAdminProfile(user.id);

  console.log(existingUser ? 'Admin account updated.' : 'Admin account created.');
}

main().catch((error) => {
  console.error(error.message || 'Failed to create admin account.');
  process.exit(1);
});
