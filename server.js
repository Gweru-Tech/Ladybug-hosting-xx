const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { Strategy } = require('passport-discord');
const path = require('path');
const dotenv = require('dotenv');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const http = require('http');
const socketIo = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Database setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/bot_hosting',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Initialize database tables
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        discord_id VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        avatar VARCHAR(255),
        access_token VARCHAR(255),
        refresh_token VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS bots (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        runtime VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'stopped',
        project_files JSONB,
        environment_vars JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
  }
}));

// Passport configuration
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

const discordStrategy = new Strategy({
  clientID: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  callbackURL: process.env.DISCORD_CALLBACK_URL || '/auth/discord/callback',
  scope: ['identify', 'email']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Save or update user in database
    const result = await pool.query(
      `INSERT INTO users (discord_id, username, email, avatar, access_token, refresh_token) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       ON CONFLICT (discord_id) 
       DO UPDATE SET 
         username = $2, 
         email = $3, 
         avatar = $4, 
         access_token = $5, 
         refresh_token = $6,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [profile.id, profile.username, profile.email, profile.avatar, accessToken, refreshToken]
    );
    
    profile.dbUser = result.rows[0];
    return done(null, profile);
  } catch (error) {
    return done(error, null);
  }
});

passport.use(discordStrategy);
app.use(passport.initialize());
app.use(passport.session());

// Socket.IO for real-time updates
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('subscribe-bot', (botId) => {
    socket.join(`bot-${botId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Routes
app.get('/', (req, res) => {
  res.render('index', { user: req.user });
});

app.get('/panel', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/auth/discord');
  }
  res.render('panel', { user: req.user });
});

app.get('/auth/discord', passport.authenticate('discord'));

app.get('/auth/discord/callback', 
  passport.authenticate('discord', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/panel');
  }
);

app.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
});

// API Routes
app.get('/api/bots', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const result = await pool.query(
      'SELECT * FROM bots WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.dbUser.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bots', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { name, description, runtime } = req.body;
  
  try {
    const result = await pool.query(
      'INSERT INTO bots (user_id, name, description, runtime) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.dbUser.id, name, description, runtime]
    );
    
    const bot = result.rows[0];
    io.emit('bot-created', bot);
    res.json(bot);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bots/:id/start', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const result = await pool.query(
      'UPDATE bots SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      ['running', req.params.id, req.user.dbUser.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bot not found' });
    }
    
    const bot = result.rows[0];
    io.to(`bot-${bot.id}`).emit('bot-status', { id: bot.id, status: 'running' });
    res.json(bot);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bots/:id/stop', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const result = await pool.query(
      'UPDATE bots SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      ['stopped', req.params.id, req.user.dbUser.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bot not found' });
    }
    
    const bot = result.rows[0];
    io.to(`bot-${bot.id}`).emit('bot-status', { id: bot.id, status: 'stopped' });
    res.json(bot);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: require('./package.json').version
  });
});

const PORT = process.env.PORT || 3000;

// Initialize database and start server
initDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
});