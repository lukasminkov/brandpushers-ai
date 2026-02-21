
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkConnection() {
  const { data: connections, error } = await supabase
    .from('tiktok_connections')
    .select('*')
    .limit(1);

  if (error || !connections || connections.length === 0) {
    console.error('No TikTok connection found', error);
    return;
  }

  const connection = connections[0];
  console.log('--- Connection Info ---');
  console.log('ID:', connection.id);
  console.log('User ID:', connection.user_id);
  console.log('Shop Name:', connection.shop_name);
  console.log('Created At:', connection.created_at);
  console.log('Updated At:', connection.updated_at);
  
  // Check if token_expires_at is a timestamp or date string
  const tokenExpiresAt = connection.access_token_expire_in; // This column name might be wrong based on schema, let's just dump the object
  console.log('Token Expires At (raw):', connection.access_token_expire_in);
  console.log('Refresh Token Expires At (raw):', connection.refresh_token_expire_in);
  
  // Also check if we have any other timestamps related to the connection
  console.log('Full Connection Object:', JSON.stringify(connection, null, 2));
}

checkConnection();
