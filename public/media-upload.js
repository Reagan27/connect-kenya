let mediaUploadState = {
    uploadedFiles: [],
    maxFiles: 5,
    maxFileSize: 50 * 1024 * 1024,
    allowedTypes: {
        images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
        videos: ['video/mp4', 'video/webm', 'video/ogg', 'video/mov']
    },
    uploadEndpoint: '/api/upload-media',
    isInitialized: false
};


document.addEventListener('DOMContentLoaded', function() {
    if (window.mediaUploadLoaded) return;
    window.mediaUploadLoaded = true;
    
    console.log('Loading Media Upload System...');
    
   
    addMediaUploadStyles();
    
   
    enhanceCreateEventModal();
    
    mediaUploadState.isInitialized = true;
    console.log('Media Upload System Loaded Successfully!');
});


function addMediaUploadStyles() {
    if (document.getElementById('mediaUploadStyles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'mediaUploadStyles';
    styles.textContent = `
        .media-upload-section {
            margin: 1.5rem 0;
            padding: 1.5rem;
            border: 2px dashed #e0e0e0;
            border-radius: 10px;
            background: #fafafa;
            transition: all 0.3s ease;
        }
        
        .media-upload-section.dragover {
            border-color: #1e3c72;
            background: #f0f8ff;
        }
        
        .media-upload-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 1rem;
        }
        
        .media-upload-header h4 {
            margin: 0;
            color: #333;
            font-size: 1.1rem;
        }
        
        .media-upload-info {
            font-size: 0.9rem;
            color: #666;
            margin-bottom: 1rem;
        }
        
        .media-drop-zone {
            text-align: center;
            padding: 2rem;
            border: 2px dashed #ccc;
            border-radius: 8px;
            background: white;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .media-drop-zone:hover {
            border-color: #1e3c72;
            background: #f8f9fa;
        }
        
        .media-drop-zone.active {
            border-color: #1e3c72;
            background: #e3f2fd;
        }
        
        .media-drop-icon {
            font-size: 3rem;
            color: #ccc;
            margin-bottom: 1rem;
        }
        
        .media-drop-text {
            color: #666;
            font-size: 1rem;
            margin-bottom: 0.5rem;
        }
        
        .media-drop-subtext {
            color: #999;
            font-size: 0.8rem;
        }
        
        .media-file-input {
            display: none;
        }
        
        .media-preview-container {
            margin-top: 1rem;
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 1rem;
        }
        
        .media-preview-item {
            position: relative;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            background: white;
        }
        
        .media-preview-image {
            width: 100%;
            height: 120px;
            object-fit: cover;
            display: block;
        }
        
        .media-preview-video {
            width: 100%;
            height: 120px;
            object-fit: cover;
        }
        
        .media-preview-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .media-preview-item:hover .media-preview-overlay {
            opacity: 1;
        }
        
        .media-preview-actions {
            display: flex;
            gap: 8px;
        }
        
        .media-action-btn {
            background: rgba(255,255,255,0.9);
            border: none;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
        }
        
        .media-action-btn:hover {
            background: white;
            transform: scale(1.1);
        }
        
        .media-action-btn.delete {
            color: #dc3545;
        }
        
        .media-action-btn.primary {
            color: #1e3c72;
        }
        
        .media-upload-progress {
            margin-top: 1rem;
            display: none;
        }
        
        .media-progress-bar {
            width: 100%;
            height: 8px;
            background: #e0e0e0;
            border-radius: 4px;
            overflow: hidden;
        }
        
        .media-progress-fill {
            height: 100%;
            background: linear-gradient(45deg, #1e3c72, #2a5298);
            transition: width 0.3s ease;
            width: 0%;
        }
        
        .media-progress-text {
            text-align: center;
            margin-top: 0.5rem;
            font-size: 0.9rem;
            color: #666;
        }
        
        .media-error {
            background: #f8d7da;
            color: #721c24;
            padding: 0.75rem;
            border-radius: 6px;
            margin-top: 1rem;
            font-size: 0.9rem;
            display: none;
        }
        
        .media-file-info {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(transparent, rgba(0,0,0,0.7));
            color: white;
            padding: 0.5rem;
            font-size: 0.7rem;
        }
        
        .media-primary-badge {
            position: absolute;
            top: 4px;
            left: 4px;
            background: #ffc107;
            color: #000;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.6rem;
            font-weight: 600;
        }
        
        .media-upload-buttons {
            display: flex;
            gap: 10px;
            margin-top: 1rem;
        }
        
        .media-btn {
            padding: 8px 16px;
            border: 2px solid #1e3c72;
            background: none;
            color: #1e3c72;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: all 0.3s ease;
        }
        
        .media-btn:hover {
            background: #1e3c72;
            color: white;
        }
        
        .media-btn.primary {
            background: #1e3c72;
            color: white;
        }
        
        @media (max-width: 768px) {
            .media-preview-container {
                grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                gap: 0.5rem;
            }
            
            .media-preview-image,
            .media-preview-video {
                height: 100px;
            }
        }
    `;
    
    document.head.appendChild(styles);
}


function enhanceCreateEventModal() {
    
    const checkModal = setInterval(() => {
        const modal = document.getElementById('createEventModal');
        if (modal && !modal.dataset.mediaEnhanced) {
            modal.dataset.mediaEnhanced = 'true';
            addMediaUploadToModal();
            clearInterval(checkModal);
        }
    }, 500);
}


function addMediaUploadToModal() {
    const modal = document.getElementById('createEventModal');
    const form = modal.querySelector('form');
    if (!form) return;
    
    
    const descriptionGroup = form.querySelector('#eventDescription').parentNode;
    
    const mediaUploadHTML = `
        <div class="media-upload-section" id="mediaUploadSection">
            <div class="media-upload-header">
                <i class="fas fa-camera" style="color: #1e3c72;"></i>
                <h4>Event Photos & Videos</h4>
                <span style="font-size: 0.8rem; color: #666; margin-left: auto;">(Optional)</span>
            </div>
            
            <div class="media-upload-info">
                Add up to 5 photos or videos to showcase your event. First image will be the main photo.
                <br><small>Supported: JPG, PNG, GIF, WebP, MP4, WebM (Max 50MB each)</small>
            </div>
            
            <div class="media-drop-zone" id="mediaDropZone" onclick="triggerFileSelect()">
                <div class="media-drop-icon">
                    <i class="fas fa-cloud-upload-alt"></i>
                </div>
                <div class="media-drop-text">
                    Click to select files or drag and drop
                </div>
                <div class="media-drop-subtext">
                    Photos and videos up to 50MB
                </div>
            </div>
            
            <input type="file" 
                   id="mediaFileInput" 
                   class="media-file-input" 
                   multiple 
                   accept="image/*,video/*"
                   onchange="handleFileSelect(this.files)">
            
            <div class="media-preview-container" id="mediaPreviewContainer"></div>
            
            <div class="media-upload-progress" id="mediaUploadProgress">
                <div class="media-progress-bar">
                    <div class="media-progress-fill" id="mediaProgressFill"></div>
                </div>
                <div class="media-progress-text" id="mediaProgressText">Uploading...</div>
            </div>
            
            <div class="media-error" id="mediaError"></div>
            
            <div class="media-upload-buttons">
                <button type="button" class="media-btn" onclick="triggerFileSelect()">
                    <i class="fas fa-plus"></i> Add More Files
                </button>
                <button type="button" class="media-btn" onclick="clearAllMedia()">
                    <i class="fas fa-trash"></i> Clear All
                </button>
            </div>
        </div>
    `;
    
   
    descriptionGroup.insertAdjacentHTML('afterend', mediaUploadHTML);
    
   
    setupDragAndDrop();
    
  
    enhanceFormSubmission();
}


function setupDragAndDrop() {
    const dropZone = document.getElementById('mediaDropZone');
    const section = document.getElementById('mediaUploadSection');
    
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            section.classList.add('dragover');
            dropZone.classList.add('active');
        });
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            section.classList.remove('dragover');
            dropZone.classList.remove('active');
        });
    });
    
    
    dropZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        handleFileSelect(files);
    });
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}


