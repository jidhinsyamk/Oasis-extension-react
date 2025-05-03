import React, { useState, useRef, useEffect } from 'react';

const TagsInput = ({ tags, setTags }) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const addTag = (tagText) => {
    const trimmedTag = tagText.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) addTag(inputValue);
  };

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.borderRadius = tags.length > 3 ? '12px' : '30px';
    }
  }, [tags]);

  return (
    <div 
      ref={containerRef}
      className="w-full min-h-[38px] bg-gray-900 border border-gray-600 rounded-full px-3 py-1 transition-all flex items-center flex-wrap"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map(tag => (
          <div key={tag} className="flex items-center bg-gray-800 border border-gray-700 rounded-full px-3 py-1 text-sm">
            {tag}
            <span 
              className="ml-1.5 text-gray-400 text-sm cursor-pointer hover:text-white"
              onClick={() => removeTag(tag)}
            >
              ×
            </span>
          </div>
        ))}
      </div>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="flex-grow min-w-[100px] bg-transparent border-none text-white px-1 py-1 outline-none text-sm"
        placeholder={tags.length === 0 ? "e.g. Blog, Dark Theme, Modern" : ""}
      />
    </div>
  );
};

export default TagsInput;