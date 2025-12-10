import React from 'react';
import { APP_NAME } from '../../utils/constants';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-sm">
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Game Management and Preservation Platform
          </p>
        </div>
      </div>
    </footer>
  );
};
