import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Searching DB...");
    const { data: mune } = await supabase.from('ingredients_master').select('name').ilike('name', '%むね%');
    console.log("むね:", mune?.slice(0, 5));

    const { data: tori } = await supabase.from('ingredients_master').select('name').ilike('name', '%とり%');
    console.log("とり(ひらがな):", tori?.slice(0, 5));

    const { data: niku } = await supabase.from('ingredients_master').select('name').ilike('name', '%肉%');
    console.log("肉:", niku?.slice(0, 5));

    const { data: tamago } = await supabase.from('ingredients_master').select('name').ilike('name', '%卵%');
    console.log("卵:", tamago?.slice(0, 5));

    const { data: mune2 } = await supabase.from('ingredients_master').select('name').ilike('name', '%胸%');
    console.log("胸:", mune2?.slice(0, 5));
}
run();
