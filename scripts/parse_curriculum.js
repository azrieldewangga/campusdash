
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const htmlPath = path.join(__dirname, '../Kurikulum.html');
const content = fs.readFileSync(htmlPath, 'utf-8');

const semesters = {};
let currentSemester = null;

// Regex to find Semester headers
// <table...>\s*<tbody><tr>\s*<td><strong>Semester : (\d+) </strong></td>
// This might be multiline, so be careful.
// Simpler approach: split by "Semester :"

const lines = content.split('\n');
let capturing = false;

// Regex for course row:
// We look for rows that have the specific structure.
// <td width="300"><div align="left"><font size="2">MW-Agama</font></div></td>
// <td width="65"> <div align="center"><font size="2"><b>SKS</b></font></div></td> (Header)
// Value row:
// <td width="300"><div align="left"><font size="2">THE COURSE NAME</font></div></td>
// ...
// <td width="65"><div align="center"><font size="2">\s*(\d+)\s*</font></div></td> (SKS)

// Let's use a simpler state machine approach
const courseNameRegex = /<td width="300"><div align="left"><font size="2">(.*?)<\/font><\/div><\/td>/;
const sksRegex = /<td width="65"><div align="center"><font size="2">\s*(\d+)\s*<\/font><\/div><\/td>/;
const semesterRegex = /<strong>Semester : (\d+) <\/strong>/;

let courses = [];
let pendingCourse = null;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const semMatch = line.match(semesterRegex);
    if (semMatch) {
        if (currentSemester) {
            semesters[currentSemester] = courses;
        }
        currentSemester = semMatch[1];
        courses = [];
        continue;
    }

    const nameMatch = line.match(courseNameRegex);
    if (nameMatch) {
        // We found a name, look ahead for SKS (it's usually a few lines down)
        // Or we can just capture it and wait for SKS.
        // The structure is Table Row -> Cell 1 -> Cell 2 -> Cell 3 (Name) -> ... -> Cell 5 (SKS)
        // Since we are iterating lines, we need to be careful.
        // Actually, looking at the file, the SKS is several lines after the name.

        // Let's grab the name.
        const rawName = nameMatch[1];
        // Clean up name (remove MW-, MPK-, etc if desired, but user just said "matkul")
        // User probably wants the full name or stripped. Let's keep it full for now, or strip the prefix if it looks like a code.
        // Example: MW-Agama. "MW" is likely logical group.
        // I'll keep it as is.
        pendingCourse = { name: rawName.trim() };
    }

    if (pendingCourse) {
        // We have a name, looking for SKS.
        // The SKS line looks like: <td width="65"><div align="center"><font size="2">\n\s*2\s*</font></div></td>
        // It might be split across lines.
        // In the file view:
        // 107:     <td width="65"><div align="center"><font size="2">
        // 108:     2    </font></div></td>

        // So we might match just the number line if we are inside the SKS cell.

        // Let's just find the line that has a single number surrounded by whitespace inside font tag?
        // Or simpler: The SKS is the 2nd number after the name in the row structure.
        // But parsing line-by-line is fragile.

        // Alternative: Read the whole file as one string and use regex with global flag.
    }
}

// Better 2nd Pass: Regex on full content
// Block for a semester starts with "Semester : X" and ends at next "Semester :" or end of file.

const semesterBlocks = content.split(/<strong>Semester : (\d+) <\/strong>/);
// Split results: [ "Header stuff", "1", "Semester 1 content...", "2", "Semester 2 content...", ... ]

for (let i = 1; i < semesterBlocks.length; i += 2) {
    const semNum = semesterBlocks[i];
    const semContent = semesterBlocks[i + 1];

    // Find courses in semContent
    // Pattern: 
    // <td width="300"><div align="left"><font size="2">NAME</font></div></td>
    // ...
    // ... (Jenis)
    // ...
    // <td width="65"><div align="center"><font size="2">\s*SKS\s*</font></div></td>

    // Using global regex on the block
    // We strictly look for the Name pattern.
    // note: Name pattern might contain special chars.

    const blockCourses = [];
    const courseRegex = /<td width="300"><div align="left"><font size="2">([^<]+)<\/font><\/div><\/td>[\s\S]*?<td width="65"><div align="center"><font size="2">\s*(\d+)\s*<\/font><\/div><\/td>/g;

    let match;
    while ((match = courseRegex.exec(semContent)) !== null) {
        blockCourses.push({
            name: match[1].trim(),
            sks: parseInt(match[2].trim())
        });
    }

    semesters[semNum] = blockCourses;
}

const outputPath = path.join(__dirname, '../src/lib/curriculum.json');
// Ensure dir exists
if (!fs.existsSync(path.dirname(outputPath))) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(semesters, null, 2));
console.log('Curriculum extracted to', outputPath);
