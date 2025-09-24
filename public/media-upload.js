const multer = require('multer');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;

// Create uploads directory
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

// Initialize directories
createUploadsDir().catch(console.error);

// Multer configuration
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB
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

// Add media tables function
const addMediaTables = async (pool) => {
    try {
        // Event media table
        await pool.query(`
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
        
        // Temporary media uploads table
        await pool.query(`
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
        
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_temp_media_expires 
            ON temp_media_uploads(expires_at)
        `);
        
        console.log('Media tables created successfully');
    } catch (err) {
        console.error('Error creating media tables:', err);
    }
};

// Setup media upload endpoints function
const setupMediaEndpoints = (app, pool) => {
    // Upload media endpoint
    app.post('/api/upload-media', upload.single('media'), async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'No file uploaded' });
            }
            
            const { originalname, mimetype, size, buffer } = req.file;
            const isImage = mimetype.startsWith('image/');
            const isVideo = mimetype.startsWith('video/');
            
            // Generate unique filename
            const fileId = uuidv4();
            const extension = path.extname(originalname) || (isImage ? '.jpg' : '.mp4');
            const filename = `${fileId}${extension}`;
            
            // Determine subdirectory
            const subDir = isImage ? 'images' : 'videos';
            const filePath = path.join(__dirname, 'public', 'uploads', subDir, filename);
            const webPath = `/uploads/${subDir}/${filename}`;
            
            let thumbnailPath = null;
            
            if (isImage) {
                // Process and save image
                await sharp(buffer)
                    .resize(1200, 800, { 
                        fit: 'inside', 
                        withoutEnlargement: true 
                    })
                    .jpeg({ quality: 85 })
                    .toFile(filePath);
                
                // Create thumbnail
                const thumbnailFilename = `thumb_${filename}`;
                const thumbnailFullPath = path.join(__dirname, 'public', 'uploads', 'thumbnails', thumbnailFilename);
                thumbnailPath = `/uploads/thumbnails/${thumbnailFilename}`;
                
                await sharp(buffer)
                    .resize(300, 200, { fit: 'cover' })
                    .jpeg({ quality: 80 })
                    .toFile(thumbnailFullPath);
                    
            } else if (isVideo) {
                // Save video file
                await fs.writeFile(filePath, buffer);
                // Use placeholder for video thumbnail
                thumbnailPath = '/images/video-placeholder.jpg';
            }
            
            // Store in temporary table
            const result = await pool.query(`
                INSERT INTO temp_media_uploads (id, file_path, file_name, file_type, file_size, thumbnail_path)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id
            `, [fileId, webPath, originalname, mimetype, size, thumbnailPath]);
            
            console.log('Media uploaded:', { fileId, filename, size, type: mimetype });
            
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
            console.error('Media upload error:', error);
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
                const fullPath = path.join(__dirname, 'public', file_path);
                await fs.unlink(fullPath);
                
                if (thumbnail_path && !thumbnail_path.includes('placeholder')) {
                    const thumbPath = path.join(__dirname, 'public', thumbnail_path);
                    await fs.unlink(thumbPath);
                }
            } catch (fileError) {
                console.warn('File deletion error:', { error: fileError.message, file_path });
            }
            
          
            await pool.query('DELETE FROM temp_media_uploads WHERE id = $1', [id]);
            
            console.log('Media deleted:', { fileId: id });
            res.json({ success: true });
            
        } catch (error) {
            console.error('Media deletion error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Deletion failed: ' + error.message 
            });
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
            console.error('Get event media error:', err);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    });

    console.log('📸 Media upload endpoints configured');
};

module.exports = {
    addMediaTables,
    setupMediaEndpoints,
    upload
};