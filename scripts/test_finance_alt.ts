
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TIKTOK_APP_KEY = process.env.TIKTOK_APP_KEY;
const TIKTOK_APP_SECRET = process.env.TIKTOK_APP_SECRET;

if (!SUPABASE_URL || !SUPABASE_KEY || !TIKTOK_APP_KEY || !TIKTOK_APP_SECRET) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function getAppKey(): string {
  return TIKTOK_APP_KEY!;
}

function getAppSecret(): string {
  return TIKTOK_APP_SECRET!;
}

// Generate signature for TikTok API
function generateSign(
  path: string,
  queryParams: Record<string, string>,
  body?: string
): string {
  const appSecret = getAppSecret();
  
  const sortedParams = Object.keys(queryParams)
    .filter(k => k !== 'sign' && k !== 'access_token')
    .sort()
    .map(k => `${k}${queryParams[k]}`)
    .join('');
  
  const baseString = appSecret + path + sortedParams + (body || '') + appSecret;
  
  return crypto
    .createHmac('sha256', appSecret)
    .update(baseString)
    .digest('hex');
}

async function apiRequest(
  path: string,
  method: 'GET' | 'POST' = 'GET',
  accessToken: string,
  shopCipher?: string,
  queryExtra?: Record<string, string>,
  body?: Record<string, unknown>
): Promise<any> {
  const appKey = getAppKey();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  
  const queryParams: Record<string, string> = {
    app_key: appKey,
    timestamp,
    ...(shopCipher ? { shop_cipher: shopCipher } : {}),
    ...(queryExtra || {}),
  };
  
  const bodyStr = body ? JSON.stringify(body) : undefined;
  const sign = generateSign(path, queryParams, bodyStr);
  queryParams.sign = sign;
  
  const url = new URL(path, 'https://open-api.tiktokglobalshop.com');
  Object.entries(queryParams).forEach(([k, v]) => url.searchParams.set(k, v));
  
  const headers: Record<string, string> = {
    'x-tts-access-token': accessToken,
    'Content-Type': 'application/json',
  };
  
  console.log(`Calling ${method} ${url.toString().split('?')[0]}...`);
  
  try {
    const res = await fetch(url.toString(), {
        method,
        headers,
        ...(bodyStr ? { body: bodyStr } : {}),
    });

    const data = await res.json();
    
    if (data.code !== 0) {
        console.error(`Error ${data.code}: ${data.message}`);
        // Log more details if possible
        if (data.request_id) console.log(`Request ID: ${data.request_id}`);
        return null;
    }
    return data.data;
  } catch (e) {
      console.error("Fetch error:", e);
      return null;
  }
}

async function testEndpoints() {
  console.log('--- TikTok Finance API Alternative Tests ---');
  
  const { data: connections, error } = await supabase
    .from('tiktok_connections')
    .select('*')
    .limit(1);

  if (error || !connections || connections.length === 0) {
    console.error('No TikTok connection found', error);
    return;
  }

  const connection = connections[0];
  const accessToken = connection.access_token;
  const shopCipher = connection.shop_cipher;
  
  // 1. Test /finance/202305/financial_statements (older version?)
  // Actually, let's try just listing statements if possible, or Payments
  
  console.log('\n--- Testing /finance/202309/payments/search ---');
  // Maybe payments works?
  const startTime = Math.floor(new Date('2025-01-01').getTime() / 1000);
  const endTime = Math.floor(new Date().getTime() / 1000);

  await apiRequest(
    '/finance/202309/payments/search',
    'POST',
    accessToken,
    shopCipher,
    { page_size: '5' },
    {
        create_time_ge: startTime,
        create_time_lt: endTime
    }
  );

  // 2. Test "Get Order Statement Transactions" with different path format
  // Some docs say /finance/202309/orders/{order_id}/statement_transactions
  
  const { data: orders } = await supabase
    .from('tiktok_orders')
    .select('order_id')
    .limit(1);
    
  if (orders && orders.length > 0) {
      const orderId = orders[0].order_id;
      console.log(`\n--- Testing /finance/202309/orders/${orderId}/statement_transactions ---`);
      
      await apiRequest(
          `/finance/202309/orders/${orderId}/statement_transactions`,
          'GET',
          accessToken,
          shopCipher
      );
  }
}

testEndpoints();
