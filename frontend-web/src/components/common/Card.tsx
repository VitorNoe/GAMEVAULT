import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  hoverable = false,
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
  };

  const hoverClass = hoverable ? 'hover:shadow-lg transition-shadow cursor-pointer' : '';

  return (
    <div className={`bg-white rounded-lg shadow-md ${paddingClasses[padding]} ${hoverClass} ${className}`}>
      {children}
    </div>
  );
};
