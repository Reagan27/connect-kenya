
const multer = require('multer');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;


const createUploadsDir = async () => {
    const uploadsDir = path.join(__dirname, 'public', 'uploads');
    const mediaDirs = ['images', 'videos', 'thumbnails'];
    
    try {
        await fs.access(uploadsDir);
    } catch {
        await fs.mkdir(uploadsDir, { recursive: true });
    }
    
    for (const dir of mediaDirs) {
        const dirPath = path.join(uploadsDir, dir);
        try {
            await fs.access(dirPath);
        } catch {
            await fs.mkdir(dirPath, { recursive: true });
        }
    }
};


createUploadsDir().catch(console.error);


const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024 
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
            'video/mp4', 'video/webm', 'video/ogg', 'video/mov'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'), false);
        }
    }
});


const addMediaTables = async (client) => {
   
    await client.query(`
        CREATE TABLE IF NOT EXISTS event_media (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
            file_path VARCHAR(500) NOT NULL,
            file_name VARCHAR(255) NOT NULL,
            file_type VARCHAR(50) NOT NULL,
            file_size INTEGER NOT NULL,
            is_primary BOOLEAN DEFAULT false,
            thumbnail_path VARCHAR(500),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
   
    await client.query(`
        CREATE TABLE IF NOT EXISTS temp_media_uploads (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            file_path VARCHAR(500) NOT NULL,
            file_name VARCHAR(255) NOT NULL,
            file_type VARCHAR(50) NOT NULL,
            file_size INTEGER NOT NULL,
            thumbnail_path VARCHAR(500),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours')
        )
    `);
    
    await client.query(`
        CREATE INDEX IF NOT EXISTS idx_temp_media_expires 
        ON temp_media_uploads(expires_at)
    `);
};


app.post('/api/upload-media', upload.single('media'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        
        const { originalname, mimetype, size, buffer } = req.file;
        const isImage = mimetype.startsWith('image/');
        const isVideo = mimetype.startsWith('video/');
        
       
        const fileId = uuidv4();
        const extension = path.extname(originalname) || (isImage ? '.jpg' : '.mp4');
        const filename = `${fileId}${extension}`;
        
       
        const subDir = isImage ? 'images' : 'videos';
        const filePath = path.join('public', 'uploads', subDir, filename);
        const webPath = `/uploads/${subDir}/${filename}`;
        
        let thumbnailPath = null;
        
        if (isImage) {
            
            await sharp(buffer)
                .resize(1200, 800, { 
                    fit: 'inside', 
                    withoutEnlargement: true 
                })
                .jpeg({ quality: 85 })
                .toFile(filePath);
            
           
            const thumbnailFilename = `thumb_${filename}`;
            const thumbnailFullPath = path.join('public', 'uploads', 'thumbnails', thumbnailFilename);
            thumbnailPath = `/uploads/thumbnails/${thumbnailFilename}`;
            
            await sharp(buffer)
                .resize(300, 200, { fit: 'cover' })
                .jpeg({ quality: 80 })
                .toFile(thumbnailFullPath);
                
        } else if (isVideo) {
           
            await fs.writeFile(filePath, buffer);
            
           
            thumbnailPath = '/images/video-placeholder.jpg';
        }
        
       
        const result = await pool.query(`
            INSERT INTO temp_media_uploads (id, file_path, file_name, file_type, file_size, thumbnail_path)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        `, [fileId, webPath, originalname, mimetype, size, thumbnailPath]);
        
        logger.info('Media uploaded', { fileId, filename, size, type: mimetype });
        
        res.json({
            success: true,
            fileId: fileId,
            filePath: webPath,
            thumbnailPath: thumbnailPath,
            fileName: originalname,
            fileSize: size,
            fileType: mimetype
        });
        
    } catch (error) {
        logger.error('Media upload error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Upload failed: ' + error.message 
        });
    }
});


app.delete('/api/delete-media/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
       
        const mediaResult = await pool.query(
            'SELECT file_path, thumbnail_path FROM temp_media_uploads WHERE id = $1',
            [id]
        );
        
        if (mediaResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }
        
        const { file_path, thumbnail_path } = mediaResult.rows[0];
        
       
        try {
            const fullPath = path.join(__dirname, file_path);
            await fs.unlink(fullPath);
            
            if (thumbnail_path && !thumbnail_path.includes('placeholder')) {
                const thumbPath = path.join(__dirname, 'public', thumbnail_path);
                await fs.unlink(thumbPath);
            }
        } catch (fileError) {
            logger.warn('File deletion error:', { error: fileError.message, file_path });
        }
        
        
        await pool.query('DELETE FROM temp_media_uploads WHERE id = $1', [id]);
        
        logger.info('Media deleted', { fileId: id });
        res.json({ success: true });
        
    } catch (error) {
        logger.error('Media deletion error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Deletion failed: ' + error.message 
        });
    }
});


app.post('/api/events', authenticateJWT, [
    body('title').trim().notEmpty(),
    body('category').notEmpty(),
    body('county').notEmpty(),
    body('area').notEmpty(),
    body('description').trim().notEmpty(),
    body('date').isDate(),
    body('mpesa_code').trim().notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const eventData = req.body;
        const organizer_id = req.user.id;

       
        const eventResult = await client.query(
            `INSERT INTO events (title, category, county, area, description, date, time, price, organizer, organizer_id, icon, max_attendees, location, contact, is_vip, mpesa_code, status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'pending')
             RETURNING *`,
            [
                eventData.title.trim(),
                eventData.category,
                eventData.county,
                eventData.area,
                eventData.description.trim(),
                eventData.date,
                eventData.time || null,
                eventData.price || 0,
                eventData.organizer?.trim() || req.user.name,
                organizer_id,
                eventData.icon || 'fa-calendar',
                eventData.max_attendees || null,
                eventData.location || `${eventData.area}, ${eventData.county}`,
                eventData.contact || null,
                eventData.is_vip || false,
                eventData.mpesa_code.trim()
            ]
        );
        
        const newEvent = eventResult.rows[0];
        
    
        if (eventData.eventMedia) {
            try {
                const mediaData = JSON.parse(eventData.eventMedia);
                
                for (let i = 0; i < mediaData.length; i++) {
                    const media = mediaData[i];
                    
                    
                    const tempMedia = await client.query(
                        'SELECT * FROM temp_media_uploads WHERE id = $1',
                        [media.id]
                    );
                    
                    if (tempMedia.rows.length > 0) {
                        const temp = tempMedia.rows[0];
                        
                        await client.query(`
                            INSERT INTO event_media (id, event_id, file_path, file_name, file_type, file_size, is_primary, thumbnail_path)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                        `, [
                            temp.id,
                            newEvent.id,
                            temp.file_path,
                            temp.file_name,
                            temp.file_type,
                            temp.file_size,
                            media.isPrimary || false,
                            temp.thumbnail_path
                        ]);
                        
                       
                        await client.query('DELETE FROM temp_media_uploads WHERE id = $1', [media.id]);
                    }
                }
            } catch (mediaError) {
                logger.warn('Media processing error:', mediaError);
                
            }
        }
        
        await client.query('COMMIT');
        
        logger.info('Event created with media', { 
            event_id: newEvent.id, 
            organizer: req.user.email,
            media_count: eventData.eventMedia ? JSON.parse(eventData.eventMedia).length : 0
        });
        
        res.json({ success: true, event: newEvent });
        
    } catch (err) {
        await client.query('ROLLBACK');
        logger.error('Create event with media error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    } finally {
        client.release();
    }
});


app.get('/api/events/:id/media', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM event_media WHERE event_id = $1 ORDER BY is_primary DESC, created_at ASC',
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        logger.error('Get event media error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


app.get('/api/events', async (req, res) => {
    try {
        const { status = 'approved', category, county, area, priceRange, include_media } = req.query;
        let query = 'SELECT * FROM events WHERE status = $1';
        let params = [status];
        let paramIndex = 2;

        if (category) {
            query += ` AND category = ${paramIndex}`;
            params.push(category);
            paramIndex++;
        }
        if (county) {
            query += ` AND county = ${paramIndex}`;
            params.push(county);
            paramIndex++;
        }
        if (area) {
            query += ` AND area = ${paramIndex}`;
            params.push(area);
            paramIndex++;
        }
        if (priceRange) {
            if (priceRange === 'free') {
                query += ` AND price = 0`;
            } else if (priceRange === '0-500') {
                query += ` AND price BETWEEN 0 AND 500`;
            } else if (priceRange === '500-1000') {
                query += ` AND price BETWEEN 500 AND 1000`;
            } else if (priceRange === '1000-5000') {
                query += ` AND price BETWEEN 1000 AND 5000`;
            } else if (priceRange === '5000+') {
                query += ` AND price > 5000`;
            }
        }

        query += ' ORDER BY is_vip DESC, date ASC';
        const eventsResult = await pool.query(query, params);
        const events = eventsResult.rows;

        
        if (include_media === 'true') {
            for (const event of events) {
                const mediaResult = await pool.query(
                    'SELECT * FROM event_media WHERE event_id = $1 ORDER BY is_primary DESC, created_at ASC',
                    [event.id]
                );
                event.media = mediaResult.rows;
                
               
                const primaryMedia = mediaResult.rows.find(m => m.is_primary);
                event.primary_image = primaryMedia ? primaryMedia.file_path : null;
                event.primary_thumbnail = primaryMedia ? primaryMedia.thumbnail_path : null;
            }
        }

        res.json(events);
    } catch (err) {
        logger.error('Get events with media error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


app.post('/api/cleanup-temp-uploads', authenticateJWT, isAdmin, async (req, res) => {
    try {
        
        const expiredFiles = await pool.query(
            'SELECT id, file_path, thumbnail_path FROM temp_media_uploads WHERE expires_at < CURRENT_TIMESTAMP'
        );
        
        let deletedCount = 0;
        
        for (const file of expiredFiles.rows) {
            try {
               
                const fullPath = path.join(__dirname, file.file_path);
                await fs.unlink(fullPath);
                
                if (file.thumbnail_path && !file.thumbnail_path.includes('placeholder')) {
                    const thumbPath = path.join(__dirname, 'public', file.thumbnail_path);
                    await fs.unlink(thumbPath);
                }
                
                deletedCount++;
            } catch (fileError) {
                logger.warn('Cleanup file deletion error:', { 
                    error: fileError.message, 
                    file_path: file.file_path 
                });
            }
        }
        
        
        const deleteResult = await pool.query(
            'DELETE FROM temp_media_uploads WHERE expires_at < CURRENT_TIMESTAMP'
        );
        
        logger.info('Temporary uploads cleanup completed', { 
            files_deleted: deletedCount,
            db_records_deleted: deleteResult.rowCount 
        });
        
        res.json({ 
            success: true, 
            files_deleted: deletedCount,
            db_records_deleted: deleteResult.rowCount 
        });
        
    } catch (error) {
        logger.error('Cleanup error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Cleanup failed: ' + error.message 
        });
    }
});


setInterval(async () => {
    try {
        const expiredFiles = await pool.query(
            'SELECT id, file_path, thumbnail_path FROM temp_media_uploads WHERE expires_at < CURRENT_TIMESTAMP'
        );
        
        for (const file of expiredFiles.rows) {
            try {
                const fullPath = path.join(__dirname, file.file_path);
                await fs.unlink(fullPath);
                
                if (file.thumbnail_path && !file.thumbnail_path.includes('placeholder')) {
                    const thumbPath = path.join(__dirname, 'public', file.thumbnail_path);
                    await fs.unlink(thumbPath);
                }
            } catch (fileError) {
                // Ignore file deletion errors in automatic cleanup
            }
        }
        
        const deleteResult = await pool.query(
            'DELETE FROM temp_media_uploads WHERE expires_at < CURRENT_TIMESTAMP'
        );
        
        if (deleteResult.rowCount > 0) {
            logger.info('Automatic cleanup completed', { 
                records_deleted: deleteResult.rowCount 
            });
        }
    } catch (error) {
        logger.error('Automatic cleanup error:', error);
    }
}, 60 * 60 * 1000); 


app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
                success: false, 
                message: 'File too large. Maximum size is 50MB.' 
            });
        }
    }
    next(error);
});

console.log('📸 Media Upload System initialized with image processing and video support');


module.exports = {
    addMediaTables,
    upload
};