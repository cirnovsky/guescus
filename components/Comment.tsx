import React from 'react';
import { CommentNode, GitHubUser } from '../types';
import { formatDate, parseGuestAuthor, linkify } from '../utils/format';
import { MessageSquare, Smile } from 'lucide-react';

interface CommentProps {
  comment: CommentNode;
  currentUser?: GitHubUser;
  onReply: (id: string, author: string) => void;
  onReact: (id: string, content: string) => void;
  isReply?: boolean;
}

const REACTIONS = [
  { label: '👍', value: 'THUMBS_UP' },
  { label: '👎', value: 'THUMBS_DOWN' },
  { label: '❤️', value: 'HEART' },
  { label: '🎉', value: 'HOORAY' },
  { label: '😂', value: 'LAUGH' },
  { label: '🚀', value: 'ROCKET' },
  { label: '👀', value: 'EYES' },
];

export const Comment: React.FC<CommentProps> = ({ comment, currentUser, onReply, onReact, isReply = false }) => {
  const { name, isGuest, cleanBody } = parseGuestAuthor(comment.body, comment.author?.login || 'Deleted User');
  
  const avatarUrl = isGuest 
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
    : comment.author?.avatarUrl || 'https://github.com/ghost.png';

  const formattedContent = linkify(cleanBody).map((item) => {
    if (item.type === 'link') {
      return (
        <a key={item.key} href={item.content} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
          {item.content}
        </a>
      );
    }
    return <span key={item.key}>{item.content}</span>;
  });

  return (
    <div className={`flex gap-3 p-4 animate-in fade-in duration-500 ${isReply ? 'ml-8 mt-2 bg-gray-50/50 rounded-lg' : 'border-b border-border-muted'}`}>
      <img src={avatarUrl} alt={name} className="w-8 h-8 rounded-full border border-border-default object-cover shrink-0 mt-1" />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <a href={comment.author?.url || '#'} target="_blank" rel="noopener noreferrer" className="font-semibold text-text-primary hover:underline text-sm">
              {name}
            </a>
            {isGuest && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                Guest
              </span>
            )}
            <span className="text-xs text-text-secondary">
              {formatDate(comment.createdAt)}
            </span>
          </div>
        </div>

        <div className="text-text-primary text-sm leading-relaxed whitespace-pre-wrap break-words mb-2">
            {formattedContent}
        </div>

        <div className="flex items-center gap-3">
            {/* Reactions */}
            <div className="flex items-center gap-1">
                {REACTIONS.map(reaction => {
                    const group = comment.reactionGroups.find(g => g.content === reaction.value);
                    const count = group?.users.totalCount || 0;
                    const reacted = group?.viewerHasReacted || false;
                    
                    if (count === 0 && !reacted) return null;

                    return (
                        <button 
                            key={reaction.value}
                            onClick={() => onReact(comment.id, reaction.value)}
                            className={`reaction-btn flex items-center gap-1 px-1.5 py-0.5 text-xs ${reacted ? 'reacted' : ''}`}
                            title={reaction.value}
                        >
                            <span>{reaction.label}</span>
                            <span>{count}</span>
                        </button>
                    );
                })}

                <div className="relative group">
                    <button className="text-text-secondary hover:text-text-primary p-1">
                        <Smile size={14} />
                    </button>
                    {/* Hover Reaction Picker */}
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-lg rounded-lg p-1 hidden group-hover:flex gap-1 z-10">
                         {REACTIONS.map(r => (
                             <button key={r.value} onClick={() => onReact(comment.id, r.value)} className="hover:bg-gray-100 p-1 rounded text-lg">
                                 {r.label}
                             </button>
                         ))}
                    </div>
                </div>
            </div>

            {/* Reply Button - Only on top level comments typically, but we allow nested visual */}
            <button 
                onClick={() => onReply(comment.id, name)}
                className="flex items-center gap-1 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
                <MessageSquare size={14} />
                Reply
            </button>
        </div>

        {/* Replies */}
        {comment.replies.nodes.length > 0 && (
            <div className="mt-2 space-y-2">
                {comment.replies.nodes.map(reply => (
                    <Comment 
                        key={reply.id} 
                        comment={reply} 
                        currentUser={currentUser} 
                        onReply={onReply}
                        onReact={onReact}
                        isReply={true}
                    />
                ))}
            </div>
        )}
      </div>
    </div>
  );
};
