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

var adminBootstrap = require('./adminBootstrap');

async function authenticateRequest(req, res) {
  if (!supabase) {
    res.status(503).json({ error: 'Supabase is not configured' });
    return null;
  }

  var token = getBearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'Missing Bearer token' });
    return null;
  }

  var authResult = await supabase.auth.getUser(token);
  if (authResult.error || !authResult.data || !authResult.data.user) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return null;
  }

  return authResult.data.user;
}

async function requireAuthenticated(req, res, next) {
  try {
    var user = await authenticateRequest(req, res);
    if (!user) {
      return;
    }

    req.authUser = user;
    next();
  } catch (err) {
    next(err);
  }
}

async function requireAdmin(req, res, next) {
  try {
    var user = await authenticateRequest(req, res);
    if (!user) {
      return;
    }

    if (!adminBootstrap.hasAdminRole(user)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.adminUser = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  requireAuthenticated: requireAuthenticated,
  requireAdmin: requireAdmin
};
