import { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Wallet, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, ShoppingBag, Music, Coffee, Zap, Home, GraduationCap, Smartphone, MoreHorizontal } from 'lucide-react';
import { format, isSameMonth, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

import GlassCard from '../components/shared/GlassCard';
import SubscriptionsTab from '../components/cashflow/SubscriptionsTab';

const RATE = 16000;

const Cashflow = () => {
    const { transactions, fetchTransactions, setQuickAddOpen, currency, setCurrency } = useStore();
    const [period, setPeriod] = useState<'Weekly' | 'Monthly' | 'Yearly'>('Yearly');
    const [activeTab, setActiveTab] = useState<'tracker' | 'subscriptions'>('tracker');

    useEffect(() => {
        fetchTransactions();
    }, []);

    const formatMoney = (amountIDR: number) => {
        if (currency === 'IDR') {
            return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amountIDR);
        } else {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amountIDR / RATE);
        }
    };

    // Calculate Totals for the CURRENT MONTH
    const currentMonthDate = new Date();

    // Sort transactions by date descending
    const sortedTransactions = useMemo(() => {
        return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions]);

    // --- Dynamic Calculations ---
    const totalBalance = useMemo(() => {
        return transactions.reduce((acc, tx) => {
            const amount = Number(tx.amount);
            if (amount < 0) {
                return acc + amount;
            }
            return acc + (tx.type === 'income' ? amount : -amount);
        }, 0);
    }, [transactions]);

    const { monthlyIncome, monthlyExpense } = useMemo(() => {
        return transactions.reduce((acc, tx) => {
            if (isSameMonth(new Date(tx.date), currentMonthDate)) {
                const amount = Number(tx.amount);
                if (amount < 0) {
                    acc.monthlyExpense += Math.abs(amount);
                } else if (tx.type === 'income') {
                    acc.monthlyIncome += amount;
                } else {
                    acc.monthlyExpense += amount;
                }
            }
            return acc;
        }, { monthlyIncome: 0, monthlyExpense: 0 });
    }, [transactions]);

    // Chart Data Aggregation
    const financialData = useMemo(() => {
        if (period === 'Yearly') {
            const start = new Date(currentMonthDate.getFullYear(), 0, 1);
            const end = new Date(currentMonthDate.getFullYear(), 11, 31);
            const months = eachDayOfInterval({ start, end }).filter(d => d.getDate() === 1);
            return months.map(monthStart => {
                const monthName = format(monthStart, 'MMM');
                const monthTx = transactions.filter(t => isSameMonth(new Date(t.date), monthStart));
                const inc = monthTx.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
                const exp = monthTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
                return { name: monthName, income: inc, expense: exp, balance: inc - exp };
            });
        } else if (period === 'Monthly') {
            const startOfMonth = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), 1);
            const endOfCurrentMonth = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 0);
            const weeks = [];
            let currentStart = startOfMonth;
            let weekCount = 1;
            while (currentStart <= endOfCurrentMonth) {
                const currentEnd = endOfWeek(currentStart, { weekStartsOn: 1 });
                const actualEnd = currentEnd > endOfCurrentMonth ? endOfCurrentMonth : currentEnd;
                const weekTx = transactions.filter(t => {
                    const d = new Date(t.date);
                    return d >= currentStart && d <= actualEnd;
                });
                const inc = weekTx.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
                const exp = weekTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
                weeks.push({ name: `Week ${weekCount}`, income: inc, expense: exp, balance: inc - exp });
                currentStart = new Date(currentEnd);
                currentStart.setDate(currentStart.getDate() + 1);
                weekCount++;
            }
            return weeks;
        } else {
            const start = startOfWeek(currentMonthDate, { weekStartsOn: 1 });
            const end = endOfWeek(currentMonthDate, { weekStartsOn: 1 });
            const days = eachDayOfInterval({ start, end });
            return days.map(d => {
                const dayName = format(d, 'EEE');
                const dayTx = transactions.filter(t => isSameDay(new Date(t.date), d));
                const inc = dayTx.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
                const exp = dayTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
                return { name: dayName, income: inc, expense: exp, balance: inc - exp };
            });
        }
    }, [period, transactions, currentMonthDate]);

    const dataIncome = useMemo(() => financialData.map(d => ({ name: d.name, val: d.income })), [financialData]);
    const dataExpense = useMemo(() => financialData.map(d => ({ name: d.name, val: d.expense })), [financialData]);
    const dataBalance = useMemo(() => {
        let running = 0;
        return financialData.map(d => {
            running += d.balance;
            return { name: d.name, val: running };
        });
    }, [financialData]);

    const getIcon = (category: string) => {
        switch (category.toLowerCase()) {
            case 'food': return Coffee;
            case 'transport': return Zap;
            case 'shopping': return ShoppingBag;
            case 'entertainment': return Music;
            case 'bills': return Home;
            case 'education': return GraduationCap;
            case 'others': return MoreHorizontal;
            case 'transfer': return DollarSign;
            default: return DollarSign;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Wallet /> Cashflow
                </h1>

                {/* Tab Switcher */}
                <div role="tablist" className="tabs tabs-boxed bg-base-100/50 p-1 border border-base-200">
                    <a
                        role="tab"
                        className={`tab ${activeTab === 'tracker' ? 'tab-active' : ''}`}
                        onClick={() => setActiveTab('tracker')}
                    >
                        Tracker
                    </a>
                    <a
                        role="tab"
                        className={`tab ${activeTab === 'subscriptions' ? 'tab-active' : ''}`}
                        onClick={() => setActiveTab('subscriptions')}
                    >
                        Subscriptions
                    </a>
                </div>

                <div className="flex items-center gap-2 bg-base-100 p-1 rounded-lg border border-base-200">
                    <div
                        className="relative inline-flex items-center cursor-pointer bg-base-200 rounded-lg p-1 border border-base-300 select-none"
                        onClick={() => setCurrency(currency === 'IDR' ? 'USD' : 'IDR')}
                    >
                        <div className={`absolute left-1 top-1 w-16 h-8 bg-primary rounded-md shadow-sm transition-transform duration-300 ease-in-out ${currency === 'USD' ? 'translate-x-full' : 'translate-x-0'}`}></div>
                        <div className="relative z-10 flex">
                            <span className={`w-16 h-8 flex items-center justify-center text-sm font-bold transition-colors duration-300 ${currency === 'IDR' ? 'text-primary-content' : 'text-base-content/60'}`}>IDR</span>
                            <span className={`w-16 h-8 flex items-center justify-center text-sm font-bold transition-colors duration-300 ${currency === 'USD' ? 'text-primary-content' : 'text-base-content/60'}`}>USD</span>
                        </div>
                    </div>
                </div>
            </div>

            {activeTab === 'tracker' && (
                <GlassCard className="border border-base-200" bodyClassName="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-base-300">
                        <div className="p-6">
                            <div className="text-xs opacity-50 uppercase font-bold tracking-wider mb-2">Income (This Month)</div>
                            <div className="flex items-end gap-2">
                                <div className="text-2xl font-bold text-success">{formatMoney(monthlyIncome)}</div>
                                <div className="text-xs text-success mb-1 flex items-center"><ArrowUpRight size={12} /></div>
                            </div>
                            <div className="h-16 mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={dataIncome}>
                                        <defs>
                                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="currentColor" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <Area type="monotone" dataKey="val" stroke="currentColor" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} className="text-base-content" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="text-xs opacity-50 uppercase font-bold tracking-wider mb-2">Expense (This Month)</div>
                            <div className="flex items-end gap-2">
                                <div className="text-2xl font-bold text-error">{formatMoney(monthlyExpense)}</div>
                                <div className="text-xs text-error mb-1 flex items-center"><ArrowDownRight size={12} /></div>
                            </div>
                            <div className="h-16 mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={dataExpense}>
                                        <defs>
                                            <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4b5563" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#4b5563" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <Area type="monotone" dataKey="val" stroke="#4b5563" fillOpacity={1} fill="url(#colorSpend)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-base-200/50 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110"></div>
                            <div className="text-xs opacity-50 uppercase font-bold tracking-wider mb-2">Total Balance</div>
                            <div className="flex items-end gap-2">
                                <div className="text-2xl font-bold">{formatMoney(totalBalance)}</div>
                            </div>
                            <div className="h-16 mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={dataBalance}>
                                        <defs>
                                            <linearGradient id="colorSave" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#1BC98A" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#1BC98A" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <Area type="monotone" dataKey="val" stroke="#1BC98A" fillOpacity={1} fill="url(#colorSave)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="divider m-0 h-[1px] bg-base-300"></div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-base-300">
                        <div className="lg:col-span-1 flex flex-col h-[500px]">
                            <div className="p-4 border-b border-base-200 flex justify-between items-center sticky top-0 z-10 bg-base-100">
                                <h3 className="font-bold text-lg">Transactions</h3>
                                <button className="btn btn-sm btn-ghost btn-circle" onClick={() => setQuickAddOpen(true, 'transaction')}>
                                    <div className="sr-only">Add</div>
                                    <span className="text-2xl leading-none">+</span>
                                </button>
                            </div>
                            <div className="overflow-y-auto flex-1">
                                {sortedTransactions.length === 0 ? (
                                    <div className="p-10 text-center text-sm opacity-50">
                                        No transactions yet.
                                    </div>
                                ) : (
                                    sortedTransactions.map((tx) => {
                                        const Icon = getIcon(tx.category);
                                        const isIncome = tx.type === 'income';
                                        return (
                                            <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-base-200 transition-colors border-b border-base-200 last:border-0 group">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isIncome ? 'bg-success/10 text-success group-hover:bg-success/20' : 'bg-error/10 text-error group-hover:bg-error/20'} `}>
                                                        <Icon size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm">{tx.title}</p>
                                                        <p className="text-xs opacity-50">{format(new Date(tx.date), 'MMM dd, HH:mm')}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`font-bold text-sm ${isIncome ? 'text-success' : 'text-error'} `}>
                                                        {isIncome ? '+' : '-'}{formatMoney(Math.abs(tx.amount))}
                                                    </p>
                                                    <p className="text-xs opacity-50 capitalize">{tx.category}</p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                            <div className="p-3 border-t border-base-200 text-center relative z-50 bg-base-100">
                                <button
                                    className="btn btn-sm btn-outline border-base-content/30 hover:border-base-content/50 w-full"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        // @ts-ignore
                                        if (window.electronAPI && window.electronAPI.openWindow) {
                                            // @ts-ignore
                                            window.electronAPI.openWindow('/history', 900, 600);
                                        } else {
                                            console.error("API Missing");
                                        }
                                    }}
                                >
                                    View History
                                </button>
                            </div>
                        </div>

                        <div className="lg:col-span-2 p-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                                <div>
                                    <div className="text-2xl font-bold">{formatMoney(totalBalance)}</div>
                                </div>
                                <select
                                    className="select select-sm w-32 font-medium focus:ring-0 focus:outline-none rounded-lg bg-base-100"
                                    style={{ boxShadow: 'inset 0 0 0 1px rgba(128, 128, 128, 0.4)' }}
                                    value={period}
                                    onChange={(e) => setPeriod(e.target.value as 'Weekly' | 'Monthly' | 'Yearly')}
                                >
                                    <option value="Weekly">Weekly</option>
                                    <option value="Monthly">Monthly</option>
                                    <option value="Yearly">Yearly</option>
                                </select>
                            </div>

                            <div className="h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={dataBalance}
                                        margin={{ top: 20, right: 10, left: 0, bottom: 5 }}
                                    >
                                        <defs>
                                            <linearGradient id="colorBalanceMain" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#1BC98A" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#1BC98A" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={false} stroke="currentColor" opacity={0.1} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'currentColor', opacity: 0.5 }} minTickGap={30} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: 'currentColor', opacity: 0.5 }} tickFormatter={(val) => currency === 'USD' ? `$${val / 1000}k` : `${val / 1000}k`} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'oklch(var(--b1))', borderColor: 'oklch(var(--b2))', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: 'oklch(var(--bc))' }}
                                            itemStyle={{ fontSize: '12px' }}
                                            formatter={(value: number) => [formatMoney(value), 'Balance']}
                                        />
                                        <Area type="monotone" dataKey="val" stroke="#1BC98A" fillOpacity={1} fill="url(#colorBalanceMain)" strokeWidth={2} name="Balance" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </GlassCard>
            )}

            {activeTab === 'subscriptions' && (
                <SubscriptionsTab formatMoney={formatMoney} />
            )}
        </div>
    );
};

export default Cashflow;

