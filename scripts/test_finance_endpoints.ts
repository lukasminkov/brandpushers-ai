
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

function signRequest(path, params, body) {
  const sortedParams = Object.keys(params)
    .filter(k => k !== 'sign' && k !== 'access_token')
    .sort()
    .map(k => `${k}${params[k]}`)
    .join('');
  
  const baseString = TIKTOK_APP_SECRET + path + sortedParams + (body || '') + TIKTOK_APP_SECRET;
  
  return crypto.createHmac('sha256', TIKTOK_APP_SECRET)
    .update(baseString)
    .digest('hex');
}

async function testEndpoints() {
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
  
  console.log(`Testing with Shop Cipher: ${shopCipher}`);

  const timestamp = Math.floor(Date.now() / 1000).toString();
  
  // 0. Test /authorization/202309/shops (to verify access token and shop cipher validity)
  console.log('\n--- Testing GET /authorization/202309/shops ---');
  const path0 = '/authorization/202309/shops';
  const queryParams0 = {
    app_key: TIKTOK_APP_KEY,
    timestamp: timestamp,
    // Note: This endpoint usually doesn't need shop_cipher, but let's check without it first
  };
  
  const sign0 = signRequest(path0, queryParams0, '');
  const url0 = new URL(`https://open-api.tiktokglobalshop.com${path0}`);
  Object.entries(queryParams0).forEach(([k, v]) => url0.searchParams.set(k, v));
  url0.searchParams.set('sign', sign0);
  
  try {
    const res0 = await fetch(url0.toString(), {
      method: 'GET',
      headers: {
        'x-tts-access-token': accessToken,
        'Content-Type': 'application/json'
      }
    });
    const data0 = await res0.json();
    console.log('Status:', res0.status);
    console.log('Response:', JSON.stringify(data0, null, 2));
  } catch (e) {
    console.error('Error fetching endpoint 0:', e);
  }

  // 1. Test POST /finance/202309/statement_transactions/search
  console.log('\n--- Testing POST /finance/202309/statement_transactions/search ---');
  const path1 = '/finance/202309/statement_transactions/search';
  const queryParams1 = {
    app_key: TIKTOK_APP_KEY,
    timestamp: timestamp,
    shop_cipher: shopCipher,
    page_size: '10'
  };
  
  const body1 = JSON.stringify({
    statement_time_ge: Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000), // last 30 days
    statement_time_lt: Math.floor(Date.now() / 1000),
    sort_field: 'statement_time',
    sort_order: 'DESC'
  });
  
  const sign1 = signRequest(path1, queryParams1, body1);
  const url1 = new URL(`https://open-api.tiktokglobalshop.com${path1}`);
  Object.entries(queryParams1).forEach(([k, v]) => url1.searchParams.set(k, v));
  url1.searchParams.set('sign', sign1);
  
  try {
    const res1 = await fetch(url1.toString(), {
      method: 'POST',
      headers: {
        'x-tts-access-token': accessToken,
        'Content-Type': 'application/json'
      },
      body: body1
    });
    const data1 = await res1.json();
    console.log('Status:', res1.status);
    console.log('Response:', JSON.stringify(data1, null, 2));
  } catch (e) {
    console.error('Error fetching endpoint 1:', e);
  }


  // 3. Test /finance/202309/settlements/search (to verify basic finance access)
  console.log('\n--- Testing POST /finance/202309/settlements/search ---');
  const path3 = '/finance/202309/settlements/search';
  const queryParams3 = {
    app_key: TIKTOK_APP_KEY,
    timestamp: timestamp,
    shop_cipher: shopCipher,
    page_size: '10'
  };
  
  const body3 = JSON.stringify({
    request_time_ge: Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000), 
    request_time_lt: Math.floor(Date.now() / 1000)
  });
  
  const sign3 = signRequest(path3, queryParams3, body3);
  const url3 = new URL(`https://open-api.tiktokglobalshop.com${path3}`);
  Object.entries(queryParams3).forEach(([k, v]) => url3.searchParams.set(k, v));
  url3.searchParams.set('sign', sign3);
  
  try {
    const res3 = await fetch(url3.toString(), {
      method: 'POST',
      headers: {
        'x-tts-access-token': accessToken,
        'Content-Type': 'application/json'
      },
      body: body3
    });
    const data3 = await res3.json();
    console.log('Status:', res3.status);
    console.log('Response:', JSON.stringify(data3, null, 2));
  } catch (e) {
    console.error('Error fetching endpoint 3:', e);
  }

  const { data: orders } = await supabase
    .from('tiktok_orders')
    .select('order_id')
    .limit(1);
    
  if (orders && orders.length > 0) {
      const orderId = orders[0].order_id;
      console.log(`\n--- Testing GET /finance/202309/orders/${orderId}/transactions ---`);
      // Note: This endpoint might not exist or might be different. 
      // Documentation says "Get Transactions by Order" is usually /finance/202309/orders/{order_id}/transactions
      // But let's check the exact path. Some docs say /finance/202309/transactions?order_id=...
      
      const path2 = `/finance/202309/orders/${orderId}/transactions`;
       const params2 = {
        app_key: TIKTOK_APP_KEY,
        timestamp: timestamp,
        shop_cipher: shopCipher
      };
      
      const sign2 = signRequest(path2, params2, '');
       const url2 = new URL(`https://open-api.tiktokglobalshop.com${path2}`);
       Object.entries(params2).forEach(([k, v]) => url2.searchParams.set(k, v));
       url2.searchParams.set('sign', sign2);

      try {
        const res2 = await fetch(url2.toString(), {
            method: 'GET',
            headers: {
                'x-tts-access-token': accessToken,
                'Content-Type': 'application/json'
            }
        });
        const data2 = await res2.json();
        console.log('Status:', res2.status);
        console.log('Response:', JSON.stringify(data2, null, 2));
      } catch (e) {
        console.error('Error fetching endpoint 2:', e);
      }
  } else {
      console.log("No orders found in DB to test order transactions");
  }
}

testEndpoints();
