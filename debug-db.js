import Database from 'better-sqlite3';
const db = new Database('./campusdash.db');

console.log('--- USER PROFILE ---');
try {
    const meta = db.prepare('SELECT * FROM meta').all();
    console.log(JSON.stringify(meta, null, 2));
} catch (e) {
    console.log('Error reading meta:', e.message);
}

console.log('\n--- ASSIGNMENTS ---');
try {
    const assignments = db.prepare('SELECT * FROM assignments').all();
    console.log(JSON.stringify(assignments, null, 2));
} catch (e) {
    console.log('Error reading assignments:', e.message);
}
