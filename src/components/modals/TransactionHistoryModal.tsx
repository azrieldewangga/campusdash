import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { format } from 'date-fns';
import { MoreHorizontal, Trash2, Edit2, X, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import clsx from 'clsx';
import ConfirmModal from './ConfirmModal';
import { Transaction } from '../../types/models';

// Standalone page, no props needed
const TransactionHistoryModal = () => {
    const {
        transactions,
        fetchTransactions,
        deleteTransaction,
        updateTransaction,
        clearTransactions
    } = useStore();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Standalone Window Theme State - Read from localStorage (key: 'theme', same as main window store)
    const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('theme') || 'dark');

    useEffect(() => {
        // Apply Theme to Document
        document.documentElement.setAttribute('data-theme', currentTheme);

        // Listen for storage changes (sync with main window)
        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'theme') {
                setCurrentTheme(e.newValue || 'dark');
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [currentTheme]);


    useEffect(() => {
        // Initial fetch
        fetchTransactions();

        // Listen for sync events
        const handleRefresh = () => fetchTransactions();
        window.electronAPI.onRefreshData(handleRefresh);
        return () => window.electronAPI.offRefreshData();
    }, []);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') window.electronAPI.close();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const handleClose = () => window.electronAPI.close();
    const handleMinimize = () => window.electronAPI.minimize();
    const handleMaximize = () => window.electronAPI.maximize();

    // Confirm Modal State
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'danger' | 'warning';
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'warning',
        onConfirm: () => { }
    });

    const sortedTransactions = useMemo(() => {
        return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions]);

    const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);
    const currentTransactions = sortedTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const checkPageValidity = () => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    };

    const handleDelete = (id: string) => {
        setConfirmState({
            isOpen: true,
            title: 'Delete Transaction',
            message: 'Are you sure you want to delete this transaction? This action cannot be undone.',
            type: 'warning',
            onConfirm: async () => {
                await deleteTransaction(id);
                checkPageValidity();
                setConfirmState(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleClearAll = () => {
        setConfirmState({
            isOpen: true,
            title: 'Clear All History',
            message: 'Are you sure you want to delete ALL transaction history? This will reset your data to the base values.',
            type: 'danger',
            onConfirm: async () => {
                await clearTransactions();
                setConfirmState(prev => ({ ...prev, isOpen: false }));
                // handleClose(); // Optional: close history window after clearing
            }
        });
    };

    const handleEdit = (t: Transaction) => {
        setEditingTransaction({
            ...t,
            amount: Number(t.amount)
        });
    };

    // Edit Modal State
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

    const handleSaveEdit = async () => {
        if (!editingTransaction) return;
        await updateTransaction(editingTransaction.id, {
            title: editingTransaction.title,
            amount: editingTransaction.amount,
            category: editingTransaction.category,
            type: editingTransaction.type
        });
        setEditingTransaction(null);
        window.electronAPI.notifyDataChanged();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent p-0 animate-fade-in text-base-content">
            {/* Window Container - Full Screen in Standalone */}
            <div className={clsx(
                "w-full h-screen flex flex-col transition-all duration-300",
                "bg-base-100"
            )}>

                {/* Traffic Lights / Header */}
                <div className={clsx(
                    "titlebar-drag h-10 px-4 flex items-center justify-between border-b transition-colors border-base-200 bg-base-200/50"
                )}>
                    {/* Left: Clear All/Actions */}
                    <div className="flex w-20 no-drag">
                        <button className="btn btn-xs btn-error btn-outline" onClick={handleClearAll}>
                            <Trash2 size={12} /> Clear
                        </button>
                    </div>

                    {/* Center: Title */}
                    <div className="flex-1 text-center font-bold text-sm tracking-wide opacity-80">
                        Transaction History
                    </div>

                    {/* Right: Traffic Lights */}
                    <div className="flex gap-2 w-20 justify-end no-drag">
                        <button onClick={handleMinimize} className="w-3 h-3 rounded-full bg-[#febc2e] hover:brightness-75 border border-black/10 shadow-sm transition-all" />
                        <button onClick={handleMaximize} className="w-3 h-3 rounded-full bg-[#28c840] hover:brightness-75 border border-black/10 shadow-sm transition-all" />
                        <button onClick={handleClose} className="w-3 h-3 rounded-full bg-[#ff5f57] hover:brightness-75 border border-black/10 shadow-sm transition-all" />
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-auto p-0 relative bg-base-100">
                    <table className="table table-pin-rows w-full table-zebra">
                        <thead>
                            <tr className="bg-base-100/90 backdrop-blur">
                                <th>Date</th>
                                <th>Title</th>
                                <th>Category</th>
                                <th className="text-right">Amount</th>
                                <th className="text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center p-20 opacity-50">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-16 h-16 bg-base-200 rounded-full flex items-center justify-center mb-2">
                                                <X size={24} className="opacity-20" />
                                            </div>
                                            No transactions found
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                currentTransactions.map((t) => (
                                    <tr key={t.id} className="group hover:bg-base-200/50">
                                        <td className="w-32 font-mono text-xs opacity-70">{format(new Date(t.date), 'MMM dd, yyyy')}</td>
                                        <td className="font-medium">{t.title}</td>
                                        <td>
                                            <span className="badge badge-sm badge-ghost capitalize">{t.category}</span>
                                        </td>
                                        <td className={clsx(
                                            "text-right font-mono font-bold",
                                            t.type === 'income' ? "text-success" : "text-error"
                                        )}>
                                            {t.type === 'income' ? '+' : '-'}{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(t.amount)}
                                        </td>
                                        <td className="w-16 text-center">
                                            <div className="dropdown dropdown-end">
                                                <div tabIndex={0} role="button" className="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreHorizontal size={16} />
                                                </div>
                                                <ul tabIndex={0} className="dropdown-content z-[100] menu p-2 shadow-lg bg-base-100 rounded-box w-32 border border-base-200">
                                                    <li>
                                                        <a onClick={() => handleEdit(t)} className="text-info">
                                                            <Edit2 size={14} /> Edit
                                                        </a>
                                                    </li>
                                                    <li>
                                                        <a onClick={() => handleDelete(t.id)} className="text-error">
                                                            <Trash2 size={14} /> Delete
                                                        </a>
                                                    </li>
                                                </ul>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                {totalPages > 1 && (
                    <div className="p-3 border-t border-base-200 bg-base-100 flex justify-center items-center gap-2">
                        <button
                            className="btn btn-xs btn-outline"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <span className="text-xs font-mono opacity-70">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            className="btn btn-xs btn-outline"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={confirmState.isOpen}
                title={confirmState.title}
                message={confirmState.message}
                type={confirmState.type}
                onConfirm={confirmState.onConfirm}
                onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
            />

            {/* Edit Transaction Modal */}
            {editingTransaction && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-base-100 w-full max-w-md rounded-xl shadow-2xl border border-base-300 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Edit2 size={18} /> Edit Transaction
                            </h3>
                            <button className="btn btn-sm btn-ghost btn-circle" onClick={() => setEditingTransaction(null)}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="form-control">
                                <label className="label"><span className="label-text">Title</span></label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={editingTransaction.title}
                                    onChange={(e) => setEditingTransaction({ ...editingTransaction, title: e.target.value })}
                                />
                            </div>

                            <div className="form-control">
                                <label className="label"><span className="label-text">Amount (IDR)</span></label>
                                <input
                                    type="number"
                                    className="input input-bordered w-full"
                                    value={editingTransaction.amount}
                                    onChange={(e) => setEditingTransaction({ ...editingTransaction, amount: Number(e.target.value) })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-control">
                                    <label className="label"><span className="label-text">Type</span></label>
                                    <select
                                        className="select select-bordered w-full"
                                        value={editingTransaction.type}
                                        onChange={(e) => setEditingTransaction({ ...editingTransaction, type: e.target.value as 'income' | 'expense' })}
                                    >
                                        <option value="income">Income</option>
                                        <option value="expense">Expense</option>
                                    </select>
                                </div>

                                <div className="form-control">
                                    <label className="label"><span className="label-text">Category</span></label>
                                    <select
                                        className="select select-bordered w-full"
                                        value={editingTransaction.category}
                                        onChange={(e) => setEditingTransaction({ ...editingTransaction, category: e.target.value })}
                                    >
                                        <option value="food">Food</option>
                                        <option value="transport">Transport</option>
                                        <option value="shopping">Shopping</option>
                                        <option value="entertainment">Entertainment</option>
                                        <option value="bills">Bills</option>
                                        <option value="education">Education</option>
                                        <option value="transfer">Transfer</option>
                                        <option value="others">Others</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button className="btn btn-ghost" onClick={() => setEditingTransaction(null)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSaveEdit}>
                                <Save size={16} /> Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TransactionHistoryModal;
