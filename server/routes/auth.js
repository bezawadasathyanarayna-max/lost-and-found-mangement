const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');
const userStore = require('../services/userStore');

/**
 * POST /api/auth/signup
 * Register a new user profile with local session fallback
 */
router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, fullName, rollNo, phone } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      });
    }

    const isSupabaseConfigured = process.env.SUPABASE_URL && 
      !process.env.SUPABASE_URL.includes('your-project') && 
      !process.env.SUPABASE_URL.includes('xyzcompany');

    if (isSupabaseConfigured) {
      // Try to create in Supabase Auth via Admin Client
      const { data: userRecord, error: sbError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          roll_no: rollNo || 'N/A',
          phone: phone || '',
          role: 'user',
        },
      });

      if (!sbError && userRecord?.user) {
        // Create matching profile
        await supabaseAdmin.from('profiles').upsert({
          id: userRecord.user.id,
          full_name: fullName,
          roll_no: rollNo || 'N/A',
          phone: phone || '',
          role: 'user',
        });
      }
    }

    // Always ensure user is saved in local user store so session works reliably
    const result = userStore.createUser({
      email,
      password,
      fullName,
      rollNo,
      phone,
      role: 'user',
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Registration failed.',
    });
  }
});

/**
 * POST /api/auth/login
 * Sign in existing user with local fallback
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    // Authenticate against local user store
    const result = userStore.authenticateUser(email, password);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully!',
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Invalid email or password.',
    });
  }
});

/**
 * GET /api/auth/me
 * Returns current authenticated user profile
 */
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        ...req.user.profile,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/auth/profile
 * Updates current authenticated user profile
 */
router.put('/profile', requireAuth, async (req, res, next) => {
  try {
    const { full_name, roll_no, phone } = req.body;
    const updates = {};

    if (full_name && full_name.trim()) updates.full_name = full_name.trim();
    if (roll_no !== undefined) updates.roll_no = roll_no.trim();
    if (phone !== undefined) updates.phone = phone.trim();

    const { data: updatedProfile, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', req.user.id)
      .select('*')
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update profile.',
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: updatedProfile,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
