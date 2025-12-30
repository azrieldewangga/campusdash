import { Search, Plus, X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import SearchResults from './SearchResults';
import { useState } from 'react';

const TopBar = () => {
    const { setQuickAddOpen } = useStore();
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <div className="navbar bg-base-100 border-b border-base-content/10 h-16 min-h-[4rem] px-4">
            <div className="flex-1">
                {/* Global Search */}
                <div className="relative w-full max-w-md hidden md:block">
                    <input
                        type="text"
                        placeholder="Cari tugas, matkul..."
                        className="input input-sm input-bordered w-full pl-10 rounded-full bg-base-200 focus:bg-base-100 transition-all font-normal"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-xs btn-circle btn-ghost"
                        >
                            <X size={14} />
                        </button>
                    )}

                    {searchQuery && <SearchResults query={searchQuery} closeSearch={() => setSearchQuery('')} />}
                </div>
            </div>

            <div className="flex-none gap-2">
                <button
                    onClick={() => setQuickAddOpen(true)}
                    className="btn btn-sm btn-primary gap-2 rounded-half normal-case px-4 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
                >
                    <Plus size={16} />
                    Quick Add
                </button>
            </div>
        </div>
    );
};

export default TopBar;
