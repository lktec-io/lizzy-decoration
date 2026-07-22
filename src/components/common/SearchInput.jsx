import { forwardRef } from 'react';
import { FiSearch } from 'react-icons/fi';
import '../../styles/components/SearchInput.css';

// forwardRef so callers that need to programmatically refocus the field
// (POS returning focus to search after adding a product) can — every
// existing caller that doesn't pass a ref is unaffected.
const SearchInput = forwardRef(({ value, onChange, placeholder = 'Search...' }, ref) => {
  return (
    <div className="search-input">
      <FiSearch className="search-input-icon" aria-hidden="true" />
      <input
        ref={ref}
        type="search"
        className="search-input-field"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  );
});

SearchInput.displayName = 'SearchInput';

export default SearchInput;
