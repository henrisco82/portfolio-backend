const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : true, // Allow all origins in development
    methods: ['GET', 'HEAD', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false
};

app.use(cors(corsOptions));

// Middleware for basic logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Endpoint to serve CV PDF
app.get('/cv', (req, res) => {
    const cvPath = path.join(__dirname, 'public', 'henry_cv.pdf');
    
    // Check if the CV file exists
    if (!fs.existsSync(cvPath)) {
        return res.status(404).json({
            error: 'CV file not found',
            message: 'Please place your CV file at ./public/henry_cv.pdf'
        });
    }

    try {
        // Set appropriate headers for PDF file download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="henry_cv.pdf"');

        // Stream the PDF file
        const fileStream = fs.createReadStream(cvPath);
        fileStream.pipe(res);
        
        fileStream.on('error', (err) => {
            console.error('Error streaming PDF:', err);
            res.status(500).json({
                error: 'Error serving PDF file',
                message: err.message
            });
        });
        
    } catch (error) {
        console.error('Error serving CV:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        message: 'CV PDF Server is running'
    });
});

// Root endpoint with instructions
app.get('/', (req, res) => {
    res.json({
        message: 'CV PDF Server',
        endpoints: {
            '/cv': 'GET - Download/view CV PDF file',
            '/health': 'GET - Health check'
        },
        instructions: 'Place your CV file at ./public/cv.pdf'
    });
});

// Handle 404 for other routes
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        availableEndpoints: ['/cv', '/health', '/']
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`CV PDF Server is running on port ${PORT}`);
    console.log(`Access your CV at: http://localhost:${PORT}/cv`);
    console.log(`Make sure to place your CV file at: ./public/cv.pdf`);
});

module.exports = app;