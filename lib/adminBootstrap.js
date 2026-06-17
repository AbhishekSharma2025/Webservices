var supabase = require('./supabase');

function getAllowedEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(function(email) {
      return email.trim().toLowerCase();
    })
    .filter(Boolean);
}

function hasAdminRole(user) {
  var role =
    user &&
    user.app_metadata &&
    (user.app_metadata.role || user.app_metadata.user_role);

  return role === 'admin' || role === 'super_admin';
}

function isEligibleForGrant(user) {
  if (!user || !user.email) {
    return false;
  }

  if (hasAdminRole(user)) {
    return true;
  }

  if (process.env.AUTO_GRANT_ADMIN === 'false') {
    var strictEmails = getAllowedEmails();
    return strictEmails.indexOf(user.email.toLowerCase()) !== -1;
  }

  var allowedEmails = getAllowedEmails();
  if (allowedEmails.length > 0) {
    return allowedEmails.indexOf(user.email.toLowerCase()) !== -1;
  }

  return true;
}

function getUnauthorizedMessage(user) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return 'Server is missing SUPABASE_SERVICE_ROLE_KEY. Add it in Render environment variables.';
  }

  var allowedEmails = getAllowedEmails();
  if (allowedEmails.length > 0) {
    return (
      'Email "' + user.email + '" is not in ADMIN_EMAILS. ' +
      'Add it on Render or set AUTO_GRANT_ADMIN=true.'
    );
  }

  return 'Admin access could not be granted for this account.';
}

async function grantAdminRole(userId) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required to grant admin access from API');
  }

  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  var result = await supabase.auth.admin.updateUserById(userId, {
    app_metadata: { role: 'admin' }
  });

  if (result.error) {
    throw result.error;
  }

  return result.data.user;
}

async function bootstrapAdminUser(user) {
  if (hasAdminRole(user)) {
    return {
      granted: true,
      alreadyAdmin: true,
      user: user
    };
  }

  if (!isEligibleForGrant(user)) {
    return {
      granted: false,
      reason: getUnauthorizedMessage(user)
    };
  }

  var updatedUser = await grantAdminRole(user.id);

  return {
    granted: true,
    alreadyAdmin: false,
    user: updatedUser
  };
}

module.exports = {
  bootstrapAdminUser: bootstrapAdminUser,
  hasAdminRole: hasAdminRole,
  isEligibleForGrant: isEligibleForGrant
};
