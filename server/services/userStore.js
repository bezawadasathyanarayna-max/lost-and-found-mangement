const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '../../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory cache loaded from JSON file
let users = [];
let sessions = {}; // token -> userId

function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const content = fs.readFileSync(USERS_FILE, 'utf8');
      users = JSON.parse(content || '[]');
    } else {
      // Default initial admin and student accounts for testing
      users = [
        {
          id: 'admin-001',
          email: 'admin@campus.edu',
          passwordHash: hashPassword('admin123'),
          full_name: 'Campus Administrator',
          roll_no: 'ADMIN-01',
          phone: '+91 9999999999',
          role: 'admin',
          created_at: new Date().toISOString(),
        },
      ];
      saveUsers();
    }
  } catch (e) {
    console.error('Error loading local users:', e);
    users = [];
  }
}

function saveUsers() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving local users:', e);
  }
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Initialize on load
loadUsers();

module.exports = {
  createUser({ email, password, fullName, rollNo, phone, role = 'user' }) {
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      throw new Error('User with this email already exists.');
    }

    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email: email.trim().toLowerCase(),
      passwordHash: hashPassword(password),
      full_name: fullName.trim(),
      roll_no: rollNo ? rollNo.trim() : 'N/A',
      phone: phone ? phone.trim() : '',
      role: role || 'user',
      created_at: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsers();

    const token = `local_token_${crypto.randomBytes(24).toString('hex')}`;
    sessions[token] = newUser.id;

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        roll_no: newUser.roll_no,
        phone: newUser.phone,
        role: newUser.role,
      },
      token,
    };
  },

  authenticateUser(email, password) {
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      throw new Error('Invalid email or password.');
    }

    if (user.passwordHash !== hashPassword(password)) {
      throw new Error('Invalid email or password.');
    }

    const token = `local_token_${crypto.randomBytes(24).toString('hex')}`;
    sessions[token] = user.id;

    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        roll_no: user.roll_no,
        phone: user.phone,
        role: user.role,
      },
      token,
    };
  },

  getUserByToken(token) {
    if (!token || !token.startsWith('local_token_')) return null;
    const userId = sessions[token];
    if (!userId) return null;
    const user = users.find((u) => u.id === userId);
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      profile: {
        id: user.id,
        full_name: user.full_name,
        roll_no: user.roll_no,
        phone: user.phone,
        role: user.role,
      },
    };
  },

  getAllUsers() {
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      full_name: u.full_name,
      roll_no: u.roll_no,
      phone: u.phone,
      role: u.role,
      created_at: u.created_at,
    }));
  },
};
