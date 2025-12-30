import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store/useStore';
import { AssignmentStatus, Assignment } from '../types/models';
import { Plus, GripVertical, MoreHorizontal, Search } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Sortable Row Component ---
interface SortableRowProps {
    assignment: Assignment;
    index: number;
    updateAssignment: (id: string, data: Partial<Assignment>) => void;
    setEditingAssignmentId: (id: string | null) => void;
    setQuickAddOpen: (isOpen: boolean, tab?: 'assignment') => void;
    duplicateAssignment: (id: string) => Promise<void>;
    onDeleteClick: (id: string) => void;
    isFiltered: boolean;
}

const SortableRow = ({
    assignment,
    updateAssignment,
    setEditingAssignmentId,
    setQuickAddOpen,
    duplicateAssignment,
    onDeleteClick,
    isFiltered
}: SortableRowProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: assignment.id, disabled: isFiltered });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <tr
            ref={setNodeRef}
            style={style}
            className={clsx(
                "hover:bg-base-content/5 border-b border-base-content/5 transition-colors group",
                isDragging && "opacity-50 bg-base-200 z-10 relative"
            )}
        >
            {/* Drag Grip */}
            <td className="w-6 py-4 pl-2 pr-0">
                {!isFiltered ? (
                    <div
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing p-1 hover:bg-base-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <GripVertical size={16} className="text-base-content/40" />
                    </div>
                ) : (
                    <div className="w-6" />
                )}
            </td>

            {/* Deadline */}
            <td className="whitespace-nowrap font-medium py-4 pl-2">
                <div className="flex flex-col">
                    <span>{format(new Date(assignment.deadline), 'MMMM d, yyyy')}</span>
                    <span className="text-xs opacity-50 font-normal mt-0.5">
                        {format(new Date(assignment.deadline), 'HH:mm')}
                    </span>
                </div>
            </td>

            {/* Status Dropdown */}
            <td className="py-4">
                <div className="dropdown">
                    <div
                        tabIndex={0}
                        role="button"
                        className="btn btn-sm btn-ghost gap-2 h-8 min-h-0 px-4 font-medium text-sm capitalize border border-base-300 rounded-lg hover:bg-base-200 min-w-[110px] justify-between"
                    >
                        <span className={clsx(
                            assignment.status === 'done' && "text-success",
                            assignment.status === 'progress' && "text-warning",
                            assignment.status === 'to-do' && "text-base-content/70"
                        )}>
                            {assignment.status === 'to-do' ? 'To Do' : assignment.status === 'progress' ? 'In Progress' : 'Done'}
                        </span>
                        <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                    <ul tabIndex={0} className="dropdown-content menu p-2 shadow-lg bg-base-100 rounded-xl w-36 border border-base-300 mt-1" style={{ position: 'fixed', zIndex: 9999 }}>
                        <li>
                            <button
                                onClick={() => updateAssignment(assignment.id, { status: 'to-do' })}
                                className={clsx("text-sm", assignment.status === 'to-do' && "active")}
                            >
                                To Do
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => updateAssignment(assignment.id, { status: 'progress' })}
                                className={clsx("text-sm text-warning", assignment.status === 'progress' && "active")}
                            >
                                In Progress
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => updateAssignment(assignment.id, { status: 'done' })}
                                className={clsx("text-sm text-success", assignment.status === 'done' && "active")}
                            >
                                Done
                            </button>
                        </li>
                    </ul>
                </div>
            </td>

            {/* Mata Kuliah */}
            <td className="py-4">
                <div className="badge badge-lg bg-base-200 border-none font-medium text-sm py-4 px-4 rounded-lg">
                    {(() => {
                        const cId = assignment.courseId || '';
                        if (cId.startsWith("generic")) {
                            return ((assignment.title || '').split('-')[1]?.trim() || (assignment.title || '')).replace(/MW-|MPK-/g, '');
                        }
                        // Try to find course by ID
                        const foundCourse = useStore.getState().courses.find(c => c.id === cId);
                        if (foundCourse) return foundCourse.name;

                        // Fallback: If it's a name stored as ID (legacy/migration), return it cleaned
                        return cId.replace(/MW-|MPK-/g, '');
                    })()}
                </div>
            </td>

            {/* Jenis Laporan (Muted colors for eye comfort) */}
            <td className="py-4">
                <span className={clsx("badge badge-sm py-3 px-3 font-medium shadow-sm",
                    assignment.type === 'Tugas' && "badge-info bg-info/10 text-info border-transparent",
                    assignment.type === 'Laporan Resmi' && "badge-secondary bg-secondary/10 text-secondary border-transparent",
                    assignment.type === 'Laporan Sementara' && "badge-accent bg-accent/10 text-accent border-transparent",
                    !['Tugas', 'Laporan Resmi', 'Laporan Sementara'].includes(assignment.type) && "bg-base-200 text-base-content/70 border-transparent"
                )}>
                    {assignment.type}
                </span>
            </td>

            {/* Note */}
            <td className="py-4 max-w-xs truncate opacity-70 text-sm" title={assignment.note}>
                {(() => {
                    const text = assignment.note || "-";
                    // Match http(s)://... OR word.domain
                    const urlRegex = /(https?:\/\/[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/g;
                    const parts = text.split(urlRegex);

                    if (parts.length === 1) return text;

                    return parts.map((part, i) => {
                        if (part.match(urlRegex)) {
                            return (
                                <span
                                    key={i}
                                    className="text-primary hover:underline cursor-pointer relative z-20"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        let url = part;
                                        if (!url.startsWith('http')) {
                                            url = 'https://' + url;
                                        }
                                        // @ts-ignore
                                        window.electronAPI.utils.openExternal(url);
                                    }}
                                >
                                    {part}
                                </span>
                            );
                        }
                        return <span key={i}>{part}</span>;
                    });
                })()}
            </td>

            {/* Actions */}
            <td className="py-4 pr-6 text-right">
                <div className="dropdown dropdown-end">
                    <div tabIndex={0} role="button" className="btn btn-ghost btn-xs btn-circle opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal size={18} />
                    </div>
                    <ul tabIndex={0} className="dropdown-content menu p-1 shadow-xl bg-base-100 rounded-2xl w-40 border border-base-content/10" style={{ position: 'fixed', zIndex: 9999 }}>
                        <li>
                            <button
                                className="py-2"
                                onClick={(e) => {
                                    (e.target as HTMLElement).closest('div.dropdown')?.removeAttribute('open');
                                    setEditingAssignmentId(assignment.id);
                                    setQuickAddOpen(true, 'assignment');
                                }}
                            >
                                Edit
                            </button>
                        </li>
                        <li>
                            <button
                                className="py-2"
                                onClick={(e) => {
                                    (e.target as HTMLElement).closest('div.dropdown')?.removeAttribute('open');
                                    duplicateAssignment(assignment.id);
                                }}
                            >
                                Duplicate
                            </button>
                        </li>
                        <div className="divider my-0"></div>
                        <li>
                            <button
                                className="text-error hover:bg-error/10 hover:text-error py-2"
                                onClick={(e) => {
                                    (e.target as HTMLElement).closest('div.dropdown')?.removeAttribute('open');
                                    onDeleteClick(assignment.id);
                                }}
                            >
                                Delete
                            </button>
                        </li>
                    </ul>
                </div>
            </td>
        </tr>
    );
};

