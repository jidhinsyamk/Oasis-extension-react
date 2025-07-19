import React, { useState, useRef, useEffect, useCallback } from "react";

const TagsInput = ({ tags, setTags, className = '' }) => {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const addTag = useCallback((tagText) => {
    const trimmedTag = tagText.trim();
    if (
      trimmedTag &&
      !tags.includes(trimmedTag) &&
      !trimmedTag.includes(" ")  
    ) {
      setTags(prevTags => [...prevTags, trimmedTag]);
      setInputValue("");
    }
  }, [tags, setTags]);

  const removeTag = useCallback((tagToRemove) => {
    setTags(prevTags => prevTags.filter((tag) => tag !== tagToRemove));
    inputRef.current?.focus();
  }, [setTags]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }, [inputValue, tags, addTag, removeTag]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.borderRadius = tags.length > 3 ? "12px" : "30px";
    }
  }, [tags]);

  return (
    <div
      ref={containerRef}
      className={`w-full min-h-[38px] px-[4px] py-[2px] transition-all duration-200 flex flex-wrap items-center gap-2 focus-within:shadow-[inset_0_0_7px_rgba(255,255,255,0.21),inset_0_-3px_4px_rgba(255,255,255,0)] ${className}`}
      style={{
        border: "1px solid transparent",
        background: "linear-gradient(#0E141A, #0E141A) padding-box, linear-gradient(360deg, rgba(255,255,255,0.02), rgba(230,246,255,0.1)) border-box",
      }}
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag) => (
        <div
          key={tag}
          className="flex items-center bg-[#141C24] border border-[#141C24] rounded-full px-3 py-1 text-sm"
        >
          {tag}
          <span
            className="ml-1.5 text-gray-400 text-sm cursor-pointer hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              removeTag(tag);
            }}
          >
            ×
          </span>
        </div>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-grow min-w-[100px] bg-transparent border-none text-white px-4 text-sm outline-none placeholder:text-[#8B9BAB]"
        placeholder={tags.length === 0 ? "e.g. Blog, Dark Theme, Modern" : ""}
      />
    </div>
  );
};

export default React.memo(TagsInput);