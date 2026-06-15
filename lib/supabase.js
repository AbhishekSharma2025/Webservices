var { createClient } = require('@supabase/supabase-js');

var url = process.env.SUPABASE_URL;
var key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
  module.exports = null;
} else {
  module.exports = createClient(url, key);
}
