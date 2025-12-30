import React, { useEffect, useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { User, Save, Cloud, CheckCircle, RefreshCw, Trash2, Clock } from 'lucide-react';
import ConfirmModal from '../components/common/ConfirmModal';

const GoogleDriveCard = () => {
    const { showNotification } = useStore();

    // G-Drive State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(false);
    const [lastBackup, setLastBackup] = useState<number | undefined>(undefined);
    const [isDisconnectModalOpen, setDisconnectModalOpen] = useState(false);

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        // @ts-ignore
        const auth = await window.electronAPI.drive.isAuthenticated();
        setIsAuthenticated(auth);
        // @ts-ignore
        const last = await window.electronAPI.drive.getLastBackup();
        setLastBackup(last);
    };

    const handleConnect = async () => {
        setLoading(true);
        try {
            // @ts-ignore
            const success = await window.electronAPI.drive.authenticate();
            if (success) {
                setIsAuthenticated(true);
                showNotification('Connected to Google Drive!', 'success');
            } else {
                // Usually failed silently or window closed
                showNotification('Connection flow cancelled or failed.', 'warning');
            }
        } catch (e: any) {
            console.error(e);
            showNotification('Error connecting: ' + (e.message || e), 'error');
        }
        setLoading(false);
    };

    const confirmDisconnect = async () => {
        // @ts-ignore
        await window.electronAPI.drive.logout();
        setIsAuthenticated(false);
        setLastBackup(undefined);
        setDisconnectModalOpen(false);
        showNotification('Google Drive disconnected.', 'info');
    };

    const handleBackupNow = async () => {
        setLoading(true);
        try {
            // @ts-ignore
            await window.electronAPI.drive.upload();
            showNotification('Backup uploaded successfully!', 'success');
            checkStatus();
        } catch (e: any) {
            console.error(e);
            showNotification('Backup failed: ' + (e.message || e), 'error');
        }
        setLoading(false);
    };

    return (
        <div className="bg-base-200 rounded-xl p-4 flex flex-col gap-3 border border-base-content/5 md:col-span-2 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-base-100 rounded-lg shadow-sm">
                        <Cloud className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold">Google Drive Backup</h3>
                        <p className="text-xs opacity-60">Autosave your database weekly</p>
                    </div>
                </div>
                {isAuthenticated && (
                    <div className="badge badge-success badge-sm gap-1 bg-success/10 text-success border-success/20">
                        <CheckCircle size={10} /> Connected
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-1 mt-1">
                <div className="text-xs flex justify-between opacity-70">
                    <span>Status</span>
                    <span className={isAuthenticated ? "text-success" : "text-warning"}>{isAuthenticated ? 'Active' : 'Not Connected'}</span>
                </div>
                <div className="text-xs flex justify-between opacity-70">
                    <span>Last Backup</span>
                    <span>{lastBackup ? new Date(lastBackup).toLocaleDateString() : 'Never'}</span>
                </div>
            </div>

            <div className="flex gap-2 mt-auto pt-2">
                {!isAuthenticated ? (
                    <button
                        type="button"
                        className="btn btn-sm btn-primary w-full"
                        onClick={handleConnect}
                        disabled={loading}
                    >
                        {loading ? <span className="loading loading-spinner loading-xs"></span> : 'Connect Google Drive'}
                    </button>
                ) : (
                    <div className="flex gap-2 w-full">
                        <div className="flex-1 flex items-center justify-center gap-2 px-3 bg-base-100 rounded-lg text-xs opacity-70 border border-base-content/10 cursor-help" title="Backups run automatically every 7 days">
                            <Clock size={14} />
                            <span>Weekly Auto-backup</span>
                        </div>
                        <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            onClick={handleBackupNow}
                            disabled={loading}
                            title="Backup Now"
                        >
                            {loading ? <span className="loading loading-spinner loading-xs"></span> : <RefreshCw size={14} />}
                        </button>
                        <button
                            type="button"
                            className="btn btn-sm btn-ghost text-error hover:bg-error/10 px-2"
                            onClick={() => setDisconnectModalOpen(true)}
                            disabled={loading}
                            title="Disconnect"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={isDisconnectModalOpen}
                title="Disconnect Google Drive?"
                message="Auto-backups will stop and you will need to reconnect to back up your data."
                confirmText="Disconnect"
                cancelText="Keep Connected"
                isDestructive={true}
                onConfirm={confirmDisconnect}
                onCancel={() => setDisconnectModalOpen(false)}
            />
        </div>
    );
};

const Settings = () => {
    const { userProfile, updateUserProfile, showNotification } = useStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Local state for form
    const [formData, setFormData] = useState({
        name: '',
        semester: 1,
        avatar: '',
        cardLast4: ''
    });

    useEffect(() => {
        if (userProfile && !formData.name) {
            setFormData({
                name: userProfile.name,
                semester: userProfile.semester,
                avatar: userProfile.avatar,
                cardLast4: userProfile.cardLast4 || ''
            });
        }
    }, [userProfile?.id]);

    // Listen for cropped image from cropper window
    useEffect(() => {
        const checkForCroppedImage = () => {
            const croppedImage = localStorage.getItem('croppedImage');
            if (croppedImage) {
                setFormData(prev => ({ ...prev, avatar: croppedImage }));
                localStorage.removeItem('croppedImage');
            }
        };

        checkForCroppedImage();

        const handleFocus = () => {
            checkForCroppedImage();
        };

        window.addEventListener('focus', handleFocus);
        const interval = setInterval(checkForCroppedImage, 500);

        return () => {
            window.removeEventListener('focus', handleFocus);
            clearInterval(interval);
        };
    }, []);

    // Startup State
    const [runAtStartup, setRunAtStartup] = useState(false);

    useEffect(() => {
        // @ts-ignore
        if (window.electronAPI?.settings) {
            // @ts-ignore
            window.electronAPI.settings.getStartupStatus().then(setRunAtStartup);
        }
    }, []);

    const toggleStartup = async (val: boolean) => {
        // @ts-ignore
        if (window.electronAPI?.settings) {
            // @ts-ignore
            const newState = await window.electronAPI.settings.toggleStartup(val);
            setRunAtStartup(newState);
            if (newState) showNotification('App will run at startup', 'success');
            else showNotification('App will not run at startup', 'info');
        }
    };

    const handleSubmit = async (e: React.FormEvent | React.KeyboardEvent) => {
        e.preventDefault();
        console.log('Submitting Settings:', formData);
        await updateUserProfile(formData);
        useStore.getState().fetchUserProfile();
        showNotification('Profile saved successfully!', 'success');
    };

    const handleInitialChange = () => {
        const newAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`;
        setFormData({ ...formData, avatar: newAvatar });
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                localStorage.setItem('cropperImage', base64String);
                // @ts-ignore
                if (window.electronAPI?.openWindow) {
                    // @ts-ignore
                    window.electronAPI.openWindow('/cropper', 600, 700);
                }
            };
            reader.readAsDataURL(file);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Settings</h1>

            <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                    <h2 className="card-title flex items-center gap-2">
                        <User />
                        Profile Settings
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                        <div className="flex items-center gap-8">
                            <div className="avatar">
                                <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden">
                                    <img src={formData.avatar || "https://ui-avatars.com/api/?name=User"} alt="Avatar" className="object-cover" />
                                </div>
                            </div>
                            <div className="form-control gap-4">
                                <label className="label p-0">
                                    <span className="label-text">Profile Picture</span>
                                </label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="file-input file-input-bordered file-input-sm rounded-lg"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleInitialChange}
                                        className="btn btn-ghost btn-sm"
                                    >
                                        Reset
                                    </button>
                                </div>

                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Display Name</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Your Name"
                                    className="input input-bordered w-full"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Current Semester</span>
                                </label>
                                <select
                                    className="select select-bordered w-full"
                                    value={formData.semester}
                                    onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                                >
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                                        <option key={sem} value={sem}>Semester {sem}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Card Last 4 Digits</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. 8888"
                                    maxLength={4}
                                    pattern="\d{4}"
                                    className="input input-bordered w-full font-mono"
                                    value={formData.cardLast4}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                        setFormData({ ...formData, cardLast4: val });
                                    }}
                                />
                            </div>
                        </div>

                        {/* App Preferences Section */}
                        <div className="divider">App Preferences</div>
                        <div className="card bg-base-200 border border-base-content/5">
                            <div className="card-body p-4 flex-row items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-sm">Run at Startup</h3>
                                    <p className="text-xs opacity-60">Automatically launch CampusDash when you log in</p>
                                </div>
                                <input
                                    type="checkbox"
                                    className="toggle toggle-primary"
                                    checked={runAtStartup}
                                    onChange={(e) => toggleStartup(e.target.checked)}
                                />
                            </div>
                        </div>

                        {/* Data Management Section */}
                        <div className="divider">Data Management</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Backup Card */}
                            <div className="bg-base-200 rounded-xl p-4 flex flex-col gap-3 border border-base-content/5">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        <Save size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm">Backup Local Data</h3>
                                        <p className="text-xs opacity-60">Save your data to a file</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline btn-primary mt-auto"
                                    onClick={async (e) => {
                                        e.preventDefault();
                                        // @ts-ignore
                                        const res = await window.electronAPI.backup.export();
                                        if (res && res.success) {
                                            showNotification('Local Backup Successful!', 'success');
                                        } else if (res && res.error) {
                                            showNotification('Backup Failed: ' + res.error, 'error');
                                        }
                                    }}
                                >
                                    Backup Now
                                </button>
                            </div>

                            {/* Restore Card */}
                            <div className="bg-base-200 rounded-xl p-4 flex flex-col gap-3 border border-base-content/5">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-error/10 rounded-lg text-error">
                                        <RefreshCw size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm">Restore Local Data</h3>
                                        <p className="text-xs opacity-60">Replace current data from file</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline btn-error mt-auto text-error hover:text-white"
                                    onClick={async (e) => {
                                        e.preventDefault();
                                        if (confirm('WARNING: Restoring will OVERWRITE all current data. The app will restart automatically. Continue?')) {
                                            // @ts-ignore
                                            const res = await window.electronAPI.backup.import();
                                            if (res && !res.success && res.error) {
                                                showNotification('Restore Failed: ' + res.error, 'error');
                                            }
                                        }
                                    }}
                                >
                                    Restore from File
                                </button>
                            </div>

                            {/* Google Drive Backup Card */}
                            <GoogleDriveCard />
                        </div>

                        <div className="card-actions justify-end mt-4">
                            <button type="submit" className="btn btn-primary gap-2">
                                <Save size={18} />
                                Save Changes
                            </button>
                        </div>


                    </form>
                </div>
            </div>
        </div>
    );
};

export default Settings;
