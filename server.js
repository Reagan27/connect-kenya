const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');



const multer = require('multer');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;


const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));


const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'Guletbaa2@'
});


async function initDB() {
    try {
       
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'user',
                phone VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS counties (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE
            )
        `);

      
        await pool.query(`
            CREATE TABLE IF NOT EXISTS areas (
                id SERIAL PRIMARY KEY,
                county_id INTEGER REFERENCES counties(id),
                name VARCHAR(100) NOT NULL,
                UNIQUE(county_id, name)
            )
        `);

        
        await pool.query('DROP TABLE IF EXISTS events');

     
        await pool.query(`
            CREATE TABLE events (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                category VARCHAR(100) NOT NULL,
                county VARCHAR(100) NOT NULL,
                area VARCHAR(100) NOT NULL,
                description TEXT NOT NULL,
                date DATE NOT NULL,
                time TIME,
                price INTEGER DEFAULT 0,
                organizer VARCHAR(255) NOT NULL,
                organizer_id INTEGER REFERENCES users(id),
                icon VARCHAR(50),
                attendees INTEGER DEFAULT 0,
                max_attendees INTEGER,
                location VARCHAR(255),
                contact VARCHAR(255),
                status VARCHAR(50) DEFAULT 'pending',
                is_vip BOOLEAN DEFAULT false,
                mpesa_code VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        
        const adminEmail = 'luttareagan22@gmail.com';
        const adminPassword = await bcrypt.hash('Guletbaa2@', 10);
        const adminExists = await pool.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
        if (adminExists.rows.length === 0) {
            await pool.query(
                'INSERT INTO users (name, email, password, role, phone) VALUES ($1, $2, $3, $4, $5)',
                ['Admin User', adminEmail, adminPassword, 'admin', '+254700000000']
            );
            console.log('Admin user created: luttareagan22@gmail.com');
        }

        // Insert sample users if few exist
        const userCount = await pool.query('SELECT COUNT(*) FROM users');
        if (parseInt(userCount.rows[0].count) < 4) {
            const sampleUsers = [
                { name: 'John Kamau', email: 'john@example.com', password: await bcrypt.hash('password123', 10), phone: '+254722000001' },
                { name: 'Mary Achieng', email: 'mary@example.com', password: await bcrypt.hash('password123', 10), phone: '+254733000002' },
                { name: 'David Kiprotich', email: 'david@example.com', password: await bcrypt.hash('password123', 10), phone: '+254744000003' }
            ];
            for (const user of sampleUsers) {
                await pool.query(
                    'INSERT INTO users (name, email, password, phone) VALUES ($1, $2, $3, $4)',
                    [user.name, user.email, user.password, user.phone]
                );
            }
            console.log('Sample users created.');
        }

        // Insert counties and areas (full 47 Kenyan counties)
        const kenyaData = {
            "Nairobi": ["Westlands", "Dagoretti North", "Dagoretti South", "Langata", "Kibra", "Roysambu", "Kasarani", "Ruaraka", "Embakasi South", "Embakasi North", "Embakasi Central", "Embakasi East", "Embakasi West", "Makadara", "Kamukunji", "Starehe", "Mathare"],
            "Mombasa": ["Changamwe", "Jomvu", "Kisauni", "Nyali", "Likoni", "Mvita"],
            "Kwale": ["Msambweni", "Lunga Lunga", "Matuga", "Kinango"],
            "Kilifi": ["Kilifi North", "Kilifi South", "Kaloleni", "Rabai", "Ganze", "Malindi", "Magarini"],
            "Tana River": ["Garsen", "Galole", "Bura"],
            "Lamu": ["Lamu East", "Lamu West"],
            "Taita Taveta": ["Taveta", "Wundanyi", "Mwatate", "Voi"],
            "Garissa": ["Garissa Township", "Balambala", "Lagdera", "Dadaab", "Fafi", "Ijara"],
            "Wajir": ["Wajir North", "Wajir East", "Tarbaj", "Wajir West", "Eldas", "Wajir South"],
            "Mandera": ["Mandera West", "Banissa", "Mandera North", "Mandera South", "Mandera East", "Lafey"],
            "Marsabit": ["Moyale", "North Horr", "Saku", "Laisamis"],
            "Isiolo": ["Isiolo North", "Isiolo South"],
            "Meru": ["Igembe South", "Igembe Central", "Igembe North", "Tigania West", "Tigania East", "North Imenti", "Buuri", "Central Imenti", "South Imenti"],
            "Tharaka Nithi": ["Maara", "Chuka/Igambang'ombe", "Tharaka"],
            "Embu": ["Manyatta", "Runyenjes", "Mbeere South", "Mbeere North"],
            "Kitui": ["Mwingi North", "Mwingi West", "Mwingi Central", "Kitui West", "Kitui Rural", "Kitui Central", "Kitui East", "Kitui South"],
            "Machakos": ["Masinga", "Yatta", "Kangundo", "Matungulu", "Kathiani", "Mavoko", "Machakos Town", "Mwala"],
            "Makueni": ["Mbooni", "Kilome", "Kaiti", "Makueni", "Kibwezi West", "Kibwezi East"],
            "Nyandarua": ["Kinangop", "Kipipiri", "Ol Kalou", "Ol Joro Orok", "Ndaragwa"],
            "Nyeri": ["Tetu", "Kieni", "Mathira", "Othaya", "Mukurweini", "Nyeri Town"],
            "Kirinyaga": ["Mwea", "Gichugu", "Ndia", "Kirinyaga Central"],
            "Murang'a": ["Kangema", "Mathioya", "Kiharu", "Kigumo", "Maragwa", "Kandara", "Gatanga"],
            "Kiambu": ["Gatundu South", "Gatundu North", "Juja", "Thika Town", "Ruiru", "Githunguri", "Kiambu", "Kiambaa", "Kabete", "Kikuyu", "Limuru", "Lari"],
            "Turkana": ["Turkana North", "Turkana West", "Turkana Central", "Loima", "Turkana South", "Turkana East"],
            "West Pokot": ["Kapenguria", "Sigor", "Kacheliba", "Pokot South"],
            "Samburu": ["Samburu West", "Samburu North", "Samburu East"],
            "Trans Nzoia": ["Kwanza", "Endebess", "Saboti", "Kiminini", "Cherangany"],
            "Uasin Gishu": ["Soy", "Turbo", "Moiben", "Ainabkoi", "Kapseret", "Kesses"],
            "Elgeyo Marakwet": ["Marakwet East", "Marakwet West", "Keiyo North", "Keiyo South"],
            "Nandi": ["Tinderet", "Aldai", "Nandi Hills", "Chesumei", "Emgwen", "Mosop"],
            "Baringo": ["Tiaty", "Baringo North", "Baringo Central", "Baringo South", "Mogotio", "Eldama Ravine"],
            "Laikipia": ["Laikipia West", "Laikipia East", "Laikipia North"],
            "Nakuru": ["Nakuru Town West", "Nakuru Town East", "Naivasha", "Gilgil", "Kuresoi South", "Kuresoi North", "Molo", "Rongai", "Subukia", "Bahati", "Njoro"],
            "Narok": ["Narok North", "Narok South", "Narok East", "Narok West", "Emurua Dikirr", "Kilgoris"],
            "Kajiado": ["Kajiado North", "Kajiado Central", "Kajiado East", "Kajiado West", "Kajiado South"],
            "Kericho": ["Ainamoi", "Belgut", "Kipkelion East", "Kipkelion West", "Bureti", "Sigowet/Soin"],
            "Bomet": ["Bomet Central", "Bomet East", "Chepalungu", "Sotik", "Konoin"],
            "Kakamega": ["Lugari", "Likuyani", "Malava", "Lurambi", "Navakholo", "Mumias West", "Mumias East", "Matungu", "Butere", "Khwisero", "Shinyalu", "Ikolomani"],
            "Vihiga": ["Vihiga", "Sabatia", "Hamisi", "Luanda", "Emuhaya"],
            "Bungoma": ["Mt. Elgon", "Sirisia", "Kabuchai", "Bumula", "Kanduyi", "Webuye East", "Webuye West", "Kimilili", "Tongaren"],
            "Busia": ["Teso North", "Teso South", "Nambale", "Matayos", "Butula", "Funyula", "Budalangi"],
            "Siaya": ["Ugunja", "Ugenya", "Gem", "Bondo", "Rarieda", "Alego Usonga"],
            "Kisumu": ["Kisumu East", "Kisumu West", "Kisumu Central", "Seme", "Nyando", "Muhoroni", "Nyakach"],
            "Homa Bay": ["Kabondo Kasipul", "Karachuonyo", "Rangwe", "Homa Bay Town", "Ndhiwa", "Mbita", "Suba North", "Suba South"],
            "Migori": ["Rongo", "Awendo", "Suna East", "Suna West", "Uriri", "Nyatike", "Kuria West", "Kuria East"],
            "Kisii": ["Bobasi", "South Mugirango", "Bomachoge Borabu", "Bomachoge Chache", "Nyaribari Masaba", "Nyaribari Chache", "Kitutu Chache North", "Kitutu Chache South", "Bonchari"],
            "Nyamira": ["Kitutu Masaba", "West Mugirango", "North Mugirango", "Borabu"]
        };

        const countyCount = await pool.query('SELECT COUNT(*) FROM counties');
        if (parseInt(countyCount.rows[0].count) === 0) {
            for (const countyName of Object.keys(kenyaData)) {
                const countyResult = await pool.query(
                    'INSERT INTO counties (name) VALUES ($1) RETURNING id',
                    [countyName]
                );
                const countyId = countyResult.rows[0].id;
                for (const areaName of kenyaData[countyName]) {
                    await pool.query(
                        'INSERT INTO areas (county_id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                        [countyId, areaName]
                    );
                }
            }
            console.log('Counties and areas populated.');
        }

        // Insert sample events if few exist
        const eventCount = await pool.query('SELECT COUNT(*) FROM events');
        if (parseInt(eventCount.rows[0].count) < 5) {
            const sampleEvents = [
                {
                    title: "Nairobi Marathon Training Group",
                    category: "sports",
                    county: "Nairobi",
                    area: "Westlands",
                    description: "Join our weekly marathon training sessions. All fitness levels welcome!",
                    date: "2025-12-25",
                    time: "06:00",
                    price: 0,
                    organizer: "Run Kenya",
                    organizer_id: 2,
                    icon: "fa-running",
                    attendees: 45,
                    max_attendees: null,
                    location: "Uhuru Park",
                    contact: "+254700000001",
                    status: "approved",
                    is_vip: false,
                    mpesa_code: "SAMPLE001"
                },
                {
                    title: "Tech Meetup - AI & Machine Learning",
                    category: "tech",
                    county: "Nairobi",
                    area: "Kilimani",
                    description: "Monthly meetup for tech enthusiasts to discuss AI trends and network.",
                    date: "2025-12-28",
                    time: "18:00",
                    price: 500,
                    organizer: "TechHub Kenya",
                    organizer_id: 2,
                    icon: "fa-laptop-code",
                    attendees: 120,
                    max_attendees: 150,
                    location: "iHub Nairobi",
                    contact: "info@techhub.com",
                    status: "approved",
                    is_vip: true,
                    mpesa_code: "SAMPLE002"
                },
                {
                    title: "Mombasa Beach Volleyball Tournament",
                    category: "sports",
                    county: "Mombasa",
                    area: "Nyali",
                    description: "Annual beach volleyball tournament with prizes for winners! Teams of 4 players compete in this exciting beachside event.",
                    date: "2025-12-30",
                    time: "09:00",
                    price: 1000,
                    organizer: "Coast Sports Club",
                    organizer_id: 3,
                    icon: "fa-volleyball-ball",
                    attendees: 80,
                    max_attendees: 120,
                    location: "Nyali Beach",
                    contact: "+254722000001",
                    status: "approved",
                    is_vip: false,
                    mpesa_code: "SAMPLE003"
                },
                {
                    title: "Kisumu Cultural Festival",
                    category: "culture",
                    county: "Kisumu",
                    area: "Kisumu Central",
                    description: "Celebrate Luo culture with traditional music, dance, food, and art. Family-friendly event showcasing our rich heritage.",
                    date: "2026-01-15",
                    time: "14:00",
                    price: 0,
                    organizer: "Cultural Heritage Kenya",
                    organizer_id: 4,
                    icon: "fa-music",
                    attendees: 300,
                    max_attendees: 500,
                    location: "Kisumu Museum Grounds",
                    contact: "info@culturalkenya.org",
                    status: "approved",
                    is_vip: true,
                    mpesa_code: "SAMPLE004"
                },
                {
                    title: "Nakuru Business Networking Breakfast",
                    category: "business",
                    county: "Nakuru",
                    area: "Nakuru Town West",
                    description: "Monthly networking breakfast for entrepreneurs, business leaders, and professionals. Great opportunity to expand your network!",
                    date: "2025-12-28",
                    time: "08:00",
                    price: 800,
                    organizer: "Nakuru Chamber of Commerce",
                    organizer_id: 2,
                    icon: "fa-handshake",
                    attendees: 60,
                    max_attendees: 80,
                    location: "Merica Hotel Conference Center",
                    contact: "+254733000002",
                    status: "pending", 
                    is_vip: false,
                    mpesa_code: "SAMPLE005"
                }
            ];
            for (const event of sampleEvents) {
                await pool.query(
                    `INSERT INTO events (title, category, county, area, description, date, time, price, organizer, organizer_id, icon, attendees, max_attendees, location, contact, status, is_vip, mpesa_code) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
                    [
                        event.title,
                        event.category,
                        event.county,
                        event.area,
                        event.description,
                        event.date,
                        event.time || null,
                        event.price || 0,
                        event.organizer,
                        event.organizer_id,
                        event.icon,
                        event.attendees || 0,
                        event.max_attendees,
                        event.location,
                        event.contact,
                        event.status,
                        event.is_vip,
                        event.mpesa_code
                    ]
                );
            }
            console.log('Sample events created.');
        }

        console.log('Database initialized and populated.');
    } catch (err) {
        console.error('DB Init Error:', err.message, err.stack);
    }
}


app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (user && await bcrypt.compare(password, user.password)) {
            const { password: _, ...userWithoutPassword } = user;
            res.json({ success: true, user: userWithoutPassword });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Register
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        if (!name || !email || !phone || !password) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (name, email, password, phone) VALUES ($1, $2, $3, $4) RETURNING id, name, email, phone, role, created_at',
            [name, email, hashedPassword, phone]
        );
        res.json({ success: true, user: result.rows[0] });
    } catch (err) {
        console.error('Register error:', err.message);
        if (err.code === '23505') {
            res.status(400).json({ success: false, message: 'Email already exists' });
        } else {
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
});

// Get Events (Public for landing page)
app.get('/api/events', async (req, res) => {
    try {
        const { status = 'approved', category, county, area, priceRange } = req.query;
        let query = 'SELECT * FROM events WHERE status = $1';
        let params = [status];
        let paramIndex = 2;

        if (category) {
            query += ` AND category = $${paramIndex}`;
            params.push(category);
            paramIndex++;
        }
        if (county) {
            query += ` AND county = $${paramIndex}`;
            params.push(county);
            paramIndex++;
        }
        if (area) {
            query += ` AND area = $${paramIndex}`;
            params.push(area);
            paramIndex++;
        }
        if (priceRange) {
            if (priceRange === 'free') {
                query += ` AND price = 0`;
            } else if (priceRange === '0-500') {
                query += ` AND price <= 500`;
            } else if (priceRange === '500-1000') {
                query += ` AND price BETWEEN 500 AND 1000`;
            } else if (priceRange === '1000-5000') {
                query += ` AND price BETWEEN 1000 AND 5000`;
            } else if (priceRange === '5000+') {
                query += ` AND price > 5000`;
            }
        }
        query += ' ORDER BY is_vip DESC, date ASC';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Get events error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Create Event
app.post('/api/events', async (req, res) => {
    try {
        const eventData = req.body;
        if (!eventData.organizer_id) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }
        const result = await pool.query(
            `INSERT INTO events (title, category, county, area, description, date, time, price, organizer, organizer_id, icon, max_attendees, location, contact, is_vip, mpesa_code, status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'pending')
             RETURNING *`,
            [
                eventData.title, eventData.category, eventData.county, eventData.area,
                eventData.description, eventData.date, eventData.time || null, eventData.price || 0,
                eventData.organizer, eventData.organizer_id, eventData.icon,
                eventData.max_attendees || null, eventData.location || `${eventData.area}, ${eventData.county}`,
                eventData.contact, eventData.is_vip, eventData.mpesa_code
            ]
        );
        res.json({ success: true, event: result.rows[0] });
    } catch (err) {
        console.error('Create event error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


app.post('/api/events/:id/join', async (req, res) => {
    try {
        const { id } = req.params;
        const event = await pool.query('SELECT attendees, max_attendees FROM events WHERE id = $1', [id]);
        if (event.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        const { attendees, max_attendees } = event.rows[0];
        if (max_attendees && attendees >= max_attendees) {
            return res.status(400).json({ success: false, message: 'Event is at full capacity' });
        }
        await pool.query('UPDATE events SET attendees = attendees + 1 WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Join event error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


app.get('/api/admin/events', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM events ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Admin get events error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


app.put('/api/admin/events/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        let setClause = '';
        let params = [];
        Object.keys(updates).forEach((key, index) => {
            setClause += `${key} = $${index + 1}, `;
            params.push(updates[key]);
        });
        setClause = setClause.slice(0, -2);
        const result = await pool.query(
            `UPDATE events SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${params.length + 1} RETURNING *`,
            [...params, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        res.json({ success: true, event: result.rows[0] });
    } catch (err) {
        console.error('Admin update event error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


app.delete('/api/admin/events/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM events WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Admin delete event error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


app.get('/api/admin/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, email, phone, created_at FROM users WHERE role != \'admin\'');
        res.json(result.rows);
    } catch (err) {
        console.error('Admin get users error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


app.delete('/api/admin/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM events WHERE organizer_id = $1', [id]);
        await pool.query('DELETE FROM users WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Admin delete user error:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Connect Kenya server running on http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Server startup error:', err.message);
});