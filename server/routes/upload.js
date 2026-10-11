const express = require('express');
const router = express.Router();
const multer = require('multer');
const { requireAuth } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');

// Configure multer in-memory storage (up to 5MB)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WEBP, GIF) are allowed.'));
    }
  },
});

/**
 * POST /api/upload
 * Securely uploads an image to Supabase Storage bucket 'item-images'
 */
router.post('/', requireAuth, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded.',
      });
    }

    const file = req.file;
    const fileExt = file.originalname.split('.').pop() || 'png';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `uploads/${req.user.id}/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('item-images')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error('Supabase storage upload error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload image to storage.',
        error: error.message,
      });
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('item-images')
      .getPublicUrl(filePath);

    return res.status(200).json({
      success: true,
      message: 'Image uploaded successfully.',
      imageUrl: publicUrl,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
