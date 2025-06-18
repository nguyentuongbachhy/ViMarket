export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onSearch?: (query: string) => void;
    loading?: boolean;
    suggestions?: string[];
    showSuggestions?: boolean;
    onSuggestionSelect?: (suggestion: string) => void;
}
