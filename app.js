// PWA App - File Writing with Offline Support (Direct Save)

class PWAFileApp {
    constructor() {
        this.db = null;
        this.recentFiles = [];
        this.init();
    }

    async init() {
        this.setupElements();
        this.setupEventListeners();
        this.setupServiceWorker();
        this.setupOnlineOfflineListeners();
        await this.initDatabase();
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

    // Initialize IndexedDB
    async initDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('PWAFileWriter', 1);

            request.onerror = () => {
                console.error('Database error:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('Database initialized');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('files')) {
                    db.createObjectStore('files', { keyPath: 'name' });
                    console.log('Object store created');
                }
            };
        });
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
            // Save to IndexedDB
            await this.saveToIndexedDB(filename, content);

            // Also try to save locally if File System Access API available
            if ('showSaveFilePicker' in window) {
                await this.saveToFileSystem(filename, content);
            }

            this.addToRecentFiles(filename, content.length);
            this.updateStatus(`✓ File saved: ${filename}`);
        } catch (error) {
            console.error('Error saving file:', error);
            this.updateStatus(`❌ Error: ${error.message}`);
        }
    }

    async saveToIndexedDB(filename, content) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['files'], 'readwrite');
            const store = transaction.objectStore('files');

            const fileData = {
                name: filename,
                content: content,
                size: content.length,
                timestamp: Date.now()
            };

            const request = store.put(fileData);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                console.log('File saved to IndexedDB');
                resolve();
            };
        });
    }

    async saveToFileSystem(filename, content) {
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

            console.log('File saved to file system');
        } catch (error) {
            if (error.name !== 'AbortError') {
                throw error;
            }
            // User cancelled the picker - that's OK
        }
    }

    async loadFile() {
        try {
            // Try file picker first
            if ('showOpenFilePicker' in window) {
                await this.loadFromFileSystem();
            } else {
                this.loadFileFallback();
            }
        } catch (error) {
            console.error('Error loading file:', error);
            if (error.name !== 'AbortError') {
                this.updateStatus(`❌ Error: ${error.message}`);
            }
        }
    }

    async loadFromFileSystem() {
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
        this.recentFiles = this.recentFiles.slice(0, 5);
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
            li.addEventListener('click', () => this.loadFromStorage(file.name));
            this.filesList.appendChild(li);
        });
    }

    async loadFromStorage(filename) {
        try {
            const content = await this.getFromIndexedDB(filename);
            if (content) {
                this.filenameInput.value = filename;
                this.contentArea.value = content;
                this.updateStatus(`✓ Loaded from storage: ${filename}`);
            }
        } catch (error) {
            console.error('Error loading from storage:', error);
            this.updateStatus(`❌ Error loading file`);
        }
    }

    async getFromIndexedDB(filename) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['files'], 'readonly');
            const store = transaction.objectStore('files');
            const request = store.get(filename);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                resolve(request.result ? request.result.content : null);
            };
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