// --- Main Component ---
const Assignments = () => {
    const { assignments, fetchAssignments, updateAssignment, setQuickAddOpen, reorderAssignments, courses, fetchCourses, setEditingAssignmentId, duplicateAssignment, deleteAssignment, userProfile } = useStore();

    // Filters State
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<AssignmentStatus | 'all'>('all');
    const [courseFilter, setCourseFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'deadline' | 'custom'>('deadline');

    // Delete confirmation modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null);

    const handleDeleteClick = (id: string) => {
        setAssignmentToDelete(id);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (assignmentToDelete) {
            deleteAssignment(assignmentToDelete);
        }
        setDeleteModalOpen(false);
        setAssignmentToDelete(null);
    };

    useEffect(() => {
        fetchAssignments();
        fetchCourses();
    }, [fetchAssignments, fetchCourses]);

    // Filtering & Sorting
    const filteredAssignments = useMemo(() => {
        let result = [...assignments];

        // 0. Filter by Current Semester (User Requirement)
        // Only show assignments that belong to courses in the current semester
        // 0. Filter by Current Semester
        // If profile is missing, we can't determine semester, so return empty to be safe (or handled by loading state below)
        if (!userProfile) return [];

        if (userProfile.semester) {
            // "Gold Standard" Filter: Check explicitly stored semester first
            // If assignment has 'semester' field (new logic), use it.
            // If not (legacy), fall back to loose/smart checks? 
            // User said: "saya akan hapus tugas tugas yang ada". So we can assume clear slate?
            // Let's support both for transition: Preferred = semester match.

            result = result.filter(a => {
                // New Logic:
                if (a.semester !== undefined && a.semester !== null) {
                    return a.semester === userProfile.semester;
                }

                // fallback for legacy data (if any remains, though user said they'd delete)
                // Just hide it or show it? User said "I will delete".
                // Safest: Hide legacy data to be clean.
                return false;
            });
        }

        // 1. Filter
        if (search) {
            const s = search.toLowerCase();
            result = result.filter(a =>
                a.title.toLowerCase().includes(s) ||
                a.courseId.toLowerCase().includes(s) ||
                (a.note && a.note.toLowerCase().includes(s))
            );
        }
        if (statusFilter !== 'all') {
            result = result.filter(a => a.status === statusFilter);
        }
        if (courseFilter !== 'all') {
            result = result.filter(a => a.courseId === courseFilter);
        }

        // 2. Sort
        if (sortBy === 'deadline') {
            result.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
        } else {
            result.sort((a, b) => (a.customOrder || 0) - (b.customOrder || 0));
        }

        return result;
    }, [assignments, search, statusFilter, courseFilter, sortBy, courses, userProfile]);

    // Check if dragging should be active (only when showing all items and manually sorted or no sort preference which defaults to manual if we want full custom control)
    // Actually, letting user reorder 'deadline' sorted list is weird. We'll auto-switch to 'custom' on drop.
    // Also disable if filters are active (prevent data loss/confusion).
    const isFiltered = assignments.length !== filteredAssignments.length || (search !== '' || statusFilter !== 'all' || courseFilter !== 'all');

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = assignments.findIndex((item) => item.id === active.id);
            const newIndex = assignments.findIndex((item) => item.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                // Critical: Switch to custom sort mode BEFORE updating the data
                // This prevents the UI from re-sorting by deadline during the update
                if (sortBy !== 'custom') setSortBy('custom');

                const newOrder = arrayMove(assignments, oldIndex, newIndex);
                reorderAssignments(newOrder); // Update store
            }
        }
    };

    if (!userProfile) {
        return <div className="p-8 text-center opacity-50">Loading assignments...</div>;
    }

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex items-center justify-between flex-none">
                <h1 className="text-3xl font-bold">Tugas</h1>

                {/* Navbar-style Filters */}
                <div className="navbar bg-base-100 rounded-xl shadow-sm border border-base-300 p-0 min-h-0 h-12 w-auto">
                    <div className="flex items-stretch h-full">
                        {/* Search */}
                        <div className="flex items-center px-3 gap-2 border-r border-base-300">
                            <Search size={16} className="opacity-50" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="input input-ghost input-sm w-28 h-full focus:bg-transparent focus:outline-none focus:border-none border-none p-0 text-sm"
                                style={{ boxShadow: 'none' }}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>

                        {/* Course Filter Dropdown */}
                        <div className="dropdown dropdown-end h-full">
                            <div tabIndex={0} role="button" className="btn btn-ghost rounded-none h-full px-4 font-normal text-sm gap-1 border-r border-base-300">
                                {courseFilter === 'all' ? 'All Courses' : courseFilter}
                                <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                            <ul tabIndex={0} className="menu dropdown-content bg-base-100 rounded-box z-[50] mt-2 w-52 p-2 shadow-lg border border-base-300">
                                <li><button onClick={() => setCourseFilter('all')} className={courseFilter === 'all' ? 'active' : ''}>All Courses</button></li>
                                {courses.map(c => (
                                    <li key={c.id}><button onClick={() => setCourseFilter(c.name)} className={courseFilter === c.name ? 'active' : ''}>{c.name}</button></li>
                                ))}
                            </ul>
                        </div>

                        {/* Status Filter Dropdown */}
                        <div className="dropdown dropdown-end h-full">
                            <div tabIndex={0} role="button" className="btn btn-ghost rounded-none h-full px-4 font-normal text-sm gap-1 border-r border-base-300">
                                {statusFilter === 'all' ? 'All Status' : statusFilter === 'to-do' ? 'To Do' : statusFilter === 'progress' ? 'In Progress' : 'Done'}
                                <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                            <ul tabIndex={0} className="menu dropdown-content bg-base-100 rounded-box z-[50] mt-2 w-40 p-2 shadow-lg border border-base-300">
                                <li><button onClick={() => setStatusFilter('all')} className={statusFilter === 'all' ? 'active' : ''}>All Status</button></li>
                                <li><button onClick={() => setStatusFilter('to-do')} className={statusFilter === 'to-do' ? 'active' : ''}>To Do</button></li>
                                <li><button onClick={() => setStatusFilter('progress')} className={statusFilter === 'progress' ? 'active' : ''}>In Progress</button></li>
                                <li><button onClick={() => setStatusFilter('done')} className={statusFilter === 'done' ? 'active' : ''}>Done</button></li>
                            </ul>
                        </div>

                        {/* Sort Dropdown */}
                        <div className="dropdown dropdown-end h-full">
                            <div tabIndex={0} role="button" className="btn btn-ghost rounded-none h-full px-4 font-normal text-sm gap-1">
                                {sortBy === 'deadline' ? 'Sort: Deadline' : 'Sort: Manual'}
                                <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                            <ul tabIndex={0} className="menu dropdown-content bg-base-100 rounded-box z-[50] mt-2 w-40 p-2 shadow-lg border border-base-300">
                                <li><button onClick={() => setSortBy('deadline')} className={sortBy === 'deadline' ? 'active' : ''}>Deadline</button></li>
                                <li><button onClick={() => setSortBy('custom')} className={sortBy === 'custom' ? 'active' : ''}>Manual</button></li>
                            </ul>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => setQuickAddOpen(true, 'assignment')}
                    className="btn btn-primary gap-2"
                >
                    <Plus size={18} />
                    New Assignment
                </button>
            </div>

            {/* Table Container */}
            <div className="card bg-base-100 shadow-xl flex-1 border border-base-300 overflow-visible">
                <div className="overflow-x-auto overflow-y-visible h-full">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <table className="table w-full">
                            <thead>
                                <tr className="border-b border-base-content/10">
                                    <th className="w-6"></th> {/* Grip Column */}
                                    <th className="bg-transparent text-base-content/60 font-normal py-4 pl-2">Deadline</th>
                                    <th className="bg-transparent text-base-content/60 font-normal py-4">Status</th>
                                    <th className="bg-transparent text-base-content/60 font-normal py-4">Mata Kuliah</th>
                                    <th className="bg-transparent text-base-content/60 font-normal py-4">Jenis Laporan</th>
                                    <th className="bg-transparent text-base-content/60 font-normal py-4">Catatan</th>
                                    <th className="bg-transparent text-base-content/60 font-normal py-4 w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                <SortableContext
                                    items={filteredAssignments.map(a => a.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {filteredAssignments.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-center py-20 opacity-50">
                                                No assignments found. Click "New Assignment" to add one.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredAssignments.map((assignment, index) => (
                                            <SortableRow
                                                key={assignment.id}
                                                assignment={assignment}
                                                index={index}
                                                updateAssignment={updateAssignment}
                                                setEditingAssignmentId={setEditingAssignmentId}
                                                setQuickAddOpen={setQuickAddOpen}
                                                duplicateAssignment={duplicateAssignment}
                                                onDeleteClick={handleDeleteClick}
                                                isFiltered={isFiltered}
                                            />
                                        ))
                                    )}
                                </SortableContext>
                            </tbody>
                        </table>
                    </DndContext>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteModalOpen(false)}></div>
                    <div className="relative bg-base-100 rounded-2xl shadow-2xl border border-base-300 p-6 w-80 max-w-[90vw]">
                        <h3 className="font-bold text-lg mb-2">Delete Assignment</h3>
                        <p className="text-sm opacity-70 mb-6">Are you sure you want to delete this assignment? This action cannot be undone.</p>
                        <div className="flex gap-3 justify-end">
                            <button
                                className="btn btn-sm btn-ghost"
                                onClick={() => setDeleteModalOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-sm btn-error"
                                onClick={handleConfirmDelete}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Assignments;
