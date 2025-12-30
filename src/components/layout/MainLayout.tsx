import React, { ReactNode, useEffect } from 'react';
import clsx from 'clsx';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import QuickAddModal from '../shared/QuickAddModal';
import { useStore } from '../../store/useStore';

interface MainLayoutProps {
    children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const { isQuickAddOpen, fetchUserProfile, isHistoryWindowOpen, setHistoryWindowOpen, notification } = useStore();
    const handleMinimize = () => window.electronAPI.minimize();
    const handleMaximize = () => window.electronAPI.maximize();
    const handleClose = () => window.electronAPI.close();

    useEffect(() => {
        fetchUserProfile();

        // Listen for child window events from Electron
        // @ts-ignore
        const removeOpenListener = window.electronAPI.on('child-window-opened', () => {
            console.log("MainLayout: Child window opened");
            setHistoryWindowOpen(true);
        });

        // @ts-ignore
        const removeCloseListener = window.electronAPI.on('child-window-closed', () => {
            console.log("MainLayout: Child window closed");
            setHistoryWindowOpen(false);
        });

        return () => {
            // Cleanup - using removeAllListeners for simplicity since we can't easily pass the exact callback back if it's wrapped
            // @ts-ignore
            if (window.electronAPI.removeAllListeners) {
                // @ts-ignore
                window.electronAPI.removeAllListeners('child-window-opened');
                // @ts-ignore
                window.electronAPI.removeAllListeners('child-window-closed');
            }
        };
    }, []);

    const isDimmed = isQuickAddOpen || isHistoryWindowOpen;

    return (
        <div className="h-screen w-screen overflow-hidden bg-transparent flex flex-col p-4">
            {/* Custom Window Frame - Replaces mockup-browser for full control */}
            <div id="layout-mockup-frame" className="flex flex-col h-full w-full bg-base-100 rounded-3xl overflow-hidden shadow-2xl relative">

                {/* Custom Titlebar */}
                <div className="h-12 min-h-[3rem] w-full titlebar-drag flex items-center pr-4 bg-base-100 border-b border-base-content/5 z-50">

                    {/* Branding - Left Side */}
                    <div className="flex items-center gap-2 pl-5 no-drag select-none">
                        <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                            <span className="font-bold text-primary-content text-sm">CD</span>
                        </div>
                        <span className="font-bold text-lg tracking-tight text-base-content font-display">CampusDash</span>
                    </div>

                    <div className="flex-1"></div>

                    {/* Address Bar Simulation */}
                    <div className="hidden md:flex items-center justify-center gap-2 bg-base-200/50 px-4 py-1.5 rounded-full border border-base-content/5 no-drag absolute left-1/2 -translate-x-1/2 opacity-60 hover:opacity-100 transition-opacity w-96 max-w-[40vw]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <span className="text-xs font-mono opacity-70 selection:bg-primary/30">campus-dash://app</span>
                    </div>

                    <div className="flex-1"></div>

                    {/* Custom Window Controls (Traffic Lights) */}
                    <div className="flex gap-2 no-drag z-50">
                        <button onClick={handleMinimize} className="w-3.5 h-3.5 rounded-full bg-yellow-400 hover:bg-yellow-500 border border-yellow-600/20 transition-all shadow-sm group flex items-center justify-center" title="Minimize">
                            <svg className="w-2 h-2 text-yellow-900 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        </button>
                        <button onClick={handleMaximize} className="w-3.5 h-3.5 rounded-full bg-green-500 hover:bg-green-600 border border-green-600/20 transition-all shadow-sm group flex items-center justify-center" title="Maximize">
                            <svg className="w-2 h-2 text-green-900 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
                        </button>
                        <button onClick={handleClose} className="w-3.5 h-3.5 rounded-full bg-red-500 hover:bg-red-600 border border-red-600/20 transition-all shadow-sm group flex items-center justify-center" title="Close">
                            <svg className="w-2 h-2 text-red-900 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div id="layout-main-wrapper" className="flex flex-1 overflow-hidden bg-base-100 relative">
                    {/* Dimming Overlay */}
                    <div className={clsx(
                        "absolute inset-0 z-[100] bg-black/40 backdrop-blur-sm transition-all duration-300 pointer-events-none",
                        isDimmed ? "opacity-100" : "opacity-0"
                    )}></div>

                    <div className="drawer lg:drawer-open h-full w-full">
                        <input id="main-drawer" type="checkbox" className="drawer-toggle" />

                        <div id="layout-drawer-content" className="drawer-content flex flex-col h-full overflow-hidden relative">
                            <TopBar />
                            <main id="layout-content-area" className="flex-1 overflow-y-auto p-6 bg-base-200/50">
                                <div className="container mx-auto max-w-7xl animate-fade-in">
                                    {children}
                                </div>
                            </main>
                        </div>

                        <Sidebar />
                    </div>
                </div>
            </div>

            <QuickAddModal />

            {/* Notification Toast */}
            {notification && (
                <div className="toast toast-bottom toast-end z-[9999]">
                    <div className={clsx(
                        "alert shadow-lg",
                        notification.type === 'info' && "alert-info",
                        notification.type === 'success' && "alert-success",
                        notification.type === 'error' && "alert-error",
                        notification.type === 'warning' && "alert-warning"
                    )}>
                        <span>{notification.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MainLayout;
