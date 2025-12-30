import React from 'react';
import clsx from 'clsx';
import { useStore } from '../../store/useStore';

const GlassBackground = () => {
    // We can read theme from local storage or store if needed, 
    // but CSS variables approach is better for theme switching.
    // However, for specific gradients, we might use the 'data-theme' selector in CSS or just use Tailwind classes that rely on CSS vars.
    // But the user provided specific gradients. We'll use a mix.

    // Using the user's requested structure:
    // 1. Backplate (Subtle)
    // 2. Global Glass Sheet (Accordion/Material cues)

    // Check for glass mode - we can rely on the html.glass-mode class opacity trick, 
    // or we can conditionally render. Conditional render saves resources if glass is off.
    // We'll read the class from document? No, React state is cleaner.
    // The sidebar toggle updates localStorage and the DOM. 
    // We can use a simple hook or just let the CSS handle the visibility if we want to be reactive to the class change without re-render.
    // BUT, the user asked for "GlassBackground" to contain these layers.

    // Let's use CSS-based visibility for performance, so we don't need to hook into the store for just this 
    // unless we want to remove the DOM elements entirely.
    // Given the Sidebar toggles the class 'glass-mode' on HTML, we can scope styles to that.

    return (
        <>
            {/* 1. Backplate - Subtle Texture/Gradient */}
            {/* Only visible in Glass Mode (managed via CSS opacity/display) */}
            <div className="fixed inset-0 -z-50 pointer-events-none opacity-0 [.glass-mode_&]:opacity-100 transition-opacity duration-500">
                {/* Dark Mode Backplate */}
                <div className="absolute inset-0 dark:bg-[linear-gradient(135deg,#050712,#0b1220)] dark:hidden [.glass-mode[data-theme='dark']_&]:block transition-all">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.08),transparent_45%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.05),transparent_40%)]" />
                </div>

                {/* Light Mode Backplate */}
                <div className="absolute inset-0 hidden [.glass-mode[data-theme='light']_&]:block bg-[linear-gradient(to_bottom_right,#f3f4f6,#ffffff)] transition-all">
                    <div className="absolute inset-0 bg-[radial-gradient(at_10%_10%,rgba(14,165,233,0.15)_0px,transparent_50%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(at_90%_90%,rgba(244,63,94,0.12)_0px,transparent_50%)]" />
                </div>
            </div>

            {/* 2. Global Glass Sheet - The "Acrylic" Material */}
            {/* High blur, low opacity, subtle border */}
            <div className={clsx(
                "fixed inset-0 -z-40 pointer-events-none opacity-0 [.glass-mode_&]:opacity-100 transition-opacity duration-500",
                // Base Sheet Styles
                "backdrop-blur-[22px]",
                // Border & Shadow
                "border border-white/10 dark:border-white/5",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]",
                // Background Tint (Dark/Light adaption)
                "dark:bg-white/[0.06]",
                "light:bg-white/[0.2]" // Slightly higher for light mode to be visible
            )}>
                {/* Optional Inner Sheen via pseudo-element simulation if needed, or just let the shadow-inset do it */}
            </div>
        </>
    );
};

export default GlassBackground;
