import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import { getDB, closeDB } from './index.cjs';

export const backup = {
    export: async (destinationPath: string) => {
        const db = getDB();
        console.log('[Backup] Starting export to:', destinationPath);

        try {
            // Use better-sqlite3 native backup API
            // This is non-blocking and safe for WAL mode
            await db.backup(destinationPath);
            console.log('[Backup] Export successful');
            return { success: true };
        } catch (error: any) {
            console.error('[Backup] Export failed:', error);
            return { success: false, error: error.message };
        }
    },

    import: async (sourcePath: string) => {
        console.log('[Backup] Starting restore from:', sourcePath);

        try {
            // 1. Verify it's a valid SQLite file (simple header check or try opening)
            // We'll rely on try/catch wrapper logic in main implementation usually,
            // but here we just proceed with the copy replacement strategy.

            // 2. Close current connection
            closeDB();

            // 3. Determine DB path
            let dbPath;
            if (process.env.VITE_DEV_SERVER_URL) {
                dbPath = path.join(process.cwd(), 'campusdash.db');
            } else {
                dbPath = path.join(app.getPath('userData'), 'campusdash.db');
            }

            // 4. Force copy (Replace)
            // We use fs.copyFile
            await fs.promises.copyFile(sourcePath, dbPath);
            console.log('[Backup] Restore successful, DB replaced.');

            // 5. Restart App to ensure clean state and fresh connection
            app.relaunch();
            app.quit();

            return { success: true };
        } catch (error: any) {
            console.error('[Backup] Restore failed:', error);
            // Re-open DB if we failed so app doesn't crash entirely?
            // getDB() will lazy init again on next call.
            return { success: false, error: error.message };
        }
    }
};
