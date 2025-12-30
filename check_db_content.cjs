const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'campusdash.db');
console.log('Checking DB at:', dbPath);

try {
    const db = new Database(dbPath, { readonly: true });

    console.log('\n--- META TABLE ---');
    const meta = db.prepare('SELECT * FROM meta').all();
    console.log(meta);

    console.log('\n--- PERFORMANCE COURSES ---');
    const courses = db.prepare('SELECT * FROM performance_courses LIMIT 5').all();
    console.log(courses);

    console.log('\n--- TRANSACTIONS ---');
    const transactions = db.prepare('SELECT * FROM transactions LIMIT 5').all();
    console.log(transactions);

} catch (err) {
    console.error('Error reading DB:', err);
}
