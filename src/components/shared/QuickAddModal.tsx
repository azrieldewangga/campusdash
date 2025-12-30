import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { AssignmentType } from '../../types/models';
import { X, BookOpen, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import { DatePicker } from '../ui/DatePicker';
import { Transaction } from '../../types/models';

const QuickAddModal = () => {
    const {
        isQuickAddOpen, setQuickAddOpen,
        addAssignment, updateAssignment,
        courses, userProfile, assignments,
        fetchCourses, fetchUserProfile, addTransaction,
        quickAddTab, editingAssignmentId, setEditingAssignmentId,
        currency
    } = useStore();
    const [activeTab, setActiveTab] = useState<'assignment' | 'transaction'>(quickAddTab || 'assignment');

    // Assignment Form State
    const [assignmentData, setAssignmentData] = useState({
        courseName: '',
        title: '',
        type: 'Tugas' as AssignmentType,
        deadline: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        status: 'to-do',
        note: ''
    });

    // Transaction Form State
    const [transactionData, setTransactionData] = useState({
        title: '',
        amount: '',
        type: 'expense' as 'income' | 'expense',
        category: 'Food',
        date: format(new Date(), "yyyy-MM-dd'T'HH:mm")
    });

    useEffect(() => {
        const init = async () => {
            if (isQuickAddOpen) {
                setActiveTab(quickAddTab || 'assignment');

                let profile = userProfile;
                if (!profile) {
                    await fetchUserProfile();
                }
                await fetchCourses();

                // If editing, populate data
                if (editingAssignmentId) {
                    const item = assignments.find(a => a.id === editingAssignmentId);
                    if (item) {
                        setAssignmentData({
                            courseName: item.courseId,
                            title: item.title,
                            type: item.type,
                            deadline: item.deadline,
                            status: item.status,
                            note: item.note || ''
                        });
                    }
                } else {
                    // Reset if adding new
                    setAssignmentData({
                        courseName: '',
                        title: '',
                        type: 'Tugas',
                        deadline: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
                        status: 'to-do',
                        note: ''
                    });
                    setTransactionData({
                        title: '',
                        amount: '',
                        type: 'expense',
                        category: 'Food',
                        date: format(new Date(), "yyyy-MM-dd'T'HH:mm")
                    });
                }
            }
        };
        init();
    }, [isQuickAddOpen, quickAddTab, editingAssignmentId, assignments]);

    // Separate effect to handle course pre-selection ONLY if adding new
    useEffect(() => {
        if (isQuickAddOpen && !editingAssignmentId && courses.length > 0 && !assignmentData.courseName) {
            setAssignmentData(prev => ({ ...prev, courseName: courses[0].id }));
        }
    }, [courses, isQuickAddOpen, editingAssignmentId, assignmentData.courseName]);



    const handleAssignmentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let selectedCourse = assignmentData.courseName;
        const selectedCourseObj = courses.find(c => c.id === selectedCourse);

        if (!selectedCourse && courses.length > 0) {
            selectedCourse = courses[0].id;
        }

        const courseNameForTitle = courses.find(c => c.id === selectedCourse)?.name || selectedCourse;

        if (!selectedCourse) return;

        // Use the NAME for the Title, but ID for the backend
        const finalTitle = `${assignmentData.type} - ${courseNameForTitle}`;

        if (editingAssignmentId) {
            await updateAssignment(editingAssignmentId, {
                courseId: selectedCourse, // Saving ID
                title: finalTitle,
                type: assignmentData.type,
                deadline: assignmentData.deadline,
                status: assignmentData.status as any,
                note: assignmentData.note
            });
        } else {
            await addAssignment({
                courseId: selectedCourse, // Saving ID
                title: finalTitle,
                type: assignmentData.type,
                deadline: assignmentData.deadline,
                status: 'to-do' as any,
                note: assignmentData.note
            });
        }

        handleClose();
    };

    const handleTransactionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!transactionData.title || !transactionData.amount) return;

        await addTransaction({
            title: transactionData.title,
            amount: parseFloat(transactionData.amount) * (transactionData.type === 'expense' ? -1 : 1),
            type: transactionData.type,
            category: transactionData.category,
            date: transactionData.date
        });

        handleClose();
    };

    const handleClose = () => {
        setQuickAddOpen(false);
        setEditingAssignmentId(null);
        // Reset form
        setAssignmentData({
            courseName: '',
            title: '',
            type: 'Tugas',
            deadline: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
            status: 'to-do',
            note: ''
        });
        setTransactionData({
            title: '',
            amount: '',
            type: 'expense',
            category: 'Food',
            date: format(new Date(), "yyyy-MM-dd'T'HH:mm")
        });
    }

    // Handle Keyboard Shortcuts
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (isQuickAddOpen && e.key === 'Escape') {
                handleClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isQuickAddOpen]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (activeTab === 'assignment') {
                handleAssignmentSubmit(e as any);
            } else {
                handleTransactionSubmit(e as any);
            }
        }
    };

    const tabs = [
        { id: 'assignment', label: 'Assignment', icon: BookOpen },
        { id: 'transaction', label: 'Cashflow', icon: CreditCard },
    ];

    if (!isQuickAddOpen) return null;

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-2xl p-0 overflow-hidden h-[600px] flex flex-col">
                {/* Increased height to avoid cutoff */}

                {/* Header */}
                <div className="bg-base-200 p-4 flex justify-between items-center border-b border-base-300 flex-none">
                    <h3 className="font-bold text-lg">{editingAssignmentId ? 'Edit Assignment' : 'Quick Add'}</h3>
                    <button onClick={handleClose} className="btn btn-sm btn-circle btn-ghost">
                        <X size={18} />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Tabs */}
                    <ul className="menu w-48 bg-base-200/50 p-2 gap-1 border-r border-base-300 flex-none overflow-y-auto">
                        {tabs.map(tab => (
                            <li key={tab.id}>
                                <button
                                    className={clsx(activeTab === tab.id && 'active')}
                                    onClick={() => setActiveTab(tab.id as any)}
                                >
                                    <tab.icon size={18} />
                                    {tab.label}
                                </button>
                            </li>
                        ))}
                    </ul>

                    {/* Content Area */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        {activeTab === 'assignment' && (
                            <form onSubmit={handleAssignmentSubmit} onKeyDown={handleKeyDown} className="space-y-4 animate-fade-in pb-20">
                                {/* Padding bottom to ensure button is visible if scrolled */}

                                <h4 className="font-bold text-lg mb-4">{editingAssignmentId ? 'Edit Assignment' : 'New Assignment'}</h4>

                                <div className="form-control">
                                    <label className="label mb-1">Course</label>
                                    <select
                                        className="select select-bordered w-full"
                                        value={assignmentData.courseName}
                                        onChange={e => setAssignmentData({ ...assignmentData, courseName: e.target.value })}
                                        required
                                        disabled={!userProfile}
                                    >
                                        <option value="" disabled>Select a course</option>
                                        {courses.map((course, idx) => (
                                            <option key={idx} value={course.id}>{course.name}</option>
                                        ))}
                                    </select>
                                    {!userProfile && (
                                        <label className="label">
                                            <span className="label-text-alt text-info loading loading-dots loading-xs">Loading profile...</span>
                                        </label>
                                    )}
                                    {userProfile && courses.length === 0 && (
                                        <label className="label">
                                            <span className="label-text-alt text-warning">
                                                No courses found for Semester {userProfile.semester}. Check your settings.
                                            </span>
                                        </label>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-control">
                                        <label className="label mb-1">Type</label>
                                        <select
                                            className="select select-bordered"
                                            value={assignmentData.type}
                                            onChange={e => setAssignmentData({ ...assignmentData, type: e.target.value as any })}
                                        >
                                            <option value="Tugas">Tugas</option>
                                            <option value="Laporan Pendahuluan">Laporan Pendahuluan</option>
                                            <option value="Laporan Sementara">Laporan Sementara</option>
                                            <option value="Laporan Resmi">Laporan Resmi</option>
                                        </select>
                                    </div>
                                    <div className="form-control">
                                        <label className="label mb-1">Deadline</label>
                                        <DatePicker
                                            date={new Date(assignmentData.deadline)}
                                            setDate={(date) => setAssignmentData({ ...assignmentData, deadline: format(date, "yyyy-MM-dd'T'HH:mm") })}
                                        />
                                    </div>
                                </div>
                                <div className="form-control w-full">
                                    <label className="label mb-1">
                                        <span className="label-text font-medium">Note</span>
                                    </label>
                                    <textarea
                                        className="textarea textarea-bordered h-24 w-full"
                                        placeholder="Additional notes..."
                                        value={assignmentData.note}
                                        onChange={e => setAssignmentData({ ...assignmentData, note: e.target.value })}
                                    ></textarea>
                                </div>
                                <div className="pt-4 flex justify-end">
                                    <button type="submit" className="btn btn-primary w-full md:w-auto">
                                        {editingAssignmentId ? 'Update Assignment' : 'Create Assignment'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {activeTab === 'transaction' && (
                            <form onSubmit={handleTransactionSubmit} onKeyDown={handleKeyDown} className="space-y-4 animate-fade-in pb-20">
                                <h4 className="font-bold text-lg mb-4">New Transaction</h4>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="form-control">
                                        <label className="label mb-1">Type</label>
                                        <div className="flex gap-2 bg-base-100 p-1 rounded-lg border border-base-300">
                                            <button
                                                type="button"
                                                className={clsx("flex-1 btn btn-sm", transactionData.type === 'income' ? "btn-success text-white" : "btn-ghost")}
                                                onClick={() => setTransactionData({ ...transactionData, type: 'income' })}
                                            >
                                                Income
                                            </button>
                                            <button
                                                type="button"
                                                className={clsx("flex-1 btn btn-sm", transactionData.type === 'expense' ? "btn-error text-white" : "btn-ghost")}
                                                onClick={() => setTransactionData({ ...transactionData, type: 'expense' })}
                                            >
                                                Expense
                                            </button>
                                        </div>
                                    </div>
                                    <div className="form-control">
                                        <label className="label mb-1">Date</label>
                                        <DatePicker
                                            date={new Date(transactionData.date)}
                                            setDate={(date) => setTransactionData({ ...transactionData, date: format(date, "yyyy-MM-dd'T'HH:mm") })}
                                        />
                                    </div>
                                </div>

                                <div className="form-control">
                                    <label className="label mb-1">Description / Title</label>
                                    <input
                                        type="text"
                                        className="input input-bordered w-full"
                                        placeholder="e.g. Lunch, Freelance"
                                        value={transactionData.title}
                                        onChange={e => setTransactionData({ ...transactionData, title: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="form-control">
                                        <label className="label mb-1">Amount</label>
                                        <label className="input input-bordered flex items-center gap-2">
                                            <span className="opacity-70">{currency === 'USD' ? '$' : 'Rp'}</span>
                                            <input
                                                type="number"
                                                className="grow"
                                                placeholder="0"
                                                value={transactionData.amount}
                                                onChange={e => setTransactionData({ ...transactionData, amount: e.target.value })}
                                                required
                                            />
                                        </label>
                                    </div>
                                    <div className="form-control">
                                        <label className="label mb-1">Category</label>
                                        <select
                                            className="select select-bordered w-full"
                                            value={transactionData.category}
                                            onChange={e => setTransactionData({ ...transactionData, category: e.target.value })}
                                        >
                                            <option>Food</option>
                                            <option>Transport</option>
                                            <option>Shopping</option>
                                            <option>Entertainment</option>
                                            <option>Bills</option>
                                            <option>Others</option>
                                            <option>Transfer</option>
                                            <option>Salary</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button type="submit" className="btn btn-primary w-full md:w-auto">
                                        Add Transaction
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
            <label className="modal-backdrop" onClick={handleClose}>Close</label>
        </div>
    );
};

export default QuickAddModal;