function triggerFileSelect() {
    document.getElementById('mediaFileInput').click();
}


async function handleFileSelect(files) {
    const fileArray = Array.from(files);
    
    
    if (mediaUploadState.uploadedFiles.length + fileArray.length > mediaUploadState.maxFiles) {
        showMediaError(`You can only upload up to ${mediaUploadState.maxFiles} files total.`);
        return;
    }
    
  
    const validFiles = [];
    for (const file of fileArray) {
        if (validateFile(file)) {
            validFiles.push(file);
        }
    }
    
    if (validFiles.length === 0) return;
    
   
    await uploadFiles(validFiles);
}


function validateFile(file) {
    const allAllowedTypes = [
        ...mediaUploadState.allowedTypes.images,
        ...mediaUploadState.allowedTypes.videos
    ];
    
 
    if (!allAllowedTypes.includes(file.type)) {
        showMediaError(`File type "${file.type}" is not supported.`);
        return false;
    }
    
  
    if (file.size > mediaUploadState.maxFileSize) {
        showMediaError(`File "${file.name}" is too large. Maximum size is 10MB.`);
        return false;
    }
    
    return true;
}


async function uploadFiles(files) {
    showUploadProgress(true);
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        updateUploadProgress((i + 1) / files.length * 100, `Uploading ${file.name}...`);
        
        try {
            const result = await uploadSingleFile(file);
            if (result.success) {
                addFileToPreview(file, result.filePath, result.fileId);
            }
        } catch (error) {
            console.error('Upload error:', error);
            showMediaError(`Failed to upload ${file.name}: ${error.message}`);
        }
    }
    
    showUploadProgress(false);
    hideMediaError();
}


