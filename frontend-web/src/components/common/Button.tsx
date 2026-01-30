import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children?: React.ReactNode;
}

const VARIANT_STYLES = {
  primary: 'bg-gradient-to-r from-primary-500 to-primary-400 text-white hover:shadow-lg hover:shadow-primary-500/30 focus:ring-primary-400',
  secondary: 'bg-transparent text-white border-2 border-primary-400 hover:bg-primary-500/20 focus:ring-primary-400',
  danger: 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:shadow-lg hover:shadow-red-500/30 focus:ring-red-400',
  ghost: 'bg-transparent text-gray-300 hover:bg-white/10 hover:text-white focus:ring-gray-500',
} as const;

const SIZE_STYLES = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
} as const;

const BASE_STYLES = 'font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-200 disabled:opacity-50 disabled:cursor-not-allowed';

const ButtonComponent: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled,
  className = '',
  type = 'button',
  onClick,
}) => {
  const isDisabled = disabled || loading;

  const buttonClassName = useMemo(() => {
    const widthClass = fullWidth ? 'w-full' : '';
    return `${BASE_STYLES} ${VARIANT_STYLES[variant]} ${SIZE_STYLES[size]} ${widthClass} ${className}`;
  }, [variant, size, fullWidth, className]);

  return (
    <motion.button
      whileHover={isDisabled ? undefined : { scale: 1.02, y: -2 }}
      whileTap={isDisabled ? undefined : { scale: 0.98 }}
      className={buttonClassName}
      disabled={isDisabled}
      type={type}
      onClick={onClick}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Loading...</span>
        </span>
      ) : children}
    </motion.button>
  );
};

export const Button = memo(ButtonComponent);
