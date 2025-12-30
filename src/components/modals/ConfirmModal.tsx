import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    type?: 'danger' | 'warning' | 'info';
}

import ReactDOM from 'react-dom';

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, title, message, onConfirm, onCancel, type = 'warning' }) => {
    if (!isOpen || !document.body) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            {/* Window Container */}
            <div className="mockup-browser bg-base-100 w-full max-w-sm shadow-2xl border border-base-300">
                {/* Traffic Lights / Toolbar */}
                <div className="mockup-browser-toolbar h-8 my-1 px-3 before:hidden flex items-center">
                    {/* Spacer for centering */}
                    <div className="w-16" />
                    {/* Center Title */}
                    <div className="flex-1 text-center text-xs opacity-60 font-mono">
                        confirm-dialog
                    </div>
                    {/* Traffic Lights - Right Side */}
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#febc2e] border border-black/10 shadow-sm" />
                        <div className="w-3 h-3 rounded-full bg-[#28c840] border border-black/10 shadow-sm" />
                        <div className="w-3 h-3 rounded-full bg-[#ff5f57] border border-black/10 shadow-sm" />
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 bg-base-100 flex flex-col items-center text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${type === 'danger' ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'}`}>
                        <AlertCircle size={24} />
                    </div>
                    <h3 className="font-bold text-lg mb-2">{title}</h3>
                    <p className="text-sm opacity-70 mb-6">{message}</p>

                    <div className="flex w-full gap-3">
                        <button className="btn btn-sm flex-1" onClick={onCancel}>Cancel</button>
                        <button
                            className={`btn btn-sm flex-1 ${type === 'danger' ? 'btn-error' : 'btn-primary'}`}
                            onClick={onConfirm}
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ConfirmModal;
