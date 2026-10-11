const { supabase, supabaseAdmin } = require('../config/supabase');

/**
 * Authentication Middleware:
 * Verifies Supabase JWT token from `Authorization: Bearer <token>` header
 * and attaches user object and user profile to req.user.
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Missing Bearer token.',
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization token format.',
      });
    }

    // Check local token first
    const userStore = require('../services/userStore');
    const localUser = userStore.getUserByToken(token);
    if (localUser) {
      req.user = localUser;
      req.token = token;
      return next();
    }

    // Verify token with Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication session. Please log in again.',
        error: authError?.message,
      });
    }

    // Fetch user profile from database
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Fallback if profile row is missing
    const userProfile = profile || {
      id: user.id,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Campus User',
      roll_no: user.user_metadata?.roll_no || 'N/A',
      phone: user.user_metadata?.phone || '',
      role: user.user_metadata?.role || 'user',
    };

    req.user = {
      ...user,
      profile: userProfile,
    };
    req.token = token;

    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server authentication error.',
      error: error.message,
    });
  }
};

/**
 * Optional Authentication Middleware:
 * If a valid Bearer token is provided, populates req.user.
 * If no token is provided, continues without error with req.user = null.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      req.user = null;
      return next();
    }

    const userStore = require('../services/userStore');
    const localUser = userStore.getUserByToken(token);
    if (localUser) {
      req.user = localUser;
      req.token = token;
      return next();
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      req.user = null;
      return next();
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    req.user = {
      ...user,
      profile: profile || {
        id: user.id,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || 'Campus User',
        roll_no: user.user_metadata?.roll_no || 'N/A',
        phone: user.user_metadata?.phone || '',
        role: user.user_metadata?.role || 'user',
      },
    };
    req.token = token;

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

/**
 * Admin Middleware:
 * Verifies that the authenticated user has an 'admin' role.
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
  }

  const role = req.user.profile?.role;
  if (role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Administrator privileges required.',
    });
  }

  next();
};

module.exports = {
  requireAuth,
  optionalAuth,
  requireAdmin,
};
