import React, { memo } from 'react';
import { motion } from 'framer-motion';

import { RELEASE_STATUS_LABELS, AVAILABILITY_STATUS_LABELS } from '../../utils/constants';

interface FiltersState {
    search?: string;
    release_status?: string;
    availability_status?: string;
    year?: number | '';
    sort?: string;
    order?: 'ASC' | 'DESC';
}

interface FiltersPanelProps {
    filters: FiltersState;
    onFilterChange: (filters: FiltersState) => void;
    showSearch?: boolean;
    showReleaseStatus?: boolean;
    showAvailabilityStatus?: boolean;
    showYear?: boolean;
    showSort?: boolean;
}

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 50 }, (_, i) => currentYear - i);

const SORT_OPTIONS = [
    { value: 'title', label: 'Title' },
    { value: 'release_year', label: 'Release Year' },
    { value: 'average_rating', label: 'Rating' },
    { value: 'metacritic_score', label: 'Metacritic' },
    { value: 'created_at', label: 'Date Added' },
];

const FiltersPanelComponent: React.FC<FiltersPanelProps> = ({
    filters,
    onFilterChange,
    showSearch = true,
    showReleaseStatus = true,
    showAvailabilityStatus = true,
    showYear = true,
    showSort = true,
}) => {
    const update = (partial: Partial<FiltersState>) => {
        onFilterChange({ ...filters, ...partial });
    };

    const clearFilters = () => {
        onFilterChange({ search: '', release_status: '', availability_status: '', year: '', sort: '', order: 'DESC' });
    };

    const hasActiveFilters = filters.release_status || filters.availability_status || filters.year || filters.sort;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4 rounded-xl mb-6"
        >
            <div className="flex flex-wrap items-end gap-4">
                {showSearch && (
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Search</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
                            <input
                                type="text"
                                value={filters.search || ''}
                                onChange={(e) => update({ search: e.target.value })}
                                placeholder="Search games..."
                                className="input pl-10 w-full"
                            />
                        </div>
                    </div>
                )}

                {showReleaseStatus && (
                    <div className="min-w-[160px]">
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Status</label>
                        <select
                            value={filters.release_status || ''}
                            onChange={(e) => update({ release_status: e.target.value })}
                            className="input w-full bg-dark-200 text-white"
                        >
                            <option value="">All Statuses</option>
                            {Object.entries(RELEASE_STATUS_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </div>
                )}

                {showAvailabilityStatus && (
                    <div className="min-w-[160px]">
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Availability</label>
                        <select
                            value={filters.availability_status || ''}
                            onChange={(e) => update({ availability_status: e.target.value })}
                            className="input w-full bg-dark-200 text-white"
                        >
                            <option value="">All</option>
                            {Object.entries(AVAILABILITY_STATUS_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </div>
                )}

                {showYear && (
                    <div className="min-w-[120px]">
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Year</label>
                        <select
                            value={filters.year || ''}
                            onChange={(e) => update({ year: e.target.value ? Number(e.target.value) : '' })}
                            className="input w-full bg-dark-200 text-white"
                        >
                            <option value="">All Years</option>
                            {yearOptions.map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                )}

                {showSort && (
                    <div className="min-w-[140px]">
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Sort</label>
                        <div className="flex gap-1">
                            <select
                                value={filters.sort || ''}
                                onChange={(e) => update({ sort: e.target.value })}
                                className="input flex-1 bg-dark-200 text-white"
                            >
                                <option value="">Default</option>
                                {SORT_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => update({ order: filters.order === 'ASC' ? 'DESC' : 'ASC' })}
                                className="px-2 py-1 rounded-lg bg-dark-300 text-gray-400 hover:text-white transition-colors"
                                title={filters.order === 'ASC' ? 'Ascending' : 'Descending'}
                            >
                                {filters.order === 'ASC' ? '↑' : '↓'}
                            </motion.button>
                        </div>
                    </div>
                )}

                {hasActiveFilters && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={clearFilters}
                        className="px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                        ✕ Clear
                    </motion.button>
                )}
            </div>
        </motion.div>
    );
};

export const FiltersPanel = memo(FiltersPanelComponent);
