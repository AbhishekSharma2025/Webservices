(function(global) {
  var STORAGE_KEY = 'admin_auth_session';
  var configPromise = null;
  var supabaseClient = null;

  function loadConfig() {
    if (!configPromise) {
      configPromise = fetch('/admin/auth/config')
        .then(function(response) {
          return response.json().then(function(payload) {
            if (!response.ok) {
              throw new Error(payload.error || 'Failed to load auth configuration');
            }
            return payload;
          });
        });
    }

    return configPromise;
  }

  function getSupabase() {
    if (supabaseClient) {
      return Promise.resolve(supabaseClient);
    }

    return loadConfig().then(function(config) {
      if (!global.supabase || !global.supabase.createClient) {
        throw new Error('Supabase client library is not loaded');
      }

      supabaseClient = global.supabase.createClient(config.url, config.anonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });

      return supabaseClient;
    });
  }

  function saveSession(session) {
    if (!session || !session.access_token) {
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      user: {
        id: session.user.id,
        email: session.user.email
      }
    }));
  }

  function clearSession() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function getStoredSession() {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch (err) {
      clearSession();
      return null;
    }
  }

  function getAccessToken() {
    var session = getStoredSession();
    return session ? session.access_token : null;
  }

  function getUserEmail() {
    var session = getStoredSession();
    return session && session.user ? session.user.email : null;
  }

  function isSessionExpired(session) {
    if (!session || !session.expires_at) {
      return true;
    }

    return Date.now() / 1000 >= session.expires_at;
  }

  function requireAuth(redirectPath) {
    var session = getStoredSession();
    if (!session || isSessionExpired(session)) {
      clearSession();
      window.location.href = redirectPath || '/admin/login';
      return false;
    }

    return true;
  }

  function signIn(email, password) {
    return getSupabase().then(function(client) {
      return client.auth.signInWithPassword({
        email: email,
        password: password
      });
    }).then(function(result) {
      if (result.error) {
        throw result.error;
      }

      saveSession(result.data.session);
      return result.data;
    });
  }

  function signUp(email, password) {
    return getSupabase().then(function(client) {
      return client.auth.signUp({
        email: email,
        password: password
      });
    }).then(function(result) {
      if (result.error) {
        throw result.error;
      }

      if (result.data.session) {
        saveSession(result.data.session);
      }

      return result.data;
    });
  }

  function signOut() {
    clearSession();

    return getSupabase()
      .then(function(client) {
        return client.auth.signOut();
      })
      .catch(function() {
        return null;
      })
      .then(function() {
        window.location.href = '/admin/login';
      });
  }

  global.AdminAuth = {
    loadConfig: loadConfig,
    getAccessToken: getAccessToken,
    getUserEmail: getUserEmail,
    requireAuth: requireAuth,
    signIn: signIn,
    signUp: signUp,
    signOut: signOut,
    clearSession: clearSession
  };
})(window);
