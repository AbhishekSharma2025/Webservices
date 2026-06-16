function getPublicConfig() {
  var url = process.env.SUPABASE_URL;
  var anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return {
    url: url,
    anonKey: anonKey
  };
}

module.exports = {
  getPublicConfig: getPublicConfig
};
