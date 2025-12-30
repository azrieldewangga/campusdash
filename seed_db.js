import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const gradesMap = {
    "1": [
        "A-", "AB", "BC", "C", "BC", "A", "B", "B+", "AB", "C", "AB"
    ],
    "2": [
        "B+", "A-", "C", "AB", "Belum Isi Kuesioner", "B", "A-", "AB", "BC", "B", "AB", "AB"
    ],
    "3": [
        "AB", "A", "-", "AB", "A", "B+", "A-", "B", "B+", "B+", "A-"
    ]
};

const dbPath = path.join(process.cwd(), 'campusdash-db.json');

const userProfile = {
    id: "user-default-1",
    name: "Ellaku",
    semester: 4,
    avatar: "https://ui-avatars.com/api/?name=Ellaku&background=random",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

const grades = [];

Object.entries(gradesMap).forEach(([semester, semesterGrades]) => {
    semesterGrades.forEach((grade, index) => {
        grades.push({
            id: `grade-${semester}-${index}`,
            courseId: `course-${semester}-${index}`,
            grade: grade,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    });
});

const dbData = {
    "user_profile": [userProfile],
    "grades": grades,
    "assignments": [],
    "schedule": []
};

fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2));

console.log(`Database seeded at ${dbPath}`);
