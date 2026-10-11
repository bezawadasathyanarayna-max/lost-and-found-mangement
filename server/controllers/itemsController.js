const { supabase, supabaseAdmin } = require('../config/supabase');

const VALID_CATEGORIES = [
  'Phone',
  'Laptop/System',
  'Wallet',
  'ID Card',
  'Keys',
  'Books',
  'Bag',
  'Earphones',
  'Watch',
  'Other',
];

const MOCK_ITEMS = [
  {
    id: "11111111-2222-3333-4444-555555555551",
    user_id: "u1",
    type: "lost",
    title: "Midnight Blue Dell XPS 15 Laptop",
    category: "Laptop/System",
    description: "Left near desk 14 on 2nd floor of Central Library. Has an Octocat and React sticker on the lid.",
    location: "Central Library, 2nd Floor",
    event_date: "2026-10-10",
    contact_phone: "+91 9876543210",
    image_url: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600&auto=format&fit=crop&q=80",
    status: "open",
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    profiles: { full_name: "Aarav Sharma", roll_no: "22CS104", phone: "+91 9876543210" }
  },
  {
    id: "11111111-2222-3333-4444-555555555552",
    user_id: "u2",
    type: "found",
    title: "Black Leather Fossil Wallet",
    category: "Wallet",
    description: "Found under table #5 in the North Campus Canteen during lunch hour. Contains campus cafeteria card.",
    location: "North Campus Canteen",
    event_date: "2026-10-11",
    contact_phone: "+91 9811223344",
    image_url: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&auto=format&fit=crop&q=80",
    status: "open",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    profiles: { full_name: "Sneha Patel", roll_no: "23EC089", phone: "+91 9811223344" }
  },
  {
    id: "11111111-2222-3333-4444-555555555553",
    user_id: "u3",
    type: "found",
    title: "Sony WH-1000XM4 Noise Canceling Headphones",
    category: "Earphones",
    description: "Found in Seminar Hall B after Guest Lecture on AI. Black case with charging cable included.",
    location: "Main Auditorium / Seminar Hall B",
    event_date: "2026-10-09",
    contact_phone: "+91 9870011223",
    image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
    status: "claimed",
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    profiles: { full_name: "Rohan Varma", roll_no: "21ME015", phone: "+91 9870011223" }
  },
  {
    id: "11111111-2222-3333-4444-555555555554",
    user_id: "u4",
    type: "lost",
    title: "College ID Card & RFID Lanyard",
    category: "ID Card",
    description: "Student identity card with blue college lanyard, name Kavya Iyer. Misplaced near Science Block labs.",
    location: "Science Complex, Block 3",
    event_date: "2026-10-10",
    contact_phone: "+91 9899887766",
    image_url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80",
    status: "open",
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    profiles: { full_name: "Kavya Iyer", roll_no: "23BT031", phone: "+91 9899887766" }
  },
  {
    id: "11111111-2222-3333-4444-555555555555",
    user_id: "u5",
    type: "found",
    title: "Honda Activa Key with Deadpool Keychain",
    category: "Keys",
    description: "Found on the walkway leading from Sports Complex to Boys Hostel Gate 2.",
    location: "Sports Ground / Hostel Walkway",
    event_date: "2026-10-11",
    contact_phone: "+91 9765432100",
    image_url: "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=600&auto=format&fit=crop&q=80",
    status: "open",
    created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    profiles: { full_name: "Campus Security Desk", roll_no: "STAFF-01", phone: "+91 9765432100" }
  },
  {
    id: "11111111-2222-3333-4444-555555555556",
    user_id: "u6",
    type: "lost",
    title: "Apple Watch Series 8 (Midnight Aluminum)",
    category: "Watch",
    description: "Lost during evening basketball practice on Court 1. Black sport band.",
    location: "Outdoor Basketball Court 1",
    event_date: "2026-10-09",
    contact_phone: "+91 9988776655",
    image_url: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80",
    status: "resolved",
    created_at: new Date(Date.now() - 3600000 * 30).toISOString(),
    profiles: { full_name: "Vikram Sengupta", roll_no: "22EE054", phone: "+91 9988776655" }
  }
];

/**
 * GET /api/items
 * Public/Protected feed of all items with search, filters, pagination
 */
