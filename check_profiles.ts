import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDuplicates() {
    const userId = '606723cf-84a4-47f7-8f7a-3fc2363364f4';

    // Exact requested query: SELECT id, user_id, full_name FROM profiles WHERE user_id = '606723cf-84a4-47f7-8f7a-3fc2363364f4';
    const { data: reqData, error: reqErr } = await supabase
        .from('profiles')
        .select('id, user_id, full_name')
        .eq('user_id', userId);

    console.log("----_OUTPUT_----");
    console.log(JSON.stringify(reqData, null, 2));
    console.log("----_END_OUTPUT_----");
}

checkDuplicates();
