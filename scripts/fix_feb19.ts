
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixFeb19() {
  console.log('--- Fixing Feb 19 Ad Spend ---');
  
  // 1. Find the entry
  const { data: entries, error } = await supabase
    .from('bible_daily_entries')
    .select('*')
    .eq('date', '2026-02-19')
    .eq('platform', 'tiktok_shop');

  if (error) {
    console.error('Error finding entry:', error);
    return;
  }

  if (!entries || entries.length === 0) {
    console.log('No entry found for Feb 19');
    return;
  }

  const entry = entries[0];
  console.log('Found entry:', entry.id);
  console.log('Current ad_spend:', entry.ad_spend);
  console.log('Current gmv_max_ad_spend:', entry.gmv_max_ad_spend);

  // 2. Update to 0
  const { error: updateError } = await supabase
    .from('bible_daily_entries')
    .update({ 
      ad_spend: 0,
      gmv_max_ad_spend: 0
    })
    .eq('id', entry.id);

  if (updateError) {
    console.error('Error updating entry:', updateError);
  } else {
    console.log('Successfully cleared ad spend for Feb 19');
  }
}

fixFeb19();
