import { getDB } from './index.cjs';

export const transactions = {
    getAll: (params?: { currency?: string }) => {
        const db = getDB();
        let query = 'SELECT * FROM transactions';
        const args: any[] = [];

        if (params?.currency) {
            query += ' WHERE currency = ?';
            args.push(params.currency);
        }

        query += ' ORDER BY date DESC, createdAt DESC';
        return db.prepare(query).all(...args);
    },

    create: (transaction: any) => {
        const db = getDB();
        const stmt = db.prepare(`
            INSERT INTO transactions (id, title, category, amount, currency, date, type, createdAt, updatedAt)
            VALUES (@id, @title, @category, @amount, @currency, @date, @type, @createdAt, @updatedAt)
        `);
        stmt.run(transaction);
        return transaction;
    },

    delete: (id: string) => {
        const db = getDB();
        const stmt = db.prepare('DELETE FROM transactions WHERE id = ?');
        const info = stmt.run(id);
        return info.changes > 0;
    },

    update: (id: string, data: any) => {
        const db = getDB();
        const sets = Object.keys(data).map(key => `${key} = @${key}`).join(', ');
        const stmt = db.prepare(`UPDATE transactions SET ${sets}, updatedAt = @updatedAt WHERE id = @id`);
        const info = stmt.run({ ...data, id, updatedAt: new Date().toISOString() });
        return info.changes > 0;
    },

    getSummary: (currency: string) => {
        const db = getDB();
        const income = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE type = 'income' AND currency = ?").get(currency) as any;
        const expense = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE type = 'expense' AND currency = ?").get(currency) as any;

        // Note: Amount stored for expense is usually negative logic in frontend, 
        // but here we just sum. If FE sends negative for expense, SUM works. 
        // If FE sends positive for expense, we might need logic.
        // Assuming raw storage: Income (+), Expense (-) based on current app logic.

        return {
            income: income?.total || 0,
            expense: expense?.total || 0,
            balance: (income?.total || 0) + (expense?.total || 0)
        };
    },

    clearAll: () => {
        const db = getDB();
        db.prepare('DELETE FROM transactions').run();
        return true;
    }
};
