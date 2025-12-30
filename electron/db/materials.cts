import { getDB } from './index.cjs';

export const materials = {
    getByCourse: (courseId: string) => {
        const db = getDB();
        return db.prepare('SELECT * FROM course_materials WHERE course_id = ? ORDER BY created_at DESC').all(courseId);
    },

    add: (id: string, courseId: string, type: 'link' | 'file', title: string, url: string) => {
        const db = getDB();
        const stmt = db.prepare(`
            INSERT INTO course_materials (id, course_id, type, title, url, created_at)
            VALUES (@id, @courseId, @type, @title, @url, @createdAt)
        `);
        const newItem = {
            id,
            courseId,
            type,
            title,
            url,
            createdAt: new Date().toISOString()
        };
        stmt.run(newItem);
        return newItem;
    },

    delete: (id: string) => {
        const db = getDB();
        db.prepare('DELETE FROM course_materials WHERE id = ?').run(id);
        return true;
    }
};