async function uploadSingleFile(file) {
    const formData = new FormData();
    formData.append('media', file);
    formData.append('type', file.type.startsWith('image/') ? 'image' : 'video');
    
    const response = await fetch(mediaUploadState.uploadEndpoint, {
        method: 'POST',
        body: formData
    });
    
    if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    return await response.json();
}


function addFileToPreview(file, filePath, fileId) {
    const container = document.getElementById('mediaPreviewContainer');
    const isVideo = file.type.startsWith('video/');
    const isPrimary = mediaUploadState.uploadedFiles.length === 0;
    
    const previewItem = document.createElement('div');
    previewItem.className = 'media-preview-item';
    previewItem.dataset.fileId = fileId;
    previewItem.dataset.filePath = filePath;
    
    const mediaElement = isVideo 
        ? `<video class="media-preview-video" src="${filePath}" muted loop onmouseover="this.play()" onmouseout="this.pause()"></video>`
        : `<img class="media-preview-image" src="${filePath}" alt="Event media">`;
    
    previewItem.innerHTML = `
        ${mediaElement}
        ${isPrimary ? '<div class="media-primary-badge">Main</div>' : ''}
        <div class="media-preview-overlay">
            <div class="media-preview-actions">
                ${!isPrimary ? `<button class="media-action-btn primary" onclick="setPrimaryMedia('${fileId}')" title="Set as main">
                    <i class="fas fa-star"></i>
                </button>` : ''}
                <button class="media-action-btn delete" onclick="removeMedia('${fileId}')" title="Remove">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="media-file-info">
            ${file.name} (${formatFileSize(file.size)})
        </div>
    `;
    
    container.appendChild(previewItem);
    
    
    mediaUploadState.uploadedFiles.push({
        id: fileId,
        path: filePath,
        name: file.name,
        size: file.size,
        type: file.type,
        isPrimary: isPrimary
    });
}


