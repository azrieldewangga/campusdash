import { getDB } from './index.cjs';

export const assignments = {
    getAll: () => {
        const db = getDB();
        return db.prepare('SELECT * FROM assignments ORDER BY deadline ASC').all();
    },

    create: (assignment: any) => {
        const db = getDB();
        const stmt = db.prepare(`
            INSERT INTO assignments (id, title, course, type, status, deadline, note, semester, createdAt, updatedAt)
            VALUES (@id, @title, @course, @type, @status, @deadline, @note, @semester, @createdAt, @updatedAt)
        `);
        stmt.run(assignment);
        return assignment;
    },

    update: (id: string, data: any) => {
        const db = getDB();
        const sets = Object.keys(data).map(key => `${key} = @${key}`).join(', ');
        const stmt = db.prepare(`UPDATE assignments SET ${sets}, updatedAt = @updatedAt WHERE id = @id`);

        const info = stmt.run({ ...data, id, updatedAt: new Date().toISOString() });
        return info.changes > 0;
    },

    updateStatus: (id: string, status: string) => {
        const db = getDB();
        const stmt = db.prepare('UPDATE assignments SET status = ?, updatedAt = ? WHERE id = ?');
        const info = stmt.run(status, new Date().toISOString(), id);
        return info.changes > 0;
    },

    delete: (id: string) => {
        const db = getDB();
        const stmt = db.prepare('DELETE FROM assignments WHERE id = ?');
        const info = stmt.run(id);
        return info.changes > 0;
    }
};
