// ============================================
// INVENTORY MANAGEMENT - BACKEND SERVER
// ============================================

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.')); // Serve static files

// Database file path
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'inventory.json');

// Create data directory if it doesn't exist
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
    console.log('✅ Created data directory');
}

// Initialize database file if it doesn't exist
if (!fs.existsSync(DB_FILE)) {
    const initialData = {
        products: [],
        totalRevenue: 0
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    console.log('✅ Created database file');
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function readDatabase() {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading database:', error);
        return { products: [], totalRevenue: 0 };
    }
}

function writeDatabase(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing database:', error);
        return false;
    }
}

// ============================================
// API ROUTES
// ============================================

// GET - Fetch all products
app.get('/api/products', (req, res) => {
    console.log('📥 GET /api/products');
    const data = readDatabase();
    res.json(data);
});

// POST - Add new product
app.post('/api/products', (req, res) => {
    console.log('📥 POST /api/products', req.body);
    
    const { name, quantity, purchasePrice, sellingPrice } = req.body;
    
    // Validation
    if (!name || quantity === undefined || purchasePrice === undefined || sellingPrice === undefined) {
        return res.status(400).json({ 
            success: false, 
            message: 'All fields are required!' 
        });
    }

    const data = readDatabase();
    
    const newProduct = {
        id: Date.now(),
        name: name,
        quantity: parseInt(quantity),
        purchasePrice: parseFloat(purchasePrice),
        sellingPrice: parseFloat(sellingPrice),
        soldQuantity: 0,
        createdAt: new Date().toISOString()
    };

    data.products.push(newProduct);
    
    if (writeDatabase(data)) {
        console.log('✅ Product added:', newProduct.name);
        res.json({ 
            success: true, 
            message: 'Product added successfully!',
            product: newProduct 
        });
    } else {
        res.status(500).json({ 
            success: false, 
            message: 'Error saving product' 
        });
    }
});

// PUT - Sell product (update quantity)
app.put('/api/products/:id/sell', (req, res) => {
    console.log('📥 PUT /api/products/:id/sell', req.params.id, req.body);
    
    const productId = parseInt(req.params.id);
    const { quantity } = req.body;
    
    if (!quantity || quantity <= 0) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid quantity!' 
        });
    }

    const data = readDatabase();
    const product = data.products.find(p => p.id === productId);
    
    if (!product) {
        return res.status(404).json({ 
            success: false, 
            message: 'Product not found!' 
        });
    }

    if (product.quantity < quantity) {
        return res.status(400).json({ 
            success: false, 
            message: 'Not enough stock!' 
        });
    }

    // Update product
    product.quantity -= quantity;
    product.soldQuantity = (product.soldQuantity || 0) + quantity;
    
    // Update revenue
    const revenue = quantity * product.sellingPrice;
    data.totalRevenue += revenue;

    if (writeDatabase(data)) {
        console.log('✅ Product sold:', product.name, 'Qty:', quantity);
        res.json({ 
            success: true, 
            message: 'Product sold successfully!',
            revenue: revenue,
            product: product
        });
    } else {
        res.status(500).json({ 
            success: false, 
            message: 'Error updating product' 
        });
    }
});

// DELETE - Delete product
app.delete('/api/products/:id', (req, res) => {
    console.log('📥 DELETE /api/products/:id', req.params.id);
    
    const productId = parseInt(req.params.id);
    const data = readDatabase();
    
    const index = data.products.findIndex(p => p.id === productId);
    
    if (index === -1) {
        return res.status(404).json({ 
            success: false, 
            message: 'Product not found!' 
        });
    }

    const deletedProduct = data.products.splice(index, 1)[0];
    
    if (writeDatabase(data)) {
        console.log('✅ Product deleted:', deletedProduct.name);
        res.json({ 
            success: true, 
            message: 'Product deleted successfully!' 
        });
    } else {
        res.status(500).json({ 
            success: false, 
            message: 'Error deleting product' 
        });
    }
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log('');
    console.log('🚀 ================================');
    console.log('🚀 Inventory Management Server');
    console.log('🚀 ================================');
    console.log(`🚀 Server running on: http://localhost:${PORT}`);
    console.log(`🚀 Database: ${DB_FILE}`);
    console.log('🚀 ================================');
    console.log('');
});