
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Minimal polyfill for fetch if needed (Node 18+ has it built-in)
// import fetch from 'node-fetch'; 

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
        return null;
    }
    return data.data;
  } catch (e) {
      console.error("Fetch error:", e);
      return null;
  }
}

async function testEndpoints() {
  console.log('--- TikTok Finance API Test ---');
  
  // 1. Get connection
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
  
  console.log(`Using Shop Cipher: ${shopCipher}`);
  console.log(`Access Token: ${accessToken.substring(0, 10)}...`);

  // 2. Test Statement Transactions
  console.log('\n--- 1. Testing /finance/202309/statement_transactions/search ---');
  // Look back a few months to find data
  const startTime = Math.floor(new Date('2025-01-01').getTime() / 1000);
  const endTime = Math.floor(new Date().getTime() / 1000);
  
  const statements = await apiRequest(
    '/finance/202309/statement_transactions/search',
    'POST',
    accessToken,
    shopCipher,
    { page_size: '5' },
    {
        statement_time_ge: startTime,
        statement_time_lt: endTime,
        sort_field: 'statement_time',
        sort_order: 'DESC'
    }
  );
  
  if (statements) {
      console.log('SUCCESS! Found transactions:', statements.statement_transactions?.length || 0);
      if (statements.statement_transactions?.length > 0) {
          console.log('Sample transaction:', JSON.stringify(statements.statement_transactions[0], null, 2));
      }
  } else {
      console.log('FAILED to fetch statement transactions.');
  }

  // 3. Test Order Transactions (Get Transactions by Order)
  console.log('\n--- 2. Testing /finance/202309/orders/{order_id}/transactions ---');
  
  // Get a real order ID from DB
  const { data: orders } = await supabase
    .from('tiktok_orders')
    .select('order_id')
    .limit(1);
    
  if (orders && orders.length > 0) {
      const orderId = orders[0].order_id;
      console.log(`Testing with Order ID: ${orderId}`);
      
      const orderTrans = await apiRequest(
          `/finance/202309/orders/${orderId}/transactions`, // Check path carefully
          'GET',
          accessToken,
          shopCipher
      );

      if (orderTrans) {
          console.log('SUCCESS! Found order transactions.');
          console.log('Data:', JSON.stringify(orderTrans, null, 2));
      } else {
           console.log('FAILED to fetch order transactions. Attempting alternative path...');
           // Sometimes paths differ by region or version. 
      }
  } else {
      console.log('No orders found in DB to test.');
  }

  // 4. Test GMV Max / Ad Spend search
  console.log('\n--- 3. Testing Ad Spend / GMV Max via Statement Types ---');
  // If we got statements earlier, check their types
  if (statements?.statement_transactions) {
      const types = new Set(statements.statement_transactions.map((t: any) => t.transaction_type));
      console.log('Transaction Types found:', Array.from(types));
  }
}

testEndpoints();
