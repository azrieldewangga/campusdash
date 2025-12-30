const Database = require('better-sqlite3');
const path = require('path');

// Connect to DB
const dbPath = path.join(__dirname, 'campusdash.db');
console.log('Opening DB:', dbPath);
const db = new Database(dbPath);

try {
    // Check Meta
    const meta = db.prepare('SELECT * FROM meta').all();
    console.log('--- META ---');
    console.table(meta);

    // Check Columns of schedule_items
    const cols = db.pragma('table_info(schedule_items)');
    console.log('--- COLUMNS: schedule_items ---');
    console.table(cols);

    // Check Data
    const items = db.prepare('SELECT * FROM schedule_items').all();
    console.log('--- SCHEDULE ITEMS ---');
    console.log(JSON.stringify(items, null, 2));

} catch (err) {
    console.error('Error:', err);
}
