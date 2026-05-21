import Database from 'better-sqlite3';
import sqliteExtExpert from 'better-sqlite3-expert';
import { randomBytes } from 'node:crypto';

const sql = String.raw;

it('Check extension work', () => {
    const db = new Database(':memory:');
    
    db.loadExtension(sqliteExtExpert());
    db.prepare(sql`
        CREATE TABLE test (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        );
    `).run();
    
    let hash;
    
    for (let i = 0; i < 10000; i++) {
        const name = randomBytes(16).toString('hex');
        
        if (i === 8000) {
            hash = name;
        }
        
        db.prepare(sql`
            INSERT INTO test (name) VALUES ('${name}');
        `).run();
    }
    
    const result_1 = db.prepare(sql`
        SELECT expert_suggest(?) as suggestion;
    `).pluck().get(
        "SELECT * FROM test WHERE name = '${hash}'",
    );
    
    expect(result_1).toBe(`CREATE INDEX test_idx_00015c29 ON test(name);\n\n`);
});