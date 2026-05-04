const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./db');
const errorHandler = require('./errorHandler');

const authRoutes = require('./routes/auth');
const requestRoutes = require('./routes/requests');
const collectorRoutes = require('./routes/collectors');
const recyclerRoutes = require('./routes/recyclers');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');
const transactionRoutes = require('./routes/transactions');

connectDB();

const app = express();
const server = http.createServer(app);

const ALLOWED_ORIGINS = [
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
  process.env.CLIENT_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.some((o) => (o instanceof RegExp ? o.test(origin) : o === origin))) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.some((o) => (o instanceof RegExp ? o.test(origin) : o === origin))) {
        callback(null, true);
      } else {
        callback(new Error(`Socket CORS: origin '${origin}' not allowed`));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io globally accessible for controllers
global.io = io;

// Socket.io connection handler
io.on('connection', (socket) => {
  // Each user joins their own room identified by userId
  socket.on('join', (userId) => {
    if (userId) {
      socket.join(userId.toString());
    }
  });

  // Collector joins a collector-specific room
  socket.on('join_collector', (userId) => {
    if (userId) {
      socket.join('collectors');
      socket.join(userId.toString());
    }
  });

  // Recycler joins a recycler-specific room
  socket.on('join_recycler', (userId) => {
    if (userId) {
      socket.join('recyclers');
      socket.join(userId.toString());
    }
  });

  socket.on('disconnect', () => {});
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(cors(corsOptions));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/collectors', collectorRoutes);
app.use('/api/recyclers', recyclerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/transactions', transactionRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Kabadi King API running', timestamp: new Date().toISOString() });
});

app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = { app, io };
