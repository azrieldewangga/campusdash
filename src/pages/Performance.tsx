import { useEffect, useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { GraduationCap } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import GlassCard from '../components/shared/GlassCard';

const Performance = () => {
    const { grades, fetchGrades, updateGrade, userProfile, getSemesterCourses } = useStore();



    useEffect(() => {
        fetchGrades();
    }, [userProfile]);

    const [viewSemester, setViewSemester] = useState(1);

    useEffect(() => {
        if (userProfile?.semester) {
            setViewSemester(userProfile.semester);
        }
    }, [userProfile?.semester]);

    const chartData = useMemo(() => {
        if (!userProfile) return [];

        const gradeValues: Record<string, number> = {
            'A': 4.00,
            'A-': 3.75,
            'AB': 3.50,
            'B+': 3.25,
            'B': 3.00,
            'BC': 2.50,
            'C': 2.00,
            'D': 1.00,
            'E': 0.00
        };

        const currentSem = userProfile.semester ? parseInt(userProfile.semester.toString()) : 1;
        const validSem = isNaN(currentSem) ? 1 : currentSem;

        const data = [];
        for (let i = 1; i <= validSem; i++) {
            const courses = getSemesterCourses(i);
            let totalSks = 0;
            let totalPoints = 0;
            let hasGrades = false;

            courses.forEach(course => {
                const grade = grades[course.id];
                if (grade && gradeValues[grade] !== undefined) {
                    const sks = course.sks || 0;
                    totalPoints += gradeValues[grade] * sks;
                    totalSks += sks;
                    hasGrades = true;
                }
            });

            const ips = totalSks > 0 ? (totalPoints / totalSks) : 0;

            data.push({
                semester: `Sem ${i}`,
                ips: parseFloat(ips.toFixed(2)),
                rawSem: i
            });
        }
        return data;
    }, [userProfile, grades, getSemesterCourses]);

    // We want to show ALL semesters up to the current one (or more if they have data).
    // Requirement: "Performance memperlihatkan isi seluruh semester".
    // We will render a list of semesters.

    // Derive list of semester numbers to show (1 to userProfile.semester)
    const semesterList = useMemo(() => {
        if (!userProfile || !userProfile.semester) return [1];
        const semCount = typeof userProfile.semester === 'string' ? parseInt(userProfile.semester) : userProfile.semester;
        if (isNaN(semCount) || semCount < 1) return [1];

        const list = [];
        for (let i = 1; i <= semCount; i++) {
            list.push(i);
        }
        return list;
    }, [userProfile]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold flex items-center gap-2">
                <GraduationCap />
                Prestasi Akademik
            </h1>

            {/* IPS Trend Chart */}
            <GlassCard className="p-6">
                <h3 className="text-xl font-bold mb-4">Grafik IPS</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={chartData}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorIps" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.8} />
                                    <stop offset="50%" stopColor="var(--color-primary)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                            <XAxis dataKey="semester" />
                            <YAxis domain={[0, 4]} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1d232a', borderColor: '#374151' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="ips"
                                stroke="var(--color-primary)"
                                fillOpacity={1}
                                fill="url(#colorIps)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </GlassCard>



            {/* Access View Semester Courses */}
            {(() => {
                const semesterCourses = getSemesterCourses(viewSemester);

                return (
                    <GlassCard className="overflow-x-auto" bodyClassName="p-0">
                        <div className="p-4 bg-base-100/30 backdrop-blur-md font-bold text-lg flex justify-between items-center border-b border-white/10">
                            <span>Mata Kuliah</span>
                            <span className="text-sm font-normal opacity-70">
                                {semesterCourses.length} Courses
                            </span>
                        </div>
                        <table className="table w-full">
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Mata Kuliah</th>
                                    <th>SKS</th>
                                    <th>Nilai</th>
                                </tr>
                            </thead>
                            <tbody>
                                {semesterCourses.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="text-center py-8 opacity-50">
                                            No courses found for this semester.
                                        </td>
                                    </tr>
                                ) : (
                                    semesterCourses.map((course, idx) => (
                                        <tr key={idx} className="hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                                            <th>{idx + 1}</th>
                                            <td className="font-medium">{course.name}</td>
                                            <td>{course.sks}</td>
                                            <td>
                                                <div className="dropdown dropdown-end">
                                                    <div
                                                        tabIndex={0}
                                                        role="button"
                                                        className="btn btn-sm btn-ghost gap-2 h-8 min-h-0 px-4 font-medium text-sm border border-base-300 rounded-lg hover:bg-base-200 min-w-[70px] justify-between"
                                                    >
                                                        <span>{grades[course.id] || '-'}</span>
                                                        <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                    </div>
                                                    <ul tabIndex={0} className="dropdown-content menu p-2 shadow-lg bg-base-100 rounded-xl w-24 border border-base-300 mt-1" style={{ position: 'fixed', zIndex: 9999 }}>
                                                        {['A', 'A-', 'AB', 'B+', 'B', 'BC', 'C', 'D', 'E'].map(g => (
                                                            <li key={g}>
                                                                <button
                                                                    onClick={() => updateGrade(course.id, g)}
                                                                    className={`text-sm ${grades[course.id] === g ? 'active' : ''}`}
                                                                >
                                                                    {g}
                                                                </button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </GlassCard>
                );
            })()}

            {/* Bottom Semester Pagination (Radio Style) */}
            <div className="flex justify-center mt-6 pb-6">
                <div className="join">
                    {semesterList.map((sem) => (
                        <input
                            key={sem}
                            className="join-item btn btn-square"
                            type="radio"
                            name="semester-pagination"
                            aria-label={`${sem}`}
                            checked={viewSemester === sem}
                            onChange={() => setViewSemester(sem)}
                        />
                    ))}
                </div>
            </div>

        </div>
    );
};

export default Performance;
