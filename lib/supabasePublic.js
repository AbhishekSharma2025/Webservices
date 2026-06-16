function normalizeSiteUrl(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }

  return value.replace(/\/+$/, '');
}

function getPublicConfig() {
  var url = process.env.SUPABASE_URL;
  var anonKey = process.env.SUPABASE_ANON_KEY;
  var siteUrl = normalizeSiteUrl(process.env.APP_URL || process.env.SITE_URL);

  if (!url || !anonKey) {
    return null;
  }

  return {
    url: url,
    anonKey: anonKey,
    siteUrl: siteUrl
  };
}

module.exports = {
  getPublicConfig: getPublicConfig
};