function removeMedia(fileId) {
    const item = document.querySelector(`[data-file-id="${fileId}"]`);
    if (item) {
        item.remove();
    }
    
   
    const fileIndex = mediaUploadState.uploadedFiles.findIndex(f => f.id === fileId);
    if (fileIndex > -1) {
        const wasRemovingPrimary = mediaUploadState.uploadedFiles[fileIndex].isPrimary;
        mediaUploadState.uploadedFiles.splice(fileIndex, 1);
        
        
        if (wasRemovingPrimary && mediaUploadState.uploadedFiles.length > 0) {
            setPrimaryMedia(mediaUploadState.uploadedFiles[0].id);
        }
    }
    
    
    deleteFileFromServer(fileId);
}


function setPrimaryMedia(fileId) {
  
    mediaUploadState.uploadedFiles.forEach(file => {
        file.isPrimary = file.id === fileId;
    });
    
   
    document.querySelectorAll('.media-preview-item').forEach(item => {
        const badge = item.querySelector('.media-primary-badge');
        const starButton = item.querySelector('.media-action-btn.primary');
        
        if (item.dataset.fileId === fileId) {
            if (!badge) {
                item.insertAdjacentHTML('afterbegin', '<div class="media-primary-badge">Main</div>');
            }
            if (starButton) starButton.remove();
        } else {
            if (badge) badge.remove();
            if (!starButton) {
                const actions = item.querySelector('.media-preview-actions');
                actions.insertAdjacentHTML('afterbegin', `
                    <button class="media-action-btn primary" onclick="setPrimaryMedia('${item.dataset.fileId}')" title="Set as main">
                        <i class="fas fa-star"></i>
                    </button>
                `);
            }
        }
    });
}


function clearAllMedia() {
    if (mediaUploadState.uploadedFiles.length === 0) return;
    
    if (confirm('Are you sure you want to remove all uploaded files?')) {
        
        document.getElementById('mediaPreviewContainer').innerHTML = '';
        
       
        mediaUploadState.uploadedFiles.forEach(file => {
            deleteFileFromServer(file.id);
        });
        
       
        mediaUploadState.uploadedFiles = [];
        hideMediaError();
    }
}


async function deleteFileFromServer(fileId) {
    try {
        await fetch(`/api/delete-media/${fileId}`, { method: 'DELETE' });
    } catch (error) {
        console.error('Error deleting file:', error);
    }
}


function showUploadProgress(show) {
    const progressDiv = document.getElementById('mediaUploadProgress');
    progressDiv.style.display = show ? 'block' : 'none';
    
    if (!show) {
        updateUploadProgress(0, '');
    }
}


function updateUploadProgress(percent, text) {
    document.getElementById('mediaProgressFill').style.width = percent + '%';
    document.getElementById('mediaProgressText').textContent = text;
}


function showMediaError(message) {
    const errorDiv = document.getElementById('mediaError');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
  
    setTimeout(() => {
        hideMediaError();
    }, 5000);
}

function hideMediaError() {
    const errorDiv = document.getElementById('mediaError');
    if (errorDiv) errorDiv.style.display = 'none';
}


function enhanceFormSubmission() {
    const form = document.getElementById('createEventForm');
    const originalSubmitHandler = form.onsubmit;
    
    form.addEventListener('submit', function(e) {
       
        if (mediaUploadState.uploadedFiles.length > 0) {
            
            const mediaInput = document.createElement('input');
            mediaInput.type = 'hidden';
            mediaInput.name = 'eventMedia';
            mediaInput.value = JSON.stringify(mediaUploadState.uploadedFiles);
            form.appendChild(mediaInput);
        }
    });
}


function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}


window.triggerFileSelect = triggerFileSelect;
window.handleFileSelect = handleFileSelect;
window.removeMedia = removeMedia;
window.setPrimaryMedia = setPrimaryMedia;
window.clearAllMedia = clearAllMedia;


window.MediaUpload = {
    state: mediaUploadState,
    uploadFiles,
    clearAll: clearAllMedia
};

console.log('🎥 Media Upload System Loaded - Ready for photos and videos!');
console.log('Debug: window.MediaUpload available for testing');