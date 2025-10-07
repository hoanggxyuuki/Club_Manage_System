import React, { useState,useEffect } from 'react';
import { Reply, X, Trash2, Plus,ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

const MobileBottomSheet = ({ 
  isOpen, 
  onClose, 
  message, 
  onReply, 
  onReact, 
  onDelete, 
  canDelete 
}) => {
  const [showFullEmojiPicker, setShowFullEmojiPicker] = useState(false);
    const [perLine, setPerLine] = useState(9);

  useEffect(() => {
    const calculatePerLine = () => {
      const screenWidth = window.innerWidth;
      
      if (screenWidth < 320) {
        setPerLine(6);  
      } else if (screenWidth < 375) {
        setPerLine(7);  
      } else if (screenWidth < 414) {
        setPerLine(9);  
      } else if (screenWidth < 768) {
        setPerLine(9);  
      } else if (screenWidth < 1024) {
        setPerLine(12); 
      } else {
        setPerLine(15); 
      }
    };

    calculatePerLine();
    window.addEventListener('resize', calculatePerLine);
    
    return () => window.removeEventListener('resize', calculatePerLine);
  }, []);
  const quickReactions = ['👍', '❤️', '😂', '😮', '😢'];

  const handleQuickReaction = (emoji) => {
    onReact(message._id, { native: emoji });
    onClose();
  };

  const handleFullEmojiSelect = (emoji) => {
    onReact(message._id, emoji);
    onClose();
  };

  if (!isOpen || !message) return null;

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
        
        {!showFullEmojiPicker ? (
          <>
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
            </div>

            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Message Actions</h3>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              {/* Message preview */}
              <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-700 line-clamp-2">
                  {message.content}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDistanceToNow(new Date(message.timestamp))} ago
                </p>
              </div>
            </div>

            {/* Quick Reactions Section */}
            <div className="px-6 py-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Chọn cảm xúc</h4>
              <div className="flex items-center gap-3">
                {quickReactions.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleQuickReaction(emoji)}
                    className="flex-1 aspect-square bg-gray-50 hover:bg-gray-100 rounded-2xl 
                             flex items-center justify-center text-2xl transition-all duration-150
                             hover:scale-105 active:scale-95 border border-gray-200"
                  >
                    {emoji}
                  </button>
                ))}
                
                {/* More emojis button */}
                <button
                  onClick={() => setShowFullEmojiPicker(true)}
                  className="flex-1 aspect-square bg-blue-50 hover:bg-blue-100 rounded-2xl 
                           flex items-center justify-center transition-all duration-150
                           hover:scale-105 active:scale-95 border border-blue-200"
                >
                  <Plus className="w-6 h-6 text-blue-600" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-6 py-4 space-y-3">
              <button
                onClick={() => {
                  onReply(message);
                  onClose();
                }}
                className="w-full flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 
                         rounded-xl transition-colors duration-150"
              >
                <div className="p-2 bg-blue-100 rounded-full">
                  <Reply className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-gray-900 font-medium">Trả lời tin nhắn</span>
              </button>

              {canDelete && (
                <button
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete this message?")) {
                      onDelete(message._id);
                      onClose();
                    }
                  }}
                  className="w-full flex items-center gap-4 p-4 bg-red-50 hover:bg-red-100 
                           rounded-xl transition-colors duration-150"
                >
                  <div className="p-2 bg-red-100 rounded-full">
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </div>
                  <span className="text-red-900 font-medium">Delete Message</span>
                </button>
              )}
            </div>
            
            {/* Safe area padding */}
            <div className="h-6"></div>
          </>
        ) : (
          <>
            {/* Full Emoji Picker */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
            </div>

            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowFullEmojiPicker(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-500" />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">Choose Reaction</h3>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="px-4 py-2 max-h-[50vh] overflow-hidden">
              <Picker
                data={data}
                onEmojiSelect={handleFullEmojiSelect}
                theme="light"
                previewPosition="none"
                skinTonePosition="none"
                searchPosition="top"
                maxFrequentRows={2}
                perLine={perLine}
                set="native"
                emojiSize={22}
                emojiButtonSize={40}
                autoFocus={false}
              />
            </div>
            
            <div className="h-6"></div>
          </>
        )}
      </div>
    </>
  );
};

export default MobileBottomSheet;