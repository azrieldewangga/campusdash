import React from 'react';
import ReactDOM from 'react-dom';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDestructive = false
}) => {
    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="modal modal-open modal-bottom sm:modal-middle z-[9999]">
            <div className="modal-box relative border border-base-content/10 shadow-2xl">
                <button
                    className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                    onClick={onCancel}
                >
                    ✕
                </button>

                <h3 className="font-bold text-lg flex items-center gap-2">
                    {isDestructive && <AlertTriangle className="text-error w-5 h-5" />}
                    {title}
                </h3>
                <p className="py-4 opacity-80">
                    {message}
                </p>

                <div className="modal-action">
                    <button className="btn btn-ghost" onClick={onCancel}>
                        {cancelText}
                    </button>
                    <button
                        className={`btn ${isDestructive ? 'btn-error' : 'btn-primary'}`}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
            {/* Backdrop using standard DaisyUI methodology */}
            <form method="dialog" className="modal-backdrop">
                <button onClick={onCancel}>close</button>
            </form>
        </div>,
        document.body
    );
};

export default ConfirmModal;
