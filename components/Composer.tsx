import React, { useState, useEffect } from 'react';
import { UserSession, LoginMode, CommentNode } from '../types';
import { Send, Github, Sparkles, Loader2, Clock, X } from 'lucide-react';
import { suggestReply } from '../services/geminiService';

interface ComposerProps {
  session: UserSession | null;
  onLogin: (token: string) => void;
  onLogout: () => void;
  // If replyToId is present, we are in reply mode
  replyTo: { id: string, author: string } | null;
  onCancelReply: () => void;
  onSubmit: (text: string, guestInfo?: { nickname: string, website?: string, email?: string }) => Promise<void>;
  loading: boolean;
  contextComments: CommentNode[];
}

export const Composer: React.FC<ComposerProps> = ({ 
    session, onLogin, onLogout, onSubmit, loading, contextComments, replyTo, onCancelReply 
}) => {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<LoginMode>(LoginMode.GUEST);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState(''); 
  const [guestWebsite, setGuestWebsite] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string>('');
  const [suggesting, setSuggesting] = useState(false);
  
  // Security: Rate Limiting & Honeypot
  const [cooldown, setCooldown] = useState(0);
  const [honeypot, setHoneypot] = useState('');

  useEffect(() => {
    if (session?.user) {
      setMode(LoginMode.GITHUB);
    }
  }, [session]);

  useEffect(() => {
    const checkCooldown = () => {
        const lastPost = localStorage.getItem('giscus_last_post');
        if (lastPost) {
            const diff = Date.now() - parseInt(lastPost, 10);
            if (diff < 60000) { 
                setCooldown(Math.ceil((60000 - diff) / 1000));
            } else {
                setCooldown(0);
            }
        }
    };
    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || cooldown > 0) return;
    if (honeypot) return; // Silent fail for bots

    if (!text.trim()) return;
    
    if (mode === LoginMode.GUEST) {
        if (!guestName.trim()) {
            alert("Please enter a nickname.");
            return;
        }
    }

    await onSubmit(text, mode === LoginMode.GUEST ? { nickname: guestName, website: guestWebsite, email: guestEmail } : undefined);
    
    localStorage.setItem('giscus_last_post', Date.now().toString());
    setCooldown(60);
    setText('');
    setAiSuggestion('');
  };

  const handleGetSuggestion = async () => {
    setSuggesting(true);
    const suggestion = await suggestReply(contextComments, text);
    setAiSuggestion(suggestion);
    setSuggesting(false);
  };

  const applySuggestion = () => {
    setText(prev => prev + (prev ? " " : "") + aiSuggestion);
    setAiSuggestion('');
  };

  return (
    <div className="bg-canvas-default rounded-lg border border-border-default overflow-hidden mb-6">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-canvas-overlay border-b border-border-muted">
        <div className="flex items-center gap-4">
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-md p-1">
                <button 
                    onClick={() => setMode(LoginMode.GUEST)}
                    disabled={!!session?.user}
                    className={`px-3 py-1 text-xs font-medium rounded transition-all ${mode === LoginMode.GUEST ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Guest
                </button>
                <button 
                    onClick={() => setMode(LoginMode.GITHUB)}
                    className={`px-3 py-1 text-xs font-medium rounded transition-all ${mode === LoginMode.GITHUB ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    GitHub
                </button>
            </div>
        </div>
        
        {session?.user ? (
            <div className="flex items-center gap-2">
                 <img src={session.user.avatarUrl} alt="avatar" className="w-5 h-5 rounded-full" />
                 <span className="text-xs text-text-secondary font-medium">Logged in</span>
                 <button onClick={onLogout} className="text-xs text-red-500 hover:underline">Sign out</button>
            </div>
        ) : mode === LoginMode.GITHUB && (
            <button 
                onClick={() => setShowTokenInput(!showTokenInput)}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
                <Github size={12} />
                Connect GitHub
            </button>
        )}
      </div>

      <div className="p-4 bg-canvas-default">
        {/* Reply Indicator */}
        {replyTo && (
            <div className="flex items-center justify-between mb-3 px-3 py-2 bg-blue-50 text-blue-800 rounded border border-blue-100 text-sm">
                <span>Replying to <strong>{replyTo.author}</strong></span>
                <button onClick={onCancelReply} className="text-blue-400 hover:text-blue-600">
                    <X size={14} />
                </button>
            </div>
        )}

        {/* Security: Honeypot */}
        <input type="text" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} className="hidden" />

        {/* Guest Fields */}
        {mode === LoginMode.GUEST && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <input 
                    type="text" 
                    placeholder="Nickname (required)" 
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    maxLength={50}
                    className="w-full px-3 py-2 bg-canvas-overlay border border-border-default rounded text-sm text-text-primary focus:outline-none focus:border-btn-primary"
                />
                <input 
                    type="email" 
                    placeholder="Email (optional)" 
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-canvas-overlay border border-border-default rounded text-sm text-text-primary focus:outline-none focus:border-btn-primary"
                />
                <input 
                    type="url" 
                    placeholder="Website (optional)" 
                    value={guestWebsite}
                    onChange={(e) => setGuestWebsite(e.target.value)}
                    className="w-full sm:col-span-2 px-3 py-2 bg-canvas-overlay border border-border-default rounded text-sm text-text-primary focus:outline-none focus:border-btn-primary"
                />
            </div>
        )}

        {/* Token Input */}
        {mode === LoginMode.GITHUB && !session?.user && showTokenInput && (
             <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-100">
                <p className="text-xs text-blue-800 mb-2">
                    Enter Personal Access Token (repo, discussion:write).
                </p>
                <div className="flex gap-2">
                    <input 
                        type="password"
                        placeholder="ghp_..."
                        value={tokenInput}
                        onChange={(e) => setTokenInput(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-blue-200 rounded focus:outline-none"
                    />
                    <button 
                        onClick={() => onLogin(tokenInput)}
                        className="px-4 py-2 bg-btn-primary text-btn-text text-xs font-medium rounded"
                    >
                        Login
                    </button>
                </div>
             </div>
        )}

        {/* Text Area */}
        <div className="relative">
            <textarea 
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={mode === LoginMode.GUEST ? "Write as a guest..." : "Write a comment..."}
                disabled={loading || cooldown > 0}
                className="w-full h-32 p-3 text-sm text-text-primary bg-canvas-overlay border border-border-default rounded focus:outline-none focus:ring-1 focus:ring-btn-primary resize-y"
            />
             <div className="absolute bottom-3 right-3">
                 <button
                    type="button"
                    onClick={handleGetSuggestion}
                    disabled={loading || suggesting || !contextComments.length}
                    className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                 >
                    {suggesting ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12} />}
                    {suggesting ? 'Thinking...' : 'AI Assist'}
                 </button>
             </div>
        </div>

        {aiSuggestion && (
            <div className="mt-2 p-3 bg-purple-50 border border-purple-100 rounded flex items-start justify-between gap-4">
                <div className="text-sm text-purple-900 italic">"{aiSuggestion}"</div>
                <button onClick={applySuggestion} className="text-xs font-bold text-purple-700 shrink-0">Apply</button>
            </div>
        )}

        <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-text-secondary flex items-center gap-1">
                {cooldown > 0 ? (
                    <span className="text-orange-500 font-medium flex items-center gap-1">
                        <Clock size={12} /> {cooldown}s cooldown
                    </span>
                ) : (
                    "Markdown supported."
                )}
            </span>
            <button
                onClick={handleSubmit}
                disabled={loading || cooldown > 0 || (mode === LoginMode.GITHUB && !session?.user)}
                className="flex items-center gap-2 px-6 py-2 rounded font-medium text-sm bg-btn-primary text-btn-text hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {mode === LoginMode.GUEST ? 'Post Guest Comment' : 'Comment'}
            </button>
        </div>
      </div>
    </div>
  );
};
