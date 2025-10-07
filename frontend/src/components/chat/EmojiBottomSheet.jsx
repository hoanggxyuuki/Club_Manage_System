import React from 'react';
import { X } from 'lucide-react';
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

const EmojiBottomSheet = ({ isOpen, onClose, onEmojiSelect }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-30 z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl 
                      transform transition-transform duration-300 ease-out">
        
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Choose Emoji</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Quick emoji row */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-center gap-3 mb-4">
            {['😀', '😍', '🤔', '👍', '👎', '❤️', '😂', '😮'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onEmojiSelect({ native: emoji });
                  onClose();
                }}
                className="text-3xl p-3 hover:bg-gray-100 rounded-2xl 
                         transition-all duration-150 transform hover:scale-110 active:scale-95 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                         min-w-[3rem] min-h-[3rem] flex items-center justify-center"
                title={`Add ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
        
        {/* Full emoji picker */}
        <div className="px-4 py-2 max-h-[50vh] overflow-hidden">
          <Picker
            data={data}
            onEmojiSelect={(emoji) => {
              onEmojiSelect(emoji);
              onClose();
            }}
            theme="light"
            previewPosition="none"
            skinTonePosition="none"
            searchPosition="top"
            maxFrequentRows={2}
            perLine={8}
            set="native"
            emojiSize={22}
            emojiButtonSize={40}
            autoFocus={false}
          />
        </div>
        
        {/* Safe area padding */}
        <div className="h-6"></div>
      </div>
    </>
  );
};

export default EmojiBottomSheet;
