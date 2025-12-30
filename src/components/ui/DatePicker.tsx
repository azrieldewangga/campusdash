import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import 'cally';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';



// Global declaration removed to resolve conflict with cally's strict types

interface DatePickerProps {
    date: Date;
    setDate: (date: Date) => void;
}

export const DatePicker = ({ date, setDate }: DatePickerProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const portalRef = useRef<HTMLDivElement>(null); // Ref for the portal content
    const calendarRef = useRef<any>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: any) => {
            // Check if click is inside basic container OR inside the Portal
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target) &&
                portalRef.current &&
                !portalRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Handle cally change event manually to ensure it works
    useEffect(() => {
        const calendarEl = calendarRef.current;
        if (calendarEl) {
            const handleChange = (e: any) => handleDateChange(e);
            calendarEl.addEventListener('change', handleChange);
            return () => calendarEl.removeEventListener('change', handleChange);
        }
    }, [isOpen]); // Re-attach when opened (rendered)

    const handleDateChange = (e: any) => {
        const newDateVal = e.target.value; // YYYY-MM-DD
        if (!newDateVal) return;

        const [year, month, day] = newDateVal.split('-').map(Number);
        const newDate = new Date(date);
        newDate.setFullYear(year);
        newDate.setMonth(month - 1);
        newDate.setDate(day);

        setDate(newDate);
    };

    // Year editing state
    const [isEditingYear, setIsEditingYear] = useState(false);
    const [yearInput, setYearInput] = useState('');

    const handleYearClick = (e: React.MouseEvent) => {
        const currentParams = (e.target as HTMLElement).innerText;
        setYearInput(currentParams || new Date().getFullYear().toString());
        setIsEditingYear(true);
    };

    const handleYearSubmit = () => {
        const newYear = parseInt(yearInput, 10);
        if (!isNaN(newYear) && newYear > 1900 && newYear < 2100) {
            const newDate = new Date(date);
            newDate.setFullYear(newYear);
            setDate(newDate);
        }
        setIsEditingYear(false);
    };

    // Portal styling for fixed position
    const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

    useEffect(() => {
        if (isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            // Check if it fits below, otherwise show above? For now simpler: always below-right or left.
            let top = rect.bottom + window.scrollY + 8;
            let left = rect.left + window.scrollX;

            // Basic viewport check
            if (top + 400 > window.innerHeight) {
                top = rect.top - 400; // rough flip
            }

            setPopoverStyle({
                position: 'fixed',
                top: `${top}px`,
                left: `${left}px`,
                zIndex: 9999,
            });
        }
    }, [isOpen]);

    const buttonClass = clsx(
        "input input-bordered w-full flex items-center justify-between cursor-pointer",
        isOpen && "input-primary"
    );

    return (
        <div className="relative" ref={containerRef}>
            <div
                className={buttonClass}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2">
                    <CalendarIcon size={18} className="opacity-70" />
                    <span className="flex-1 text-left">{format(date, 'MMMM d, yyyy')}</span>
                </div>
            </div>

            {isOpen && createPortal(
                <div
                    ref={portalRef}
                    style={popoverStyle}
                    className="bg-base-100 border border-base-content/10 rounded-2xl shadow-2xl animate-fade-in overflow-hidden w-fit p-4"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Cally Calendar Wrapper */}
                    <div className="p-0 relative">
                        <style>{`
                            calendar-date::part(button) {
                                background: transparent;
                                border: none;
                                cursor: pointer;
                                color: oklch(var(--bc)/0.7);
                                display: flex;
                                align-items: center;
                                justify-content: center;
                            }
                            calendar-date::part(button):hover {
                                color: oklch(var(--bc));
                                background: oklch(var(--b2));
                                border-radius: 9999px;
                            }
                            calendar-month::part(button) {
                                border: 2px solid transparent;
                            }
                            calendar-month::part(button)[aria-selected="true"] {
                                background: transparent !important;
                                border-color: oklch(var(--p)) !important;
                                color: inherit !important;
                            }
                            calendar-month::part(button today) {
                                font-weight: bold;
                            }
                            /* Hide default slots explicitly just in case */
                            calendar-date > *:not([slot]):not(calendar-month) {
                                display: none;
                            }
                        `}</style>
                        <calendar-date
                            ref={calendarRef}
                            value={format(date, 'yyyy-MM-dd')}
                            locale="en-US"
                            className="bg-base-100 text-base-content shadow-none border-none relative block"
                            showOutsideDays
                            style={{
                                '--c-color-accent': 'transparent',
                                '--c-color-text': 'currentColor'
                            } as React.CSSProperties}
                        ><span slot="previous" className="absolute left-8 top-0 z-20 flex items-center justify-center w-8 h-8 pointer-events-none">
                                <ChevronLeft size={20} className="pointer-events-auto" />
                            </span><span slot="next" className="absolute right-8 top-0 z-20 flex items-center justify-center w-8 h-8 pointer-events-none">
                                <ChevronRight size={20} className="pointer-events-auto" />
                            </span><span slot="month" className="text-lg font-bold capitalize inline-block mr-1.5 align-middle"></span><span
                                slot="year"
                                className={clsx("text-lg font-bold cursor-pointer hover:text-primary transition-colors inline-block align-middle relative z-30", isEditingYear && "opacity-0")}
                                onPointerDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleYearClick(e);
                                }}
                            ></span>{isEditingYear && (
                                <input
                                    autoFocus
                                    type="number"
                                    className="absolute top-0 left-1/2 -translate-x-1/2 w-24 text-center text-lg font-bold bg-base-100 z-50 outline-none border-b-2 border-primary shadow-sm"
                                    value={yearInput}
                                    onChange={e => setYearInput(e.target.value)}
                                    onBlur={handleYearSubmit}
                                    onKeyDown={e => e.key === 'Enter' && handleYearSubmit()}
                                    onClick={e => e.stopPropagation()}
                                    onPointerDown={e => e.stopPropagation()}
                                />
                            )}<calendar-month></calendar-month></calendar-date>
                    </div>
                </div>,
                document.body
            )
            }
        </div >
    );
};