const getItems = async (req, res, next) => {
  try {
    const {
      search,
      category,
      type,
      status,
      date,
      page = 1,
      limit = 12,
      sortBy = 'created_at',
      order = 'desc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const offset = (pageNum - 1) * limitNum;

    let items = [];
    let count = 0;

    // Check if Supabase is properly configured
    const isSupabaseConfigured = process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('your-project') && !process.env.SUPABASE_URL.includes('xyzcompany');

    if (isSupabaseConfigured) {
      let query = supabaseAdmin
        .from('items')
        .select('*, profiles:user_id(id, full_name, roll_no, phone, role)', { count: 'exact' });

      if (type && ['lost', 'found'].includes(type.toLowerCase())) {
        query = query.eq('type', type.toLowerCase());
      }
      if (category && category !== 'All') {
        query = query.eq('category', category);
      }
      if (status && status !== 'All') {
        query = query.eq('status', status.toLowerCase());
      }
      if (date) {
        query = query.eq('event_date', date);
      }
      if (search && search.trim()) {
        const cleanSearch = search.trim();
        query = query.or(`title.ilike.%${cleanSearch}%,description.ilike.%${cleanSearch}%,location.ilike.%${cleanSearch}%`);
      }

      query = query
        .order(sortBy, { ascending: order.toLowerCase() === 'asc' })
        .range(offset, offset + limitNum - 1);

      const result = await query;
      if (!result.error && result.data && result.data.length > 0) {
        items = result.data;
        count = result.count || items.length;
      } else if (!result.error && result.data) {
        items = [];
        count = 0;
      } else {
        console.warn('Supabase items query error, serving demo seed items:', result.error?.message);
        items = MOCK_ITEMS;
        count = MOCK_ITEMS.length;
      }
    } else {
      // Demo dataset with in-memory filtering
      let filtered = [...MOCK_ITEMS];
      if (type && ['lost', 'found'].includes(type.toLowerCase())) {
        filtered = filtered.filter(i => i.type === type.toLowerCase());
      }
      if (category && category !== 'All') {
        filtered = filtered.filter(i => i.category === category);
      }
      if (status && status !== 'All') {
        filtered = filtered.filter(i => i.status === status.toLowerCase());
      }
      if (date) {
        filtered = filtered.filter(i => i.event_date === date);
      }
      if (search && search.trim()) {
        const s = search.toLowerCase();
        filtered = filtered.filter(i => 
          i.title.toLowerCase().includes(s) || 
          i.description.toLowerCase().includes(s) || 
          i.location.toLowerCase().includes(s)
        );
      }
      count = filtered.length;
      items = filtered.slice(offset, offset + limitNum);
    }

    // Check user authentication for contact privacy
    const isAuthenticated = Boolean(req.user);

    const sanitizedItems = (items || []).map((item) => {
      const isOwner = req.user && req.user.id === item.user_id;
      const isAdmin = req.user && req.user.profile?.role === 'admin';

      if (!isAuthenticated) {
        return {
          ...item,
          contact_phone: '🔒 Log in to view',
          isContactLocked: true,
          profiles: item.profiles ? {
            full_name: item.profiles.full_name,
            roll_no: 'Hidden',
            phone: 'Hidden',
          } : null,
        };
      }

      return {
        ...item,
        isContactLocked: false,
        isOwner: isOwner || isAdmin,
      };
    });

    const totalPages = Math.ceil((count || 0) / limitNum) || 1;

    return res.status(200).json({
      success: true,
      count: count || 0,
      totalPages,
      currentPage: pageNum,
      limit: limitNum,
      data: sanitizedItems,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/items/:id
 * Retrieve a single item by its ID
 */
const getItemById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let item = null;
    if (process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('your-project') && !process.env.SUPABASE_URL.includes('xyzcompany')) {
      const { data, error } = await supabaseAdmin
        .from('items')
        .select('*, profiles:user_id(id, full_name, roll_no, phone, role)')
        .eq('id', id)
        .single();
      if (!error && data) item = data;
    }

    if (!item) {
      item = MOCK_ITEMS.find((i) => i.id === id);
    }

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found.',
      });
    }

    const isAuthenticated = Boolean(req.user);
    const isOwner = req.user && req.user.id === item.user_id;
    const isAdmin = req.user && req.user.profile?.role === 'admin';

    let sanitizedItem = { ...item };
    if (!isAuthenticated) {
      sanitizedItem.contact_phone = '🔒 Log in to view contact details';
      sanitizedItem.isContactLocked = true;
      if (sanitizedItem.profiles) {
        sanitizedItem.profiles = {
          full_name: sanitizedItem.profiles.full_name,
          roll_no: 'Hidden',
          phone: 'Hidden',
        };
      }
    } else {
      sanitizedItem.isContactLocked = false;
      sanitizedItem.isOwner = isOwner || isAdmin;
    }

    return res.status(200).json({
      success: true,
      data: sanitizedItem,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/items
 * Create a new lost or found report (Auth Required)
 */
const createItem = async (req, res, next) => {
  try {
    const {
      type,
      title,
      category,
      description,
      location,
      event_date,
      contact_phone,
      image_url,
    } = req.body;

    // Validation
    const errors = [];
    if (!type || !['lost', 'found'].includes(type.toLowerCase())) {
      errors.push("Type must be either 'lost' or 'found'.");
    }
    if (!title || title.trim().length < 3) {
      errors.push('Title must be at least 3 characters long.');
    }
    if (!category || !VALID_CATEGORIES.includes(category)) {
      errors.push(`Category must be one of: ${VALID_CATEGORIES.join(', ')}.`);
    }
    if (!description || description.trim().length < 5) {
      errors.push('Description must be at least 5 characters long.');
    }
    if (!location || location.trim().length < 2) {
      errors.push('Location is required.');
    }
    if (!contact_phone || contact_phone.trim().length < 5) {
      errors.push('A valid contact phone number is required.');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors,
      });
    }

    const newItem = {
      user_id: req.user.id,
      type: type.toLowerCase(),
      title: title.trim(),
      category,
      description: description.trim(),
      location: location.trim(),
      event_date: event_date || new Date().toISOString().split('T')[0],
      contact_phone: contact_phone.trim(),
      image_url: image_url || null,
      status: 'open',
    };

    let createdItem = null;
    const isSupabaseConfigured = process.env.SUPABASE_URL && 
      !process.env.SUPABASE_URL.includes('your-project') && 
      !process.env.SUPABASE_URL.includes('xyzcompany');

    if (isSupabaseConfigured) {
      const { data, error } = await supabaseAdmin
        .from('items')
        .insert([newItem])
        .select('*, profiles:user_id(id, full_name, roll_no, phone)')
        .single();
      if (!error && data) createdItem = data;
    }

    if (!createdItem) {
      createdItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        ...newItem,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profiles: req.user.profile || {
          full_name: req.user.user_metadata?.full_name || 'Campus Member',
          roll_no: req.user.user_metadata?.roll_no || 'N/A',
          phone: newItem.contact_phone,
        },
      };
      MOCK_ITEMS.unshift(createdItem);
    }

    return res.status(201).json({
      success: true,
      message: 'Item reported successfully!',
      data: createdItem,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/items/:id
 * Update an existing report (Owner or Admin only)
 */
const updateItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      category,
      description,
      location,
      event_date,
      contact_phone,
      image_url,
      status,
      type,
    } = req.body;

    // Fetch existing item
    const { data: existingItem, error: findError } = await supabaseAdmin
      .from('items')
      .select('*')
      .eq('id', id)
      .single();

    if (findError || !existingItem) {
      return res.status(404).json({
        success: false,
        message: 'Item not found.',
      });
    }

    // Permission check
    const isOwner = req.user.id === existingItem.user_id;
    const isAdmin = req.user.profile?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to edit this report.',
      });
    }

    const updates = {};
    if (title !== undefined && title.trim()) updates.title = title.trim();
    if (category !== undefined && VALID_CATEGORIES.includes(category)) updates.category = category;
    if (type !== undefined && ['lost', 'found'].includes(type.toLowerCase())) updates.type = type.toLowerCase();
    if (description !== undefined && description.trim()) updates.description = description.trim();
    if (location !== undefined && location.trim()) updates.location = location.trim();
    if (event_date !== undefined) updates.event_date = event_date;
    if (contact_phone !== undefined && contact_phone.trim()) updates.contact_phone = contact_phone.trim();
    if (image_url !== undefined) updates.image_url = image_url;
    if (status !== undefined && ['open', 'claimed', 'resolved'].includes(status.toLowerCase())) {
      updates.status = status.toLowerCase();
    }
    updates.updated_at = new Date().toISOString();

    const { data: updatedItem, error: updateError } = await supabaseAdmin
      .from('items')
      .update(updates)
      .eq('id', id)
      .select('*, profiles:user_id(id, full_name, roll_no, phone)')
      .single();

    if (updateError) {
      console.error('Error updating item:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to update item report.',
        error: updateError.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Item updated successfully!',
      data: updatedItem,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/items/:id
 * Delete an item (Owner or Admin only)
 */
const deleteItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: existingItem, error: findError } = await supabaseAdmin
      .from('items')
      .select('*')
      .eq('id', id)
      .single();

    if (findError || !existingItem) {
      return res.status(404).json({
        success: false,
        message: 'Item not found.',
      });
    }

    const isOwner = req.user.id === existingItem.user_id;
    const isAdmin = req.user.profile?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to delete this report.',
      });
    }

    const { error: deleteError } = await supabaseAdmin
      .from('items')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting item:', deleteError);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete item.',
        error: deleteError.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Item deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/my-items
 * Get all reports created by the currently authenticated user
 */
const getMyItems = async (req, res, next) => {
  try {
    const userId = req.user.id;

    let items = [];
    const isSupabaseConfigured = process.env.SUPABASE_URL && 
      !process.env.SUPABASE_URL.includes('your-project') && 
      !process.env.SUPABASE_URL.includes('xyzcompany');

    if (isSupabaseConfigured) {
      const { data, error } = await supabaseAdmin
        .from('items')
        .select('*, profiles:user_id(id, full_name, roll_no, phone)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (!error && data) items = data;
    }

    if (items.length === 0) {
      items = MOCK_ITEMS.filter((i) => i.user_id === userId);
    }

    const total = items?.length || 0;
    const open = items?.filter((i) => i.status === 'open').length || 0;
    const resolved = items?.filter((i) => i.status === 'resolved' || i.status === 'claimed').length || 0;

    return res.status(200).json({
      success: true,
      stats: {
        total,
        open,
        resolved,
      },
      data: items || [],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  getMyItems,
  VALID_CATEGORIES,
};
