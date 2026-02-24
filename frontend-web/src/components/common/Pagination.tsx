import React, { memo } from 'react';
import { motion } from 'framer-motion';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const PaginationComponent: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const getVisiblePages = (): (number | '...')[] => {
        const pages: (number | '...')[] = [];
        const delta = 2;

        pages.push(1);

        const start = Math.max(2, currentPage - delta);
        const end = Math.min(totalPages - 1, currentPage + delta);

        if (start > 2) pages.push('...');
        for (let i = start; i <= end; i++) pages.push(i);
        if (end < totalPages - 1) pages.push('...');

        if (totalPages > 1) pages.push(totalPages);

        return pages;
    };

    return (
        <nav className="flex items-center justify-center gap-2 mt-8" aria-label="Pagination">
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 
          disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
            >
                ← Prev
            </motion.button>

            <div className="flex items-center gap-1">
                {getVisiblePages().map((page, idx) =>
                    page === '...' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 py-2 text-gray-500">
                            …
                        </span>
                    ) : (
                        <motion.button
                            key={page}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onPageChange(page)}
                            className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all ${page === currentPage
                                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                                }`}
                            aria-current={page === currentPage ? 'page' : undefined}
                        >
                            {page}
                        </motion.button>
                    )
                )}
            </div>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 
          disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
            >
                Next →
            </motion.button>
        </nav>
    );
};

export const Pagination = memo(PaginationComponent);
