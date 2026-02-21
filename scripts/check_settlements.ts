
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkSettlements() {
  console.log('--- Checking Settlements for Ad Spend ---');
  
  // Get recent settlements
  const { data: settlements, error } = await supabase
    .from('tiktok_settlements')
    .select('*')
    .order('settlement_time', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching settlements:', error);
    return;
  }

  if (!settlements || settlements.length === 0) {
    console.log('No settlements found in DB.');
    return;
  }

  console.log(`Found ${settlements.length} recent settlements.`);
  
  // Inspect the structure for any ad-related fields or deduction types
  // Note: the settlement object structure depends on what was saved
  // If we saved raw data, we might see breakdown.
  
  // Let's print the keys of the first settlement to see available columns
  console.log('Settlement Keys:', Object.keys(settlements[0]));
  
  // If there is a 'raw_data' or similar JSON column, inspect it
  // Based on migration 005, it might be just flat columns.
  
  // Let's dump the first settlement
  console.log('Sample Settlement:', JSON.stringify(settlements[0], null, 2));
}

checkSettlements();
