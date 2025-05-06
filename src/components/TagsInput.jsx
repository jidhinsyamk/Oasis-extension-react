import React, { useState, useRef, useEffect } from "react";

const TagsInput = ({ tags, setTags }) => {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const addTag = (tagText) => {
    const trimmedTag = tagText.trim();
    if (
      trimmedTag &&
      !tags.includes(trimmedTag) &&
      !trimmedTag.includes(" ") // Only allow single-word tags
    ) {
      setTags([...tags, trimmedTag]);
      setInputValue("");
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.borderRadius =
        tags.length > 3 ? "12px" : "30px";
    }
  }, [tags]);

  return (
    <div
      ref={containerRef}
      className="w-full min-h-[38px] px-1 py-1 transition-all duration-200 flex flex-wrap items-center gap-1.5 focus-within:shadow-[inset_0_0_7px_rgba(255,255,255,0.21),inset_0_-3px_4px_rgba(255,255,255,0)] focus-within:backdrop-blur-sm"
      style={{
        border: "1px solid transparent",
        borderRadius: tags.length > 3 ? "12px" : "9999px",
        background:
          "linear-gradient(#0E141A, #0E141A) padding-box, linear-gradient(360deg, rgba(255,255,255,0.02), rgba(230,246,255,0.1)) border-box",
      }}
    >
      {tags.map((tag) => (
        <div
          key={tag}
          className="flex items-center bg-[rgba(20,28,36,1)] border border-gray-700 rounded-full px-3 py-1 text-sm"
        >
          {tag}
          <span
            className="ml-1.5 text-gray-400 text-sm cursor-pointer hover:text-white"
            onClick={() => removeTag(tag)}
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
        // onBlur={handleBlur}
        className="flex-grow min-w-[100px] bg-transparent border-none text-white px-2 text-sm outline-none  custom-placeholder"
        placeholder={tags.length === 0 ? "e.g. Blog, Dark Theme, Modern" : ""}
      />
    </div>
  );
};

export default TagsInput;
