/**
 * Storage statistics component for PhotoGeni
 * Fetches and displays user storage information in the sidebar
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the storage statistics if we have the storage stats container
    const storageStatsContainer = document.getElementById('storage-stats-container');
    if (storageStatsContainer) {
        initializeStorageStats();
    }
});

function initializeStorageStats() {
    // Create the storage stats UI
    createStorageStatsUI();
    
    // Fetch storage usage data
    fetchStorageUsage();
    
    // Set up refresh interval (every 5 minutes)
    setInterval(fetchStorageUsage, 5 * 60 * 1000);
}

function createStorageStatsUI() {
    const container = document.getElementById('storage-stats-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="storage-stats">
            <h3>Storage Usage</h3>
            <div class="storage-progress-container">
                <div class="storage-progress">
                    <div class="storage-progress-bar" style="width: 0%"></div>
                </div>
                <div class="storage-text">
                    <span id="storage-used">0 MB</span> / <span id="storage-total">0 GB</span>
                </div>
            </div>
            
            <div class="storage-details">
                <div class="storage-detail-item">
                    <i class="ri-file-line"></i>
                    <span id="file-count">0</span> Files
                </div>
                <div class="storage-detail-item">
                    <i class="ri-folder-line"></i>
                    <span id="folder-count">0</span> Folders
                </div>
            </div>
            
            <div class="storage-chart-container">
                <h4>Storage by Type</h4>
                <div class="storage-chart">
                    <div class="storage-chart-bar images" style="width: 0%" title="Images: 0 MB"></div>
                    <div class="storage-chart-bar videos" style="width: 0%" title="Videos: 0 MB"></div>
                    <div class="storage-chart-bar documents" style="width: 0%" title="Documents: 0 MB"></div>
                    <div class="storage-chart-bar audio" style="width: 0%" title="Audio: 0 MB"></div>
                    <div class="storage-chart-bar other" style="width: 0%" title="Other: 0 MB"></div>
                </div>
                <div class="storage-chart-legend">
                    <div class="legend-item">
                        <span class="legend-color images"></span>
                        <span class="legend-text">Images</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color videos"></span>
                        <span class="legend-text">Videos</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color documents"></span>
                        <span class="legend-text">Docs</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color audio"></span>
                        <span class="legend-text">Audio</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color other"></span>
                        <span class="legend-text">Other</span>
                    </div>
                </div>
            </div>
            
            <div class="largest-files">
                <h4>Largest Files</h4>
                <div id="largest-files-list">
                    <div class="loading-indicator">
                        <div class="spinner"></div>
                        <span>Loading...</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add CSS for storage stats
    const style = document.createElement('style');
    style.textContent = `
        .storage-stats {
            padding: 15px;
            background-color: var(--color-surface);
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        .storage-stats h3 {
            margin-top: 0;
            margin-bottom: 15px;
            font-size: 16px;
            color: var(--color-text);
        }
        
        .storage-progress-container {
            margin-bottom: 15px;
        }
        
        .storage-progress {
            height: 8px;
            background-color: var(--color-surface-hover);
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 5px;
        }
        
        .storage-progress-bar {
            height: 100%;
            background-color: var(--color-primary);
            border-radius: 4px;
            transition: width 0.5s ease;
        }
        
        .storage-text {
            font-size: 12px;
            color: var(--color-text-secondary);
            text-align: right;
        }
        
        .storage-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            padding: 10px 0;
            border-top: 1px solid var(--color-border);
            border-bottom: 1px solid var(--color-border);
        }
        
        .storage-detail-item {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 13px;
            color: var(--color-text-secondary);
        }
        
        .storage-detail-item i {
            color: var(--color-primary);
            font-size: 16px;
        }
        
        .storage-detail-item span {
            font-weight: 600;
            color: var(--color-text);
        }
        
        .storage-chart-container {
            margin-bottom: 15px;
        }
        
        .storage-chart-container h4 {
            font-size: 14px;
            margin: 0 0 10px 0;
            color: var(--color-text);
        }
        
        .storage-chart {
            height: 8px;
            display: flex;
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 10px;
        }
        
        .storage-chart-bar {
            height: 100%;
            transition: width 0.5s ease;
        }
        
        .storage-chart-bar.images {
            background-color: #4CAF50;
        }
        
        .storage-chart-bar.videos {
            background-color: #2196F3;
        }
        
        .storage-chart-bar.documents {
            background-color: #FFC107;
        }
        
        .storage-chart-bar.audio {
            background-color: #9C27B0;
        }
        
        .storage-chart-bar.other {
            background-color: #607D8B;
        }
        
        .storage-chart-legend {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            gap: 5px;
        }
        
        .legend-item {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 11px;
            color: var(--color-text-secondary);
        }
        
        .legend-color {
            width: 8px;
            height: 8px;
            border-radius: 2px;
        }
        
        .legend-color.images {
            background-color: #4CAF50;
        }
        
        .legend-color.videos {
            background-color: #2196F3;
        }
        
        .legend-color.documents {
            background-color: #FFC107;
        }
        
        .legend-color.audio {
            background-color: #9C27B0;
        }
        
        .legend-color.other {
            background-color: #607D8B;
        }
        
        .largest-files h4 {
            font-size: 14px;
            margin: 0 0 10px 0;
            color: var(--color-text);
        }
        
        .largest-file-item {
            display: flex;
            align-items: center;
            padding: 8px;
            border-radius: 4px;
            margin-bottom: 5px;
            transition: background-color 0.2s;
            cursor: pointer;
            font-size: 12px;
        }
        
        .largest-file-item:hover {
            background-color: var(--color-surface-hover);
        }
        
        .largest-file-icon {
            flex-shrink: 0;
            margin-right: 8px;
            color: var(--color-primary);
        }
        
        .largest-file-details {
            flex-grow: 1;
            overflow: hidden;
        }
        
        .largest-file-name {
            font-weight: 500;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
            color: var(--color-text);
        }
        
        .largest-file-size {
            font-size: 11px;
            color: var(--color-text-secondary);
        }
        
        .loading-indicator {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 15px;
            color: var(--color-text-secondary);
            font-size: 13px;
            gap: 10px;
        }
        
        .spinner {
            width: 18px;
            height: 18px;
            border: 2px solid rgba(0, 0, 0, 0.1);
            border-top-color: var(--color-primary);
            border-radius: 50%;
            animation: spin 1s ease infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;
    
    document.head.appendChild(style);
}

function fetchStorageUsage() {
    fetch('/api/storage/usage')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch storage data');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                updateStorageUI(data);
            } else {
                throw new Error(data.message || 'Unknown error');
            }
        })
        .catch(error => {
            console.error('Error fetching storage usage:', error);
            
            // Show error in UI
            const container = document.getElementById('storage-stats-container');
            if (container) {
                container.innerHTML = `
                    <div class="storage-error">
                        <i class="ri-error-warning-line"></i>
                        <p>Could not load storage information</p>
                        <button onclick="fetchStorageUsage()">Retry</button>
                    </div>
                `;
            }
        });
}

function updateStorageUI(data) {
    // Update progress bar
    const progressBar = document.querySelector('.storage-progress-bar');
    if (progressBar) {
        progressBar.style.width = `${data.storage.percentage}%`;
        progressBar.title = `${data.storage.percentage}% used`;
        
        // Change color based on usage
        if (data.storage.percentage > 90) {
            progressBar.style.backgroundColor = 'var(--color-error)';
        } else if (data.storage.percentage > 75) {
            progressBar.style.backgroundColor = 'var(--color-warning)';
        } else {
            progressBar.style.backgroundColor = 'var(--color-primary)';
        }
    }
    
    // Update storage text
    const storageUsed = document.getElementById('storage-used');
    const storageTotal = document.getElementById('storage-total');
    
    if (storageUsed) {
        storageUsed.textContent = formatFileSize(data.storage.used);
    }
    
    if (storageTotal) {
        storageTotal.textContent = formatFileSize(data.storage.total);
    }
    
    // Update file and folder counts
    const fileCount = document.getElementById('file-count');
    const folderCount = document.getElementById('folder-count');
    
    if (fileCount) {
        fileCount.textContent = formatNumber(data.counts.files);
    }
    
    if (folderCount) {
        folderCount.textContent = formatNumber(data.counts.folders);
    }
    
    // Update type chart
    updateTypeChart(data.usage_by_type, data.storage.used);
    
    // Update largest files list
    updateLargestFiles(data.largest_files);
}

function updateTypeChart(usageByType, totalUsage) {
    if (totalUsage === 0) {
        // If no storage is used, set all bars to 0
        document.querySelectorAll('.storage-chart-bar').forEach(bar => {
            bar.style.width = '0%';
            bar.title = `${bar.classList[1]}: 0 MB`;
        });
        return;
    }
    
    // Calculate percentages and update bars
    for (const [type, usage] of Object.entries(usageByType)) {
        const percentage = (usage / totalUsage) * 100;
        const bar = document.querySelector(`.storage-chart-bar.${type}`);
        
        if (bar) {
            bar.style.width = `${percentage}%`;
            bar.title = `${type.charAt(0).toUpperCase() + type.slice(1)}: ${formatFileSize(usage)}`;
        }
    }
}

function updateLargestFiles(files) {
    const container = document.getElementById('largest-files-list');
    if (!container) return;
    
    if (!files.length) {
        container.innerHTML = '<div class="empty-state">No files found</div>';
        return;
    }
    
    let html = '';
    
    files.forEach(file => {
        // Determine icon based on file extension
        let iconClass = 'ri-file-line';
        const ext = file.name.split('.').pop().toLowerCase();
        
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(ext)) {
            iconClass = 'ri-image-line';
        } else if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) {
            iconClass = 'ri-video-line';
        } else if (['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx'].includes(ext)) {
            iconClass = 'ri-file-text-line';
        } else if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) {
            iconClass = 'ri-music-line';
        }
        
        html += `
            <div class="largest-file-item" onclick="navigateToFile('${file.path}')">
                <div class="largest-file-icon">
                    <i class="${iconClass}"></i>
                </div>
                <div class="largest-file-details">
                    <div class="largest-file-name" title="${file.name}">${file.name}</div>
                    <div class="largest-file-size">${formatFileSize(file.size)}</div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function formatNumber(num) {
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
}

// Function to navigate to a file's location
function navigateToFile(path) {
    // Extract the directory path
    const dirPath = path.split('/').slice(0, -1).join('/');
    
    // Navigate to the directory containing the file
    if (typeof loadCollections === 'function') {
        loadCollections(dirPath);
    } else {
        window.location.href = `/collections-modern?path=${encodeURIComponent(dirPath)}`;
    }
}

// Ensure we have the formatFileSize function
if (typeof formatFileSize !== 'function') {
    function formatFileSize(size) {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
    }
}
