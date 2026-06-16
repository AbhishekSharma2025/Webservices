var supabase = require('./supabase');

function getBearerToken(req) {
  var authHeader = req.headers.authorization;

  if (!authHeader || typeof authHeader !== 'string') {
    return null;
  }

  var parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

async function requireAdmin(req, res, next) {
  if (!supabase) {
    return res.status(503).json({ error: 'Supabase is not configured' });
  }

  var token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Missing Bearer token' });
  }

  try {
    var authResult = await supabase.auth.getUser(token);
    if (authResult.error || !authResult.data || !authResult.data.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    var user = authResult.data.user;
    var roleFromMetadata =
      user.app_metadata &&
      (user.app_metadata.role || user.app_metadata.user_role);

    if (roleFromMetadata !== 'admin' && roleFromMetadata !== 'super_admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.adminUser = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  requireAdmin: requireAdmin
};
