import { google } from 'googleapis';
import Store from 'electron-store';
import fs from 'fs';
import path from 'path';
import http from 'http';
import url from 'url';
import { shell, app } from 'electron';
// @ts-ignore
import log from 'electron-log/main.js';
// Initialize Store for saving tokens
const store = new Store({
    name: 'google-drive-tokens',
    encryptionKey: process.env.GOOGLE_ENCRYPTION_KEY || 'default-insecure-key' // Optional basic obfuscation
});
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
// Check if we have tokens on load
const savedTokens = store.get('tokens');
if (savedTokens && CLIENT_ID && CLIENT_SECRET) {
    oauth2Client.setCredentials(savedTokens);
}
let authServer = null;
export const driveService = {
    // 1. Authenticate User
    authenticate: async () => {
        // Close existing server if open
        if (authServer) {
            authServer.close();
            authServer = null;
        }
        return new Promise((resolve, reject) => {
            log.info('[Drive] Starting authentication flow...');
            if (!CLIENT_ID || !CLIENT_SECRET) {
                log.error('[Drive] Missing Client ID or Secret in environment variables');
                return reject(new Error('Missing Google API Credentials'));
            }
            const authUrl = oauth2Client.generateAuthUrl({
                access_type: 'offline', // Critical for Refresh Token
                scope: SCOPES,
                prompt: 'consent' // Force consent to ensure we get refresh token
            });
            // Creates a temp server to listen for callback
            authServer = http.createServer(async (req, res) => {
                try {
                    // @ts-ignore
                    if (req.url.startsWith('/oauth2callback')) {
                        log.info('[Drive] Received callback request');
                        // @ts-ignore
                        const qs = new url.URL(req.url, 'http://localhost:3000').searchParams;
                        const code = qs.get('code');
                        if (code) {
                            res.end('Authentication successful! You can close this window now.');
                            if (authServer)
                                authServer.close();
                            authServer = null;
                            const { tokens } = await oauth2Client.getToken(code);
                            oauth2Client.setCredentials(tokens);
                            store.set('tokens', tokens);
                            log.info('[Drive] Tokens saved successfully.');
                            resolve(true);
                        }
                        else {
                            res.end('Authentication failed. No code found.');
                            log.warn('[Drive] Auth failed: No code in callback.');
                            resolve(false);
                            if (authServer)
                                authServer.close();
                        }
                    }
                }
                catch (e) {
                    log.error('[Drive] Auth Callback Error:', e);
                    res.end('Error occurred during authentication.');
                    reject(e);
                    if (authServer)
                        authServer.close();
                }
            });
            authServer.listen(3000, () => {
                log.info('[Drive] Auth Server listening on port 3000');
                shell.openExternal(authUrl).catch(e => log.error('[Drive] Failed to open auth URL:', e));
            });
            authServer.on('error', (e) => {
                log.error('[Drive] Server Error:', e);
                reject(e);
            });
        });
    },
    // Helper: Find or Create Folder
    getOrCreateFolder: async (drive, folderName) => {
        try {
            // Check if folder exists
            const res = await drive.files.list({
                q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
                fields: 'files(id, name)',
                spaces: 'drive',
            });
            if (res.data.files && res.data.files.length > 0) {
                log.info(`[Drive] Found folder '${folderName}':`, res.data.files[0].id);
                return res.data.files[0].id; // Return first match
            }
            // Create if not exists
            log.info(`[Drive] Creating folder '${folderName}'...`);
            const fileMetadata = {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
            };
            const folder = await drive.files.create({
                requestBody: fileMetadata,
                fields: 'id',
            });
            log.info(`[Drive] Folder created:`, folder.data.id);
            return folder.data.id;
        }
        catch (e) {
            log.error('[Drive] Error finding/creating folder:', e);
            throw e;
        }
    },
    // 2. Upload Backup
    uploadDatabase: async () => {
        try {
            // Check auth
            // @ts-ignore
            if (!oauth2Client.credentials || Object.keys(oauth2Client.credentials).length === 0) {
                log.warn('[Drive] Not authenticated. Attempting refresh or failing.');
                throw new Error('Not authenticated - Please connect Google Drive in Settings');
            }
            const drive = google.drive({ version: 'v3', auth: oauth2Client });
            // Paths
            let dbPath;
            if (process.env.VITE_DEV_SERVER_URL) {
                // In Dev, DB is in project root
                dbPath = path.join(process.cwd(), 'campusdash.db');
                log.info('[Drive] Dev Mode: Using CWD database:', dbPath);
            }
            else {
                const userDataPath = app.getPath('userData');
                dbPath = path.join(userDataPath, 'campusdash.db');
            }
            if (!fs.existsSync(dbPath)) {
                throw new Error('Database file not found at: ' + dbPath);
            }
            // Get Folder ID
            // @ts-ignore
            const folderId = await driveService.getOrCreateFolder(drive, 'CampusDash Backup');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `backup-campusdash-${timestamp}.db`; // CHANGED: .db extension
            // Upload directly
            const fileMetadata = {
                name: fileName,
                // parents: [folderId] // Use specific folder
                parents: [folderId]
            };
            const media = {
                mimeType: 'application/x-sqlite3', // CHANGED: correct mime for sqlite
                body: fs.createReadStream(dbPath)
            };
            log.info('[Drive] Starting upload to folder:', folderId);
            const res = await drive.files.create({
                requestBody: fileMetadata,
                media: media,
                fields: 'id'
            });
            log.info('[Drive] Upload success, ID:', res.data.id);
            // Update last backup time
            store.set('lastBackup', Date.now());
            // @ts-ignore
            return res.data.id;
        }
        catch (error) {
            log.error('[Drive] Upload failed DETAILED:', error);
            // @ts-ignore
            throw new Error(error.message || 'Upload failed');
        }
    },
    // 3. Check Status
    isAuthenticated: () => {
        // @ts-ignore
        return !!oauth2Client.credentials && !!oauth2Client.credentials.access_token;
    },
    getLastBackup: () => {
        return store.get('lastBackup');
    },
    // Logout
    logout: () => {
        store.delete('tokens');
        oauth2Client.setCredentials({});
    },
    // Scheduler
    checkAndRunAutoBackup: async () => {
        // @ts-ignore
        if (!oauth2Client.credentials || !oauth2Client.credentials.access_token)
            return;
        const lastBackup = store.get('lastBackup');
        const now = Date.now();
        const WEEK = 7 * 24 * 60 * 60 * 1000;
        if (!lastBackup || (now - lastBackup > WEEK)) {
            log.info('[Drive] Auto-backup triggered (Last: ' + (lastBackup ? new Date(lastBackup).toISOString() : 'Never') + ')');
            try {
                await driveService.uploadDatabase();
                log.info('[Drive] Auto-backup completed.');
            }
            catch (e) {
                log.error('[Drive] Auto-backup failed:', e);
            }
        }
        else {
            log.info('[Drive] Auto-backup skipped (Recent backup found).');
        }
    }
};
