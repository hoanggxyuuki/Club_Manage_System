import React from "react";
import { ExternalLink } from "lucide-react";
import MultiUrlPreview from "../common/MultiUrlPreview";

export const ChatUrlPreview = ({ message }) => {
  if (!message) return null;

  
  const isOnlyUrl = /^https?:\/\/\S+$/.test(message.trim());
  if (isOnlyUrl) {
    return (
      <a
        href={message}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center text-blue-500 hover:text-blue-600 hover:underline break-all text-sm"
      >
        <ExternalLink size={14} className="mr-1" />
        {message}
      </a>
    );
  }

  
};
