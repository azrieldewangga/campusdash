import React, { ReactNode } from 'react';
import clsx from 'clsx';

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    bodyClassName?: string;
    variant?: 'base' | 'soft' | 'strong';
    title?: string;
    action?: ReactNode;
}

const GlassCard = ({
    children,
    className,
    bodyClassName,
    variant = 'base', // Kept for API compatibility, unused
    title,
    action
}: GlassCardProps) => {

    return (
        <div className={clsx(
            "card bg-base-100 shadow-xl border border-base-200", // Default / Fallback styles
            className
        )}>
            <div className={clsx("card-body p-6", bodyClassName)}>
                {(title || action) && (
                    <div className="flex justify-between items-center mb-4">
                        {title && <h2 className="card-title text-xl">{title}</h2>}
                        {action && <div>{action}</div>}
                    </div>
                )}
                {children}
            </div>
        </div>
    );
};

export default GlassCard;
