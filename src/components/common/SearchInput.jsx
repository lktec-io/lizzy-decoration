import { FiSearch } from 'react-icons/fi';
import '../../styles/components/SearchInput.css';

function SearchInput({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="search-input">
      <FiSearch className="search-input-icon" aria-hidden="true" />
      <input
        type="search"
        className="search-input-field"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  );
}

export default SearchInput;
