import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vrfjpqseqenhtaxohcxz.supabase.co'
const supabaseKey = 'sb_publishable_-fOSCrQTyqEkaHPhWZHrHA_CpNeSHg3'

export const supabase = createClient(supabaseUrl, supabaseKey)
