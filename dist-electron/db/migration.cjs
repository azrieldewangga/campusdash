"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigration = void 0;
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
const index_cjs_1 = require("./index.cjs");
const runMigration = () => {
    console.log('[DEBUG-MIG] runMigration START');
    try {
        const db = (0, index_cjs_1.getDB)();
        console.log('[DEBUG-MIG] DB Acquired');
        const userDataPath = electron_1.app.getPath('userData');
        console.log('[DEBUG-MIG] UserData:', userDataPath);
        // Debug logging to file
        const fs = require('fs');
        const debugLog = (msg) => {
            try {
                fs.appendFileSync('debug_info.txt', `[Migration] ${msg}\n`);
            }
            catch { }
            console.log(`[Migration] ${msg}`);
        };
        console.log('[DEBUG-MIG] Preparing Check Stmt');
        const meta = db.prepare('SELECT value FROM meta WHERE key = ?').get('migrated_from_json');
        console.log('[DEBUG-MIG] Meta Json Check:', meta);
        const metaV2 = db.prepare('SELECT value FROM meta WHERE key = ?').get('migrated_v2');
        console.log('[DEBUG-MIG] Meta V2 Check:', metaV2);
        // Hardcoded check for project root if userData fails
        // Assuming project root is 2 levels up from userData if in dev default? No, usually distinct.
        // Let's assume the JSON is in the Current Working Directory (CWD) if running dev.
        const cwdJsonPath = path_1.default.join(process.cwd(), 'campusdash-db.json');
        const userDataJsonPath = path_1.default.join(userDataPath, 'campusdash-db.json');
        let sourcePath = userDataJsonPath;
        // Prioritize UserData (AppData) as per user request to ensure latest data
        if (fs.existsSync(userDataJsonPath)) {
            sourcePath = userDataJsonPath;
            debugLog(`Found JSON in UserData (Priority): ${userDataJsonPath}`);
        }
        else if (fs.existsSync(cwdJsonPath)) {
            sourcePath = cwdJsonPath;
            debugLog(`Found JSON in CWD: ${cwdJsonPath}`);
        }
        else {
            debugLog(`Msg: No JSON found at ${cwdJsonPath} or ${userDataJsonPath}`);
        }
        // If no JSON database found at all, skip.
        if (!fs.existsSync(sourcePath)) {
            // Only mark done if we are SURE. If missing, maybe just return?
            // If we mark done, retries won't happen.
            debugLog('ABORT: Source file not found.');
            return;
        }
        // V2 Logic (Enhanced to cover Schedule, Semesters, UserProfile)
        if (metaV2 && metaV2.value === 'true') {
            debugLog('Already migrated (v2). Skipping.');
        }
        else {
            debugLog(`Starting V2 Migration from: ${sourcePath}`);
            try {
                const raw = fs.readFileSync(sourcePath, 'utf-8');
                const data = JSON.parse(raw);
                const now = new Date().toISOString();
                const migrateV2Transaction = db.transaction(() => {
                    // 1. Transactions - INSERT OR IGNORE
                    if (Array.isArray(data.transactions)) {
                        const stmt = db.prepare(`
                            INSERT OR IGNORE INTO transactions (id, title, category, amount, currency, date, type, createdAt, updatedAt)
                            VALUES (@id, @title, @category, @amount, @currency, @date, @type, @createdAt, @updatedAt)
                        `);
                        for (const item of data.transactions) {
                            stmt.run({
                                id: item.id || crypto.randomUUID(),
                                title: item.title,
                                category: item.category,
                                amount: item.amount,
                                currency: item.currency || 'IDR',
                                date: item.date,
                                type: item.type,
                                createdAt: item.createdAt || now,
                                updatedAt: now
                            });
                        }
                        debugLog(`Imported ${data.transactions.length} transactions.`);
                    }
                    // 2. Grades -> Performance Courses & Semesters
                    // We need to collect semesters to populate performance_semesters table
                    const semestersSet = new Set();
                    if (Array.isArray(data.grades)) {
                        const stmt = db.prepare(`
                            INSERT OR REPLACE INTO performance_courses (id, semester, name, sks, grade, updatedAt)
                            VALUES (@id, @semester, @name, @sks, @grade, @updatedAt)
                        `);
                        for (const item of data.grades) {
                            // "course-1-0" -> sem 1
                            const parts = (item.courseId || '').split('-');
                            const semester = parts.length >= 2 ? parseInt(parts[1]) : 1;
                            semestersSet.add(semester);
                            stmt.run({
                                id: item.courseId || item.id,
                                semester: semester,
                                name: item.courseId,
                                sks: 3,
                                grade: item.grade,
                                updatedAt: item.updatedAt || now
                            });
                        }
                        debugLog(`Imported ${data.grades.length} grades.`);
                    }
                    // Populate Semesters Table
                    // Default IPS to 0.0 or calculate if possible. For now, 0.0 or 3.5 placeholders? 
                    // Let's just create rows so they exist.
                    const semStmt = db.prepare(`INSERT OR IGNORE INTO performance_semesters (semester, ips) VALUES (@semester, @ips)`);
                    semestersSet.forEach(sem => {
                        semStmt.run({ semester: sem, ips: 3.5 }); // Placeholder IPS
                    });
                    // Also ensure current semester from user profile exists
                    // 3. User Profile -> Meta
                    if (Array.isArray(data.user_profile) && data.user_profile.length > 0) {
                        const profile = data.user_profile[0];
                        if (profile) {
                            db.prepare('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)').run('user_name', profile.name);
                            db.prepare('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)').run('user_semester', String(profile.semester));
                            db.prepare('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)').run('user_avatar', profile.avatar);
                            // Ensure this semester exists too
                            semStmt.run({ semester: profile.semester, ips: 0.0 });
                            debugLog(`Imported User Profile: ${profile.name}, Sem: ${profile.semester}`);
                        }
                    }
                    // 4. Assignments
                    // Only run if not already present? Or INSERT OR IGNORE?
                    if (Array.isArray(data.assignments)) {
                        const stmt = db.prepare(`
                            INSERT OR IGNORE INTO assignments (id, title, course, type, status, deadline, note, createdAt, updatedAt)
                            VALUES (@id, @title, @course, @type, @status, @deadline, @note, @createdAt, @updatedAt)
                        `);
                        for (const item of data.assignments) {
                            stmt.run({
                                id: item.id || crypto.randomUUID(),
                                title: item.title,
                                course: item.courseId || item.course,
                                type: item.type,
                                status: item.status,
                                deadline: item.deadline,
                                note: item.note || '',
                                createdAt: item.createdAt || now,
                                updatedAt: item.updatedAt || now
                            });
                        }
                        debugLog(`Imported ${data.assignments.length} assignments.`);
                    }
                    // 5. Schedule
                    if (data.schedule) {
                        // Normalize schedule input: Could be array or object
                        let items = [];
                        if (Array.isArray(data.schedule)) {
                            items = data.schedule;
                        }
                        else if (typeof data.schedule === 'object') {
                            items = Object.values(data.schedule);
                        }
                        if (items.length > 0) {
                            const stmt = db.prepare(`
                                INSERT OR IGNORE INTO schedule_items (id, day, startTime, endTime, course, location, note, updatedAt)
                                VALUES (@id, @day, @startTime, @endTime, @course, @location, @note, @updatedAt)
                            `);
                            for (const item of items) {
                                if (item.id && item.day) {
                                    stmt.run({
                                        id: item.id,
                                        day: item.day,
                                        startTime: item.startTime,
                                        endTime: item.endTime,
                                        course: item.courseId || item.course,
                                        location: item.location || '',
                                        note: '',
                                        updatedAt: now
                                    });
                                }
                            }
                            debugLog(`Imported ${items.length} schedule items.`);
                        }
                    }
                    db.prepare('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)').run('migrated_v2', 'true');
                    db.prepare('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)').run('migrated_from_json', 'true');
                });
                migrateV2Transaction();
                debugLog('V2 Migration Transaction Committed.');
            }
            catch (error) {
                debugLog(`V2 Failed: ${error}`);
                console.error(error);
            }
        }
    }
    catch (criticalErr) {
        console.error('[DEBUG-MIG] CRITICAL MIGRATION FAILURE:', criticalErr);
    }
};
exports.runMigration = runMigration;
