# PWA File Writer

🚀 A modern Progressive Web Application for writing and saving files with full offline support.

## Features

✅ **File System Access API** - Direct file save/load with native file picker
✅ **Offline Support** - Full functionality even without internet connection
✅ **PWA Installation** - Install on desktop/mobile as a standalone app
✅ **Service Worker** - Automatic caching for offline use
✅ **Recent Files** - Quick access to recently saved files
✅ **Responsive Design** - Works great on mobile and desktop
✅ **No Backend Required** - Everything runs in the browser

## Getting Started

1. Clone or download this repository
2. Deploy to a web server (or use locally with `python -m http.server`)
3. Open in your browser
4. Click "Add to Home Screen" or install from the app menu

## How to Use

1. **Write Content** - Type your text in the editor
2. **Enter Filename** - Provide a filename (e.g., `document.txt`)
3. **Save File** - Click "Save to File" to save using File System Access API
   - On browsers that don't support it, it will download the file
4. **Load File** - Click "Load File" to open a file from your device
5. **Recent Files** - Click on recent files to quickly select them

## Browser Support

| Feature | Browser Support |
|---------|----------------|
| File System Access API | Chrome 86+, Edge 86+, Opera 72+ |
| Service Worker | All modern browsers |
| IndexedDB | All modern browsers |
| PWA Installation | All modern browsers |

## File System Access API

The app uses the **File System Access API** to provide native file operations:
- Direct save dialog for choosing file location
- Direct load dialog for selecting files
- Graceful fallback to download/upload for unsupported browsers

## Offline Capabilities

The Service Worker caches:
- HTML/CSS/JavaScript assets
- Recent file metadata in localStorage
- Enables full app functionality without network

## Project Structure

```
.
├── index.html        # Main HTML file
├── styles.css        # Responsive styling
├── app.js           # Main application logic
├── sw.js            # Service Worker
├── manifest.json    # PWA manifest
└── README.md        # This file
```

## Installation as PWA

### Desktop (Chrome/Edge)
1. Open the app in your browser
2. Click the install icon in the address bar
3. Click "Install"

### Mobile (Android Chrome)
1. Open the app in Chrome
2. Tap menu (⋮)
3. Tap "Install app"
4. Confirm

### iOS
1. Open in Safari
2. Tap Share button
3. Tap "Add to Home Screen"

## Technical Details

### Service Worker Strategy
- **Cache First** - Serve from cache, fallback to network
- **Cache name**: `pwa-file-writer-v1`
- **Auto-update**: Old caches cleaned on activation

### Storage
- **localStorage** - Recent files list (max 5 files)
- **File System** - Actual file storage via File System Access API
- **Cache API** - Offline resources

### APIs Used
- File System Access API
- Service Workers
- Cache API
- localStorage
- FileReader API
- Blob API

## Security Considerations

✓ HTTPS required for PWA installation
✓ File System Access API requires user permission
✓ No server-side storage (all local)
✓ No external dependencies
✓ Content Security Policy friendly

## Troubleshooting

**File System Access API not working?**
- Check browser support (Chrome 86+, Edge 86+)
- Ensure page is served over HTTPS
- Check browser permissions
- Fallback to download/upload will work

**Service Worker not registering?**
- Check browser console for errors
- Ensure page is served over HTTPS
- Clear site data and reload

**Recent files not showing?**
- Check localStorage quota
- Clear browser cache if corrupted
- Use browser DevTools to inspect localStorage

## Future Enhancements

- [ ] Syntax highlighting for code files
- [ ] Cloud sync (Firebase/Supabase)
- [ ] Collaborative editing
- [ ] File encryption
- [ ] Version history
- [ ] Search functionality

## License

MIT - Feel free to use and modify

## Support

For issues or questions, please create an issue in the repository.
