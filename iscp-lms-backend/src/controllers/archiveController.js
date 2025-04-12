const { pool } = require('../config/db');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// Configure storage for archive files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/archives');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    cb(null, fileName);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Allow common archive formats
    const allowedFormats = ['.zip', '.rar', '.7z', '.tar', '.gz', '.sql', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedFormats.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only archive files are allowed'));
    }
  },
  limits: {
    fileSize: 1024 * 1024 * 100 // 100MB max file size
  }
});

// Get all legacy archives
exports.getLegacyArchives = async (req, res) => {
  try {
    const [archives] = await pool.query('SELECT * FROM legacy_archives ORDER BY created_at DESC');
    
    // Format the size to be human-readable
    const formattedArchives = archives.map(archive => ({
      id: archive.id,
      name: archive.name,
      size: formatFileSize(archive.size),
      format: archive.file_type,
      date: new Date(archive.created_at).toISOString().split('T')[0],
      file_url: archive.file_url,
      uploaded_by: archive.uploaded_by
    }));
    
    res.status(200).json(formattedArchives);
  } catch (error) {
    console.error('Error fetching legacy archives:', error);
    res.status(500).json({ message: 'Failed to fetch legacy archives' });
  }
};

// Upload a legacy archive
exports.uploadLegacyArchive = (req, res) => {
  // Use multer for file upload
  const uploadMiddleware = upload.single('file');
  
  uploadMiddleware(req, res, async function(err) {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      const { name, format } = req.body;
      
      if (!name || !format) {
        return res.status(400).json({ message: 'Name and format are required' });
      }
      
      // Generate file URL (in a real app this might be a CDN URL or S3 path)
      const fileUrl = `/uploads/archives/${req.file.filename}`;
      
      // Get user ID from authenticated request
      const userId = req.user ? req.user.id : 1;  // Default to admin ID 1 if not authenticated
      
      // Store the file info in the database
      const fileSize = req.file.size;
      
      const [result] = await pool.query(
        'INSERT INTO legacy_archives (name, file_type, file_url, size, uploaded_by, campus) VALUES (?, ?, ?, ?, ?, ?)',
        [name, format, fileUrl, fileSize, userId, 'All Campuses']
      );
      
      const [newArchive] = await pool.query('SELECT * FROM legacy_archives WHERE id = ?', [result.insertId]);
      
      // Format the response
      const formattedArchive = {
        id: newArchive[0].id,
        name: newArchive[0].name,
        size: formatFileSize(newArchive[0].size),
        format: newArchive[0].file_type,
        date: new Date(newArchive[0].created_at).toISOString().split('T')[0],
        file_url: newArchive[0].file_url,
        uploaded_by: newArchive[0].uploaded_by
      };
      
      res.status(201).json(formattedArchive);
    } catch (error) {
      console.error('Error uploading legacy archive:', error);
      res.status(500).json({ message: 'Failed to upload legacy archive' });
    }
  });
};

// Download a legacy archive
exports.downloadLegacyArchive = async (req, res) => {
  try {
    const archiveId = req.params.id;
    
    // Get the archive details
    const [archives] = await pool.query('SELECT * FROM legacy_archives WHERE id = ?', [archiveId]);
    
    if (archives.length === 0) {
      return res.status(404).json({ message: 'Legacy archive not found' });
    }
    
    const archive = archives[0];
    
    // Path is relative to the server root
    const filePath = path.join(__dirname, '../..', archive.file_url);
    
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Archive file not found' });
    }
    
    // Set content-type based on file_type
    let contentType = 'application/octet-stream';
    switch (archive.file_type.toLowerCase()) {
      case 'pdf':
        contentType = 'application/pdf';
        break;
      case 'zip':
        contentType = 'application/zip';
        break;
      case 'rar':
        contentType = 'application/x-rar-compressed';
        break;
      // Add other types as needed
    }
    
    // Set headers for file download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${archive.name}.${archive.file_type}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading legacy archive:', error);
    res.status(500).json({ message: 'Failed to download legacy archive' });
  }
};

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
} 