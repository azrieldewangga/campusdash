import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useStore } from '../../store/useStore';
import GlassCard from '../shared/GlassCard';
import { Plus, Calendar, Trash2, Edit2, Zap } from 'lucide-react';
import { format } from 'date-fns';

interface SubscriptionsTabProps {
    formatMoney: (amount: number) => string;
}

import ConfirmModal from '../modals/ConfirmModal';

const SubscriptionsTab: React.FC<SubscriptionsTabProps> = ({ formatMoney }) => {
    const { subscriptions, fetchSubscriptions, addSubscription, deleteSubscription, updateSubscription } = useStore();

    // Main Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

    // Confirm Modal State
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string, name: string } | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        cost: 0,
        dueDay: 1
    });

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    // Handle ESC key for Main Modal
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isModalOpen) {
                closeModal();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isModalOpen]);

    const totalMonthly = useMemo(() => {
        return subscriptions.reduce((sum, sub) => sum + Number(sub.cost), 0);
    }, [subscriptions]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...formData,
            cost: Number(formData.cost),
            dueDay: Number(formData.dueDay)
        };

        if (editId) {
            await updateSubscription(editId, payload);
        } else {
            await addSubscription(payload);
        }
        closeModal();
    };

    const openEdit = (sub: any) => {
        setFormData({
            name: sub.name,
            cost: sub.cost,
            dueDay: sub.dueDay
        });
        setEditId(sub.id);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditId(null);
        setFormData({ name: '', cost: 0, dueDay: 1 });
    };

    const handleDeleteClick = (id: string, name: string) => {
        setDeleteTarget({ id, name });
        setConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (deleteTarget) {
            await deleteSubscription(deleteTarget.id);
            setConfirmOpen(false);
            setDeleteTarget(null);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header / Summary */}
            <GlassCard
                className="border border-base-200"
                bodyClassName="flex flex-row items-center justify-between p-6"
            >
                <div className="flex items-center gap-3">
                    <div className="p-4 bg-primary/10 rounded-full text-primary">
                        <Zap size={24} />
                    </div>
                    <div>
                        <h2 className="text-sm uppercase font-bold opacity-50 tracking-wider">Total Monthly Cost</h2>
                        <p className="text-3xl font-bold">{formatMoney(totalMonthly)}</p>
                    </div>
                </div>
                <button className="btn btn-primary gap-2" onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} />
                    Add Subscription
                </button>
            </GlassCard>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subscriptions.map((sub: any) => (
                    <div key={sub.id} className="bg-base-200/50 rounded-xl p-4 border border-base-content/5 relative group hover:bg-base-200 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-lg">{sub.name}</h3>
                            <div className=" opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <button
                                    className="btn btn-ghost btn-xs p-1 h-auto min-h-0"
                                    onClick={() => openEdit(sub)}
                                >
                                    <Edit2 size={14} />
                                </button>
                                <button
                                    className="btn btn-ghost btn-xs p-1 h-auto min-h-0 text-error"
                                    onClick={() => handleDeleteClick(sub.id, sub.name)}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-2xl font-bold text-base-content">
                                    {formatMoney(sub.cost)}
                                    <span className="text-xs font-normal opacity-50 ml-1">/mo</span>
                                </p>
                                <p className="text-xs opacity-50 mt-1 flex items-center gap-1">
                                    Next due: <span className="font-semibold text-primary">Day {sub.dueDay}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                ))}

                {subscriptions.length === 0 && (
                    <div className="col-span-full py-12 text-center opacity-50 border-2 border-dashed border-base-300 rounded-xl">
                        <p>No active subscriptions.</p>
                        <p className="text-xs mt-1">Add regular bills like Netflix, Gym, or Internet.</p>
                    </div>
                )}
            </div>

            {/* Delete Confirmation */}
            <ConfirmModal
                isOpen={confirmOpen}
                title="Stop Subscription?"
                message={`Are you sure you want to remove "${deleteTarget?.name}"? Past transactions for this subscription will remain in your history.`}
                onConfirm={confirmDelete}
                onCancel={() => setConfirmOpen(false)}
                type="danger"
            />

            {/* Simple Modal */}
            {isModalOpen && document.body && (
                ReactDOM.createPortal(
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-base-100 rounded-2xl shadow-xl w-full max-w-sm border border-base-200 p-6 animate-in fade-in zoom-in duration-200">
                            {/* Close Button X */}
                            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={closeModal}>✕</button>

                            <h3 className="text-lg font-bold mb-4">{editId ? 'Edit Subscription' : 'New Subscription'}</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Name</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input input-bordered w-full"
                                        placeholder="Netflix, Spotify, Kos..."
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        autoFocus
                                    />
                                </div>
                                {/* ... cost ... */}
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Monthly Cost</span>
                                    </label>
                                    <label className="input-group input-group-vertical">
                                        <input
                                            type="number"
                                            className="input input-bordered w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            value={formData.cost}
                                            onChange={e => setFormData({ ...formData, cost: Number(e.target.value) })}
                                            required
                                            min="0"
                                        />
                                    </label>
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Due Day (1-31)</span>
                                    </label>
                                    <input
                                        type="number"
                                        className="input input-bordered w-full"
                                        placeholder="25"
                                        value={formData.dueDay}
                                        onChange={e => setFormData({ ...formData, dueDay: Math.min(31, Math.max(1, Number(e.target.value))) })}
                                        required
                                        min="1"
                                        max="31"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 mt-6">
                                    <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">{editId ? 'Save Changes' : 'Start Subscription'}</button>
                                </div>
                            </form>
                        </div>
                    </div>,
                    document.body
                )
            )}
        </div>
    );
};

export default SubscriptionsTab;
