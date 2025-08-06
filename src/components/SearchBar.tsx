import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { validateCaption } from '@/utils/inputValidation';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  placeholder = "Search by keyword, price, or index..." 
}) => {
  const [query, setQuery] = useState('');
  const [isValid, setIsValid] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      onSearch(query);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Basic validation to prevent XSS in search queries
    const validation = validateCaption(value || ' '); // Use space as fallback for empty queries
    setIsValid(validation.isValid || value === ''); // Allow empty queries
    setQuery(value);
    
    if (validation.isValid || value === '') {
      onSearch(value); // Real-time search only for valid queries
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          className={`pl-10 glass-card border-border/50 focus:border-primary/50 ${
            !isValid ? 'border-destructive focus:border-destructive' : ''
          }`}
        />
        {!isValid && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-destructive text-xs">
            Invalid input
          </div>
        )}
      </div>
    </form>
  );
};

export default SearchBar;