import { useEffect, useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Calendar, Clock, Search, X, MapPin, User as UserIcon, MoreHorizontal, Edit2, Trash2, RefreshCw, ChevronLeft, ChevronRight, FileText, Link as LinkIcon, Plus, ExternalLink } from 'lucide-react';
import clsx from 'clsx';
import { createPortal } from 'react-dom';
import GlassCard from '../components/shared/GlassCard';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
const TIMES = [
    '08:00', '08:50', '09:00', '09:40', '10:00',
    '10:30', '11:00', '11:20', '12:00', '13:00',
    '13:50', '14:00', '14:40', '15:00', '16:00'
];

// 1. POOL DARK THEME (Glassmorphism + Neon Text)
const DARK_COLORS = [
    { name: 'Yellow', bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/50' },
    { name: 'Blue', bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/50' },
    { name: 'Green', bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50' },
    { name: 'Purple', bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/50' },
    { name: 'Orange', bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/50' },
    { name: 'Red', bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' },
    { name: 'Teal', bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500/50' },
    { name: 'Pink', bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/50' },
    { name: 'Indigo', bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/50' },
    { name: 'Cyan', bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/50' },
    { name: 'Lime', bg: 'bg-lime-500/20', text: 'text-lime-400', border: 'border-lime-500/50' },
    { name: 'Rose', bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/50' },
    { name: 'Fuchsia', bg: 'bg-fuchsia-500/20', text: 'text-fuchsia-400', border: 'border-fuchsia-500/50' },
    { name: 'Violet', bg: 'bg-violet-500/20', text: 'text-violet-400', border: 'border-violet-500/50' },
    { name: 'Sky', bg: 'bg-sky-500/20', text: 'text-sky-400', border: 'border-sky-500/50' },
    { name: 'Amber', bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/50' },
];

// 2. POOL LIGHT THEME (Pastel BG + Dark Text - Inverse of Dark)
const LIGHT_COLORS = [
    { name: 'Yellow', bg: 'bg-yellow-100', text: 'text-yellow-900', border: 'border-yellow-300' },
    { name: 'Blue', bg: 'bg-blue-100', text: 'text-blue-900', border: 'border-blue-300' },
    { name: 'Green', bg: 'bg-green-100', text: 'text-green-900', border: 'border-green-300' },
    { name: 'Purple', bg: 'bg-purple-100', text: 'text-purple-900', border: 'border-purple-300' },
    { name: 'Orange', bg: 'bg-orange-100', text: 'text-orange-900', border: 'border-orange-300' },
    { name: 'Red', bg: 'bg-red-100', text: 'text-red-900', border: 'border-red-300' },
    { name: 'Teal', bg: 'bg-teal-100', text: 'text-teal-900', border: 'border-teal-300' },
    { name: 'Pink', bg: 'bg-pink-100', text: 'text-pink-900', border: 'border-pink-300' },
    { name: 'Indigo', bg: 'bg-indigo-100', text: 'text-indigo-900', border: 'border-indigo-300' },
    { name: 'Cyan', bg: 'bg-cyan-100', text: 'text-cyan-900', border: 'border-cyan-300' },
    { name: 'Lime', bg: 'bg-lime-100', text: 'text-lime-900', border: 'border-lime-300' },
    { name: 'Rose', bg: 'bg-rose-100', text: 'text-rose-900', border: 'border-rose-300' },
    { name: 'Fuchsia', bg: 'bg-fuchsia-100', text: 'text-fuchsia-900', border: 'border-fuchsia-300' },
    { name: 'Violet', bg: 'bg-violet-100', text: 'text-violet-900', border: 'border-violet-300' },
    { name: 'Sky', bg: 'bg-sky-100', text: 'text-sky-900', border: 'border-sky-300' },
    { name: 'Amber', bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-300' },
];

const Schedule = () => {
    const {
        courses,
        fetchCourses,
        userProfile,
        schedule,
        fetchSchedule,
        setScheduleItem,
        performanceRecords,
        theme,
        grades,
        getSemesterCourses,
        fetchMaterials,
        materials,
        addMaterial,
        deleteMaterial
    } = useStore();
    const [searchTerm, setSearchTerm] = useState('');

    // --- STATES ---
    // 1. Course Selector (Empty Slot Left Click)
    const [activeSlot, setActiveSlot] = useState<{ day: string, time: string, rect: DOMRect | null } | null>(null);

    // 2. Details View (Filled Slot Left Click)
    const [detailSlot, setDetailSlot] = useState<{ day: string, time: string, data: any, rect: DOMRect | null } | null>(null);

    // 3. Context Menu (Filled Slot Right Click)
    const [contextMenu, setContextMenu] = useState<{ day: string, time: string, x: number, y: number } | null>(null);

    // 4. Edit Details Mode (Using the Detail View but with inputs)
    const [isEditingDetail, setIsEditingDetail] = useState(false);
    const [editForm, setEditForm] = useState({ room: '', lecturer: '' });

    // 5. Link Form State
    const [isAddingLink, setIsAddingLink] = useState(false);
    const [linkForm, setLinkForm] = useState({ title: '', url: '' });

    useEffect(() => {
        fetchCourses();
        fetchSchedule();
        const closeAll = () => {
            setActiveSlot(null);
            setDetailSlot(null);
            setContextMenu(null);
            setIsEditingDetail(false);
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeAll();
        };

        window.addEventListener('click', closeAll);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('click', closeAll);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [userProfile]);

    // ... (window events)

    const getCourseForSlot = (day: string, time: string) => {
        const item = schedule[`${day}-${time}`];
        if (!item || !item.course) return null;

        // 1. Try ID Match in Current Semester
        let course = courses.find(c => c.id === item.course);

        // 2. Fallback: Name Match in Current Semester (Legacy/Mismatch)
        if (!course && item.course) {
            course = courses.find(c => c.name === item.course || c.name.toLowerCase() === item.course.toLowerCase());
        }

        // 3. Fallback: Search in ALL DB Records (Cross-Semester / Performance Cache)
        if (!course && performanceRecords) {
            course = performanceRecords.find(c => c.id === item.course);
            // 4. Name match in DB
            if (!course && item.course) {
                course = performanceRecords.find(c => c.name === item.course || (c.name && c.name.toLowerCase() === item.course.toLowerCase()));
            }
        }

        // 5. Ultimate Fallback
        if (!course && item.course) {
            course = {
                id: item.course,
                name: item.course,
                sks: 0,
                semester: userProfile?.semester || 1,
                grade: undefined,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
        }

        let color = item.color;
        // If no color is stored (Legacy Data), generate one deterministically
        if (!color && item.course) {
            const hash = item.course.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
            const pool = theme === 'light' ? LIGHT_COLORS : DARK_COLORS;
            const colorIdx = hash % pool.length;
            color = JSON.stringify(pool[colorIdx]);
        }

        return {
            ...item,
            course,
            color,
            room: item.location || '',
            lecturer: item.lecturer || ''
        };
    };

    // --- HANDLERS ---
    const handleSlotClick = async (e: React.MouseEvent, day: string, time: string, hasCourse: boolean) => {
        e.stopPropagation();
        e.preventDefault();

        // Clear others
        setContextMenu(null);

        if (hasCourse) {
            // Show Details
            const rect = e.currentTarget.getBoundingClientRect();
            const data = getCourseForSlot(day, time);
            if (data?.course?.id) {
                await fetchMaterials(data.course.id);
            }
            setDetailSlot({ day, time, data, rect });
            setActiveSlot(null);
            setIsEditingDetail(false); // Default to view mode
            setEditForm({ room: data?.room || '', lecturer: data?.lecturer || '' });
        } else {
            // Show Selector
            const rect = e.currentTarget.getBoundingClientRect();
            setActiveSlot({ day, time, rect });
            setDetailSlot(null);
            setSearchTerm('');
        }
    };

    const handleContextMenu = (e: React.MouseEvent, day: string, time: string, hasCourse: boolean) => {
        e.preventDefault(); // Block default browser menu
        e.stopPropagation();

        if (hasCourse) {
            setContextMenu({ day, time, x: e.clientX, y: e.clientY });
            setActiveSlot(null);
            setDetailSlot(null);
        }
    };

    const handleSelectCourse = (courseId: string) => {
        if (!activeSlot && !contextMenu) return;
        const target = activeSlot || { day: contextMenu!.day, time: contextMenu!.time };

        if (courseId) {
            // LOAD PERSISTENCE: Check if course has saved room/lecturer
            const course = courses.find(c => c.id === courseId);
            const defaultRoom = course?.location || '';
            const defaultLecturer = course?.lecturer || '';

            setScheduleItem(target.day, target.time, courseId, 'dynamic', defaultRoom, defaultLecturer);
        } else {
            setScheduleItem(target.day, target.time, '', '');
        }
        setActiveSlot(null);
        setContextMenu(null);
    };

    const handleSaveDetail = async () => {
        if (!detailSlot) return;
        const { day, time, data } = detailSlot;

        // 1. Update Schedule Item
        await setScheduleItem(day, time, data.course.id, 'dynamic', editForm.room, editForm.lecturer);

        // 2. Update Course Persistence (So it survives clear slot)
        if (data.course) {
            const updatedCourse = {
                ...data.course,
                location: editForm.room,
                lecturer: editForm.lecturer,
                updatedAt: new Date().toISOString()
            };
            // @ts-ignore
            await window.electronAPI.performance.upsertCourse(updatedCourse);
            fetchCourses(); // Refresh local store
        }

        setDetailSlot(null);
        setIsEditingDetail(false);
    };

    const handleAddLink = async () => {
        if (!linkForm.url || !linkForm.title) return;

        let url = linkForm.url.trim();
        // Basic protocol check
        if (!/^https?:\/\//i.test(url) && url.includes('.')) {
            // Heuristic: if it has a dot (x.com), assume web.
            url = 'https://' + url;
        }

        await addMaterial(detailSlot!.data.course.id, 'link', linkForm.title, url);
        setIsAddingLink(false);
        setLinkForm({ title: '', url: '' });
    };

    const filteredCourses = courses.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate dropdown position
    const dropdownStyle = activeSlot?.rect ? {
        top: Math.min(activeSlot.rect.bottom + 5, window.innerHeight - 300), // Prevent going off bottom screen
        left: Math.min(activeSlot.rect.left, window.innerWidth - 300), // Prevent going off right screen
        position: 'fixed' as const,
    } : {};

    // If close to bottom, flip up?
    if (activeSlot?.rect && activeSlot.rect.bottom > window.innerHeight - 320) {
        // @ts-ignore
        dropdownStyle.top = activeSlot.rect.top - 310; // Height approx 300
    }

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex items-center justify-between shrink-0">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Calendar className="w-8 h-8 text-primary" />
                    Jadwal Kelas
                </h1>
            </div>

            <GlassCard className="flex-1 overflow-auto relative p-0 min-h-[500px]">
                <table className="w-full h-full border-collapse">
                    <thead>
                        <tr>
                            <th className="bg-base-100/30 backdrop-blur-md sticky top-0 left-0 z-20 w-16 p-2 text-center text-sm font-bold opacity-60">
                                <div className="flex items-center justify-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    TIME
                                </div>
                            </th>
                            {DAYS.map(day => (
                                <th key={day} className="bg-base-100/30 backdrop-blur-md min-w-[180px] text-center text-sm font-bold text-base-content/80">
                                    {day}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {TIMES.map((time) => (
                            <tr key={time} className="hover:bg-white/5 transition-colors">
                                <td className="font-mono text-xs font-bold opacity-60 bg-base-100/30 sticky left-0 z-5 border-r border-white/10 backdrop-blur-sm">
                                    <div className="flex items-center gap-2">
                                        {time}
                                    </div>
                                </td>
                                {DAYS.map(day => {
                                    const slotData = getCourseForSlot(day, time);
                                    let assignedColor = null;

                                    const colorPool = theme === 'light' ? LIGHT_COLORS : DARK_COLORS;

                                    if (slotData?.course) {
                                        const courseId = slotData.course.id || slotData.course.name;
                                        const hash = courseId.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
                                        const colorIdx = hash % colorPool.length;
                                        assignedColor = colorPool[colorIdx];
                                    }

                                    return (
                                        <td key={`${day}-${time}`} className="p-1 h-16 relative group">
                                            <div
                                                onClick={(e) => handleSlotClick(e, day, time, !!slotData)}
                                                onContextMenu={(e) => handleContextMenu(e, day, time, !!slotData)}
                                                className={clsx(
                                                    "w-full h-full rounded-md flex flex-col items-center justify-center text-center px-1 py-1 text-xs font-semibold cursor-pointer transition-all border border-transparent backdrop-blur-sm",
                                                    slotData
                                                        ? `${assignedColor?.bg} ${assignedColor?.text} ${assignedColor?.border} border shadow-sm`
                                                        : "schedule-cell-border text-transparent hover:text-base-content/40 justify-center group-hover:scale-[0.98]"
                                                )}
                                            >
                                                {slotData ? (
                                                    <>
                                                        <span className="truncate w-full font-bold">{slotData.course?.name}</span>
                                                        {(slotData.room) && (
                                                            <div className="flex items-center gap-1 opacity-70 mt-1 text-[10px] truncate max-w-full">
                                                                <MapPin size={10} />
                                                                <span>{slotData.room}</span>
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="text-2xl opacity-20 group-hover:opacity-100 transition-opacity">+</span>
                                                )}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </GlassCard>

            {/* 1. COURSE SELECTOR */}
            {(activeSlot) && createPortal(
                <div
                    className="fixed z-[9999] bg-base-100 rounded-xl shadow-2xl border border-base-300 animate-in fade-in zoom-in-95 duration-100 w-72 overflow-hidden flex flex-col"
                    style={dropdownStyle}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="p-3 bg-base-100 z-10 border-b border-base-200">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                            <input
                                type="text"
                                autoFocus
                                placeholder="Search course..."
                                className="input input-sm input-bordered w-full pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                        <ul className="menu p-0 w-full">
                            {filteredCourses.map(course => (
                                <li key={course.id} className="border-b border-base-100 last:border-none">
                                    <button
                                        onClick={() => handleSelectCourse(course.id)}
                                        className="rounded-none py-3 px-4 h-auto hover:bg-base-200"
                                    >
                                        <div className="flex flex-col gap-1 w-full text-left">
                                            <span className="font-medium text-sm truncate">{course.name}</span>
                                            <span className="text-[10px] bg-base-300 px-1.5 py-0.5 rounded text-base-content/70 w-fit">{course.sks} SKS</span>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                        {filteredCourses.length === 0 && (
                            <div className="p-6 text-center opacity-50 text-xs flex flex-col items-center gap-2">
                                <Search size={24} className="opacity-20" />
                                <span>No courses found</span>
                            </div>
                        )}
                        <div className="p-2 border-t border-base-200 bg-base-200/30">
                            <button
                                className="btn btn-sm btn-ghost text-error w-full hover:bg-error/10 hover:border-error/20"
                                onClick={() => {
                                    setScheduleItem(activeSlot.day, activeSlot.time, '', '');
                                    setActiveSlot(null);
                                }}
                            >
                                Clear Slot
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* 2. DETAIL MODAL */}
            {detailSlot && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setDetailSlot(null)}>
                    <div
                        className="bg-base-100 rounded-2xl shadow-2xl border border-base-300 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-xl leading-snug">{detailSlot.data.course?.name}</h3>
                                <button className="btn btn-xs btn-circle btn-ghost" onClick={() => setDetailSlot(null)}><X size={16} /></button>
                            </div>

                            {!isEditingDetail ? (
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <MapPin size={16} className="text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold opacity-50 uppercase">Ruangan</p>
                                            <p className="font-medium">{detailSlot.data.room || '-'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                                            <UserIcon size={16} className="text-secondary" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold opacity-50 uppercase">Dosen</p>
                                            <p className="font-medium">{detailSlot.data.lecturer || '-'}</p>
                                        </div>
                                    </div>
                                    <div className="pt-2 border-t border-base-200 text-xs opacity-50 flex justify-between">
                                        <span>{detailSlot.day}, {detailSlot.time}</span>
                                        <span>{detailSlot.data.course?.sks} SKS</span>
                                    </div>
                                </div>
                            ) : (
                                <form
                                    className="space-y-4"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleSaveDetail();
                                    }}
                                >
                                    <div className="form-control">
                                        <label className="label text-xs font-bold opacity-50 uppercase pb-1">Ruangan</label>
                                        <input
                                            type="text"
                                            className="input input-sm input-bordered"
                                            value={editForm.room}
                                            onChange={e => setEditForm({ ...editForm, room: e.target.value })}
                                            placeholder="Ex: GK1-102"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label text-xs font-bold opacity-50 uppercase pb-1">Dosen Pengampu</label>
                                        <input
                                            type="text"
                                            className="input input-sm input-bordered"
                                            value={editForm.lecturer}
                                            onChange={e => setEditForm({ ...editForm, lecturer: e.target.value })}
                                            placeholder="Ex: Dr. John Doe"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2">
                                        <button type="button" className="btn btn-sm btn-ghost" onClick={() => setIsEditingDetail(false)}>Cancel</button>
                                        <button type="submit" className="btn btn-sm btn-primary">Simpan</button>
                                    </div>
                                </form>
                            )}

                            {/* Course Materials */}
                            <div className="pt-4 mt-4 border-t border-base-content/10">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-xs font-bold opacity-50 uppercase">Materi & Link</h4>
                                    {/* SHOW ADD BUTTONS ONLY IN EDIT MODE */}
                                    {isEditingDetail && (
                                        <div className="flex gap-1 animate-in fade-in cursor-pointer">
                                            <button
                                                className={clsx("btn btn-xs btn-ghost btn-square", isAddingLink && "bg-base-200 text-primary")}
                                                onClick={() => setIsAddingLink(!isAddingLink)}
                                                title="Add Link"
                                            >
                                                <LinkIcon size={14} />
                                            </button>
                                            <button
                                                className="btn btn-xs btn-ghost btn-square"
                                                onClick={async () => {
                                                    // @ts-ignore
                                                    const result = await window.electronAPI.dialog.openFile();
                                                    if (!result.canceled && result.filePaths.length > 0) {
                                                        const path = result.filePaths[0];
                                                        const fileName = path.split('\\').pop() || 'File';
                                                        await addMaterial(detailSlot.data.course.id, 'file', fileName, path);
                                                    }
                                                }}
                                                title="Add File"
                                            >
                                                <FileText size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {isAddingLink && (
                                <div className="mb-3 p-2 bg-base-200/50 rounded-lg border border-base-200 animate-in slide-in-from-top-2">
                                    <div className="space-y-2">
                                        <input
                                            type="text"
                                            placeholder="Judul (ex: Slide Pertemuan 1)"
                                            className="input input-xs input-bordered w-full"
                                            value={linkForm.title}
                                            onChange={e => setLinkForm({ ...linkForm, title: e.target.value })}
                                            onKeyDown={e => e.key === 'Enter' && handleAddLink()}
                                            autoFocus
                                        />
                                        <input
                                            type="text"
                                            placeholder="URL (ex: https://...)"
                                            className="input input-xs input-bordered w-full"
                                            value={linkForm.url}
                                            onChange={e => setLinkForm({ ...linkForm, url: e.target.value })}
                                            onKeyDown={e => e.key === 'Enter' && handleAddLink()}
                                        />
                                        <div className="flex justify-end gap-1 mt-1">
                                            <button
                                                className="btn btn-xs btn-ghost"
                                                onClick={() => setIsAddingLink(false)}
                                            >
                                                Batal
                                            </button>
                                            <button
                                                className="btn btn-xs btn-primary"
                                                disabled={!linkForm.url || !linkForm.title}
                                                onClick={handleAddLink}
                                            >
                                                Tambah
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1">
                                {(materials[detailSlot.data.course.id] || []).length === 0 ? (
                                    <span className="text-xs opacity-30 italic">Belum ada materi.</span>
                                ) : (
                                    (materials[detailSlot.data.course.id] || []).map(m => (
                                        <div key={m.id} className="group flex items-center justify-between p-2 rounded hover:bg-base-content/5 text-sm gap-2">
                                            <a
                                                href="#"
                                                onClick={async (e) => {
                                                    e.preventDefault();
                                                    // @ts-ignore
                                                    if (m.type === 'link') {
                                                        // Ensure protocol exists
                                                        let url = m.url;
                                                        if (!/^https?:\/\//i.test(url)) {
                                                            url = 'https://' + url;
                                                        }
                                                        // @ts-ignore
                                                        await window.electronAPI.utils.openExternal(url);
                                                    } else {
                                                        // @ts-ignore
                                                        await window.electronAPI.utils.openPath(m.url);
                                                    }
                                                }}
                                                className="flex items-center gap-2 truncate flex-1 hover:text-primary transition-colors"
                                            >
                                                {m.type === 'link' ? <LinkIcon size={12} className="opacity-50" /> : <FileText size={12} className="opacity-50" />}
                                                <span className="truncate">{m.title}</span>
                                                {m.type === 'link' && <ExternalLink size={10} className="opacity-30" />}
                                            </a>
                                            <button
                                                onClick={() => deleteMaterial(m.id, detailSlot.data.course.id)}
                                                className="btn btn-xs btn-ghost btn-square opacity-0 group-hover:opacity-100 text-error"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                </div>,
                document.body
            )
            }

            {/* 3. CONTEXT MENU */}
            {
                contextMenu && createPortal(
                    <>
                        <div className="fixed inset-0 z-[9998]" onClick={() => setContextMenu(null)} />
                        <div
                            className="fixed z-[9999] bg-base-100 rounded-lg shadow-xl border border-base-200 py-1 min-w-[160px] animate-in fade-in zoom-in-95 duration-75"
                            style={{ top: contextMenu.y, left: contextMenu.x }}
                        >
                            <button
                                className="w-full text-left px-4 py-2 hover:bg-base-200 text-sm flex items-center gap-2"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const data = getCourseForSlot(contextMenu.day, contextMenu.time);
                                    setEditForm({ room: data?.room || '', lecturer: data?.lecturer || '' });
                                    setDetailSlot({ day: contextMenu.day, time: contextMenu.time, data, rect: null });
                                    setIsEditingDetail(true);
                                    setContextMenu(null);
                                }}
                            >
                                <Edit2 size={14} opacity={0.7} />
                                Edit Detail
                            </button>
                            <button
                                className="w-full text-left px-4 py-2 hover:bg-base-200 text-sm flex items-center gap-2"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const rect = { bottom: contextMenu.y, left: contextMenu.x, top: contextMenu.y } as DOMRect;
                                    setActiveSlot({ day: contextMenu.day, time: contextMenu.time, rect });
                                    setContextMenu(null);
                                }}
                            >
                                <RefreshCw size={14} opacity={0.7} />
                                Ganti Matkul
                            </button>
                            <div className="h-px bg-base-200 my-1" />
                            <button
                                className="w-full text-left px-4 py-2 hover:bg-error/10 text-error text-sm flex items-center gap-2"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setScheduleItem(contextMenu.day, contextMenu.time, '', '', '', '');
                                    setContextMenu(null);
                                }}
                            >
                                <Trash2 size={14} />
                                Clear Slot
                            </button>
                        </div>
                    </>,
                    document.body
                )
            }
        </div >
    );
};

export default Schedule;
