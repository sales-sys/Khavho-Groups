const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Set EJS as template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET || 'khavho-groups-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// Routes
app.get('/', (req, res) => {
    res.render('index', { 
        title: 'Khavho Groups - Leading Business Conglomerate',
        currentPage: 'home',
        user: req.session.user || null
    });
});

app.get('/about', (req, res) => {
    res.render('about', { 
        title: 'About Us - Khavho Groups',
        currentPage: 'about',
        user: req.session.user || null
    });
});

app.get('/services', (req, res) => {
    res.render('services', { 
        title: 'Our Services - Khavho Groups',
        currentPage: 'services',
        user: req.session.user || null
    });
});

app.get('/contact', (req, res) => {
    res.render('contact', { 
        title: 'Contact Us - Khavho Groups',
        currentPage: 'contact',
        user: req.session.user || null
    });
});

app.get('/login', (req, res) => {
    res.render('auth/login', { 
        title: 'Login - Khavho Groups',
        currentPage: 'login',
        user: req.session.user || null,
        error: req.query.error || null
    });
});

app.get('/register', (req, res) => {
    res.render('auth/register', { 
        title: 'Register - Khavho Groups',
        currentPage: 'register',
        user: req.session.user || null,
        error: req.query.error || null
    });
});

app.get('/products', (req, res) => {
    res.render('products', { 
        title: 'Products - Khavho Groups',
        currentPage: 'products',
        user: req.session.user || null
    });
});

app.get('/admin', (req, res) => {
    // Check if user is admin
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/login?error=unauthorized');
    }
    
    res.render('admin', { 
        title: 'Admin Dashboard - Khavho Groups',
        currentPage: 'admin',
        user: req.session.user
    });
});

// Company subsidiary pages
app.get('/khavho-capital', (req, res) => {
    res.render('subsidiaries/khavho-capital', { 
        title: 'Khavho Capital - Investment & Asset Management',
        currentPage: 'capital',
        user: req.session.user || null
    });
});

app.get('/khavho-holdings', (req, res) => {
    res.render('subsidiaries/khavho-holdings', { 
        title: 'Khavho Holdings - Construction & Development',
        currentPage: 'holdings',
        user: req.session.user || null
    });
});

app.get('/khavho-inter-africa', (req, res) => {
    res.render('subsidiaries/khavho-inter-africa', { 
        title: 'Khavho Inter Africa - Financial Services',
        currentPage: 'inter-africa',
        user: req.session.user || null
    });
});

// API Routes for authentication (to be used with Firebase)
app.post('/api/login', (req, res) => {
    // This will be handled by Firebase Auth on the frontend
    // But we can store session data here if needed
    res.json({ success: true, message: 'Login handled by Firebase' });
});

app.post('/api/register', (req, res) => {
    // This will be handled by Firebase Auth on the frontend
    res.json({ success: true, message: 'Registration handled by Firebase' });
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true, message: 'Logged out successfully' });
});

// Contact form submission
app.post('/api/contact', (req, res) => {
    const { name, email, message } = req.body;
    
    // Here you would typically save to database or send email
    console.log('Contact form submission:', { name, email, message });
    
    res.json({ success: true, message: 'Thank you for your message. We will get back to you soon!' });
});

// Error handling
app.use((req, res) => {
    res.status(404).render('error/404', { 
        title: 'Page Not Found - Khavho Groups',
        currentPage: 'error',
        user: req.session.user || null
    });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error/500', { 
        title: 'Server Error - Khavho Groups',
        currentPage: 'error',
        user: req.session.user || null
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Khavho Groups server running on http://localhost:${PORT}`);
    console.log(`📁 Views directory: ${path.join(__dirname, 'views')}`);
    console.log(`📁 Static files: ${path.join(__dirname, 'public')}`);
});