import { useState, useRef, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  users: User[];
  onSend: () => void;
}

export const MentionInput = ({ value, onChange, users, onSend }: MentionInputProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const lastWord = value.split(' ').pop() || '';
    if (lastWord.startsWith('@') && lastWord.length > 1) {
      const query = lastWord.slice(1).toLowerCase();
      const filtered = users.filter(u => 
        u.username.toLowerCase().includes(query) ||
        u.firstName.toLowerCase().includes(query) ||
        u.lastName.toLowerCase().includes(query)
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setSelectedIndex(0);
    } else {
      setShowSuggestions(false);
    }
  }, [value, users]);

  const insertMention = (user: User) => {
    const words = value.split(' ');
    words[words.length - 1] = `@${user.username} `;
    onChange(words.join(' '));
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((selectedIndex + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((selectedIndex - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        insertMention(suggestions[selectedIndex]);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Сообщение... (@username для упоминания)"
        className="w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 resize-none"
        rows={1}
      />
      {showSuggestions && (
        <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((user, index) => (
            <button
              key={user.id}
              onClick={() => insertMention(user)}
              className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                index === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <div className="font-semibold">@{user.username}</div>
              <div className="text-sm text-gray-500">{user.firstName} {user.lastName}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
