import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showResultCount?: boolean;
  resultCount?: number;
  totalCount?: number;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Keresés...',
  className = '',
  showResultCount = false,
  resultCount = 0,
  totalCount = 0
}) => {
  const handleClear = () => {
    onChange('');
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-all"
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300 transition-colors"
            title="Keresés törlése"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      {showResultCount && value && (
        <div className="mt-2 text-sm text-gray-400">
          {resultCount === 0 ? (
            <span className="text-orange-400">Nincs találat</span>
          ) : (
            <span>
              <span className="text-blue-400 font-medium">{resultCount}</span> találat
              {totalCount > 0 && ` a(z) ${totalCount} elemből`}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
