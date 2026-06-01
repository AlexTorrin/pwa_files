// PWA App - File Writing with Offline Support

class PWAFileApp {
    constructor() {
        this.fileHandles = {};
        this.recentFiles = [];
        this.init();
    }

    async init() {
        this.setupElements();
        this.setupEventListeners();
        this.setupServiceWorker();
        this.setupOnlineOfflineListeners();
        this.loadRecentFiles();
        this.updateStatus('App loaded successfully');
    }

    setupElements() {
        this.filenameInput = document.getElementById('filename');
        this.contentArea = document.getElementById('content');
        this.saveBtn = document.getElementById('saveBtn');
        this.loadBtn = document.getElementById('loadBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.filesList = document.getElementById('filesList');
        this.statusMessage = document.getElementById('statusMessage');
        this.statusBadge = document.getElementById('statusBadge');
    }

    setupEventListeners() {
        this.saveBtn.addEventListener('click', () => this.saveFile());
        this.loadBtn.addEventListener('click', () => this.loadFile());
        this.clearBtn.addEventListener('click', () => this.clearContent());
    }

    setupOnlineOfflineListeners() {
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
        this.updateOnlineStatus();
    }

    updateOnlineStatus() {
        const isOnline = navigator.onLine;
        this.statusBadge.textContent = isOnline ? 'Online' : 'Offline';
        this.statusBadge.classList.toggle('offline', !isOnline);
        this.updateStatus(isOnline ? 'You are online' : 'You are offline - app works in offline mode');
    }

    handleOnline() {
        this.updateOnlineStatus();
        this.updateStatus('Connection restored ✓');
    }

    handleOffline() {
        this.updateOnlineStatus();
        this.updateStatus('Connection lost - working offline');
    }

    async saveFile() {
        const filename = this.filenameInput.value.trim();
        const content = this.contentArea.value;

        if (!filename) {
            this.updateStatus('❌ Please enter a filename');
            return;
        }

        if (!content) {
            this.updateStatus('❌ Please enter some content');
            return;
        }

        try {
            // Check if File System Access API is available
            if ('showSaveFilePicker' in window) {
                await this.saveFileWithAPI(filename, content);
            } else {
                this.saveFileFallback(filename, content);
            }
        } catch (error) {
            console.error('Error saving file:', error);
            this.updateStatus(`❌ Error: ${error.message}`);
        }
    }

    async saveFileWithAPI(filename, content) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: filename,
                types: [
                    {
                        description: 'Text Files',
                        accept: { 'text/plain': ['.txt'] }
                    },
                    {
                        description: 'All Files',
                        accept: { '*/*': [] }
                    }
                ]
            });

            const writable = await handle.createWritable();
            await writable.write(content);
            await writable.close();

            this.addToRecentFiles(filename, content.length);
            this.updateStatus(`✓ File saved: ${filename}`);
            console.log('File saved with File System Access API');
        } catch (error) {
            if (error.name === 'AbortError') {
                this.updateStatus('File save cancelled');
            } else {
                throw error;
            }
        }
    }

    saveFileFallback(filename, content) {
        // Fallback: Download file using Blob
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.addToRecentFiles(filename, content.length);
        this.updateStatus(`✓ File downloaded: ${filename}`);
        console.log('File saved with download fallback');
    }

    async loadFile() {
        try {
            if ('showOpenFilePicker' in window) {
                await this.loadFileWithAPI();
            } else {
                this.loadFileFallback();
            }
        } catch (error) {
            console.error('Error loading file:', error);
            this.updateStatus(`❌ Error: ${error.message}`);
        }
    }

    async loadFileWithAPI() {
        try {
            const [handle] = await window.showOpenFilePicker({
                types: [
                    {
                        description: 'Text Files',
                        accept: { 'text/plain': ['.txt'] }
                    },
                    {
                        description: 'All Files',
                        accept: { '*/*': [] }
                    }
                ]
            });

            const file = await handle.getFile();
            const content = await file.text();

            this.filenameInput.value = file.name;
            this.contentArea.value = content;
            this.updateStatus(`✓ File loaded: ${file.name}`);
        } catch (error) {
            if (error.name === 'AbortError') {
                this.updateStatus('File load cancelled');
            } else {
                throw error;
            }
        }
    }

    loadFileFallback() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'text/*';
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.filenameInput.value = file.name;
                    this.contentArea.value = event.target.result;
                    this.updateStatus(`✓ File loaded: ${file.name}`);
                };
                reader.readAsText(file);
            }
        });
        input.click();
    }

    clearContent() {
        if (this.contentArea.value && !confirm('Clear all content?')) {
            return;
        }
        this.filenameInput.value = 'document.txt';
        this.contentArea.value = '';
        this.updateStatus('Content cleared');
    }

    addToRecentFiles(filename, size) {
        const file = { name: filename, size: size, timestamp: Date.now() };
        this.recentFiles.unshift(file);
        this.recentFiles = this.recentFiles.slice(0, 5); // Keep last 5 files
        this.saveRecentFiles();
        this.renderRecentFiles();
    }

    saveRecentFiles() {
        localStorage.setItem('pwa_recent_files', JSON.stringify(this.recentFiles));
    }

    loadRecentFiles() {
        const stored = localStorage.getItem('pwa_recent_files');
        if (stored) {
            try {
                this.recentFiles = JSON.parse(stored);
                this.renderRecentFiles();
            } catch (error) {
                console.error('Error loading recent files:', error);
            }
        }
    }

    renderRecentFiles() {
        this.filesList.innerHTML = '';

        if (this.recentFiles.length === 0) {
            const li = document.createElement('li');
            li.className = 'empty';
            li.textContent = 'No recent files';
            this.filesList.appendChild(li);
            return;
        }

        this.recentFiles.forEach((file) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>
                    <span class="file-item-name">${this.escapeHtml(file.name)}</span>
                    <span class="file-item-size">${this.formatFileSize(file.size)}</span>
                </span>
            `;
            li.addEventListener('click', () => {
                this.filenameInput.value = file.name;
                this.updateStatus(`Selected: ${file.name}`);
            });
            this.filesList.appendChild(li);
        });
    }

    updateStatus(message) {
        this.statusMessage.textContent = message;
        console.log('Status:', message);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('sw.js');
                console.log('Service Worker registered:', registration);
                this.updateStatus('Service Worker ready - offline mode enabled');
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new PWAFileApp();
    });
} else {
    new PWAFileApp();
}