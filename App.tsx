import React, { useState, useEffect, useCallback } from 'react';
import { GiscusConfig, Discussion, UserSession } from './types';
import { fetchDiscussion, createDiscussion, fetchViewer, addComment, addReply, toggleReaction } from './services/githubService';
import { summarizeComments } from './services/geminiService';
import { Comment } from './components/Comment';
import { Composer } from './components/Composer';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';

const BOT_TOKEN = process.env.REACT_APP_GITHUB_BOT_TOKEN || process.env.GITHUB_TOKEN || '';

const App: React.FC = () => {
  // 1. Initialize Config from URL params (Iframe mode) or Defaults
  const [config, setConfig] = useState<GiscusConfig>(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      repo: params.get('repo') || '',
      repoId: params.get('repoId') || '',
      category: params.get('category') || '',
      categoryId: params.get('categoryId') || '',
      term: params.get('term') || 'Welcome to Gist-Cus',
      theme: params.get('theme') || 'light',
      reactionsEnabled: params.get('reactionsEnabled') === '1',
      emitMetadata: params.get('emitMetadata') === '1',
      strict: params.get('strict') === '1',
    };
  });

  // 2. Load Theme CSS
  useEffect(() => {
    const theme = config.theme;
    if (!theme) return;

    // Remove existing theme link
    const existingLink = document.getElementById('giscus-theme');
    if (existingLink) existingLink.remove();

    // Map common Giscus themes to CSS files or define vars
    const link = document.createElement('link');
    link.id = 'giscus-theme';
    link.rel = 'stylesheet';
    
    // In a real deployment, these would point to hosted CSS files like https://giscus.app/themes/dark.css
    // For this demo, we can just use the config to toggle a class on the HTML element if we had local themes,
    // or load the actual Giscus CDN themes which are compatible with our variable structure.
    if (theme.startsWith('http')) {
        link.href = theme;
    } else {
        link.href = `https://giscus.app/themes/${theme}.css`;
    }
    
    document.head.appendChild(link);
  }, [config.theme]);
  
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Reply State
  const [replyTo, setReplyTo] = useState<{ id: string, author: string } | null>(null);
  
  // AI Summary State
  const [summary, setSummary] = useState<string>('');
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Initial Data Load
  const loadData = useCallback(async () => {
    const tokenToUse = session?.token || BOT_TOKEN;

    if (!tokenToUse) {
       setError("Configuration Error: No Token available. If hosting, set GITHUB_TOKEN.");
       setInitLoading(false);
       return;
    }

    if (!config.repo) {
       setError("Configuration Error: Missing 'repo' parameter.");
       setInitLoading(false);
       return;
    }

    try {
      setInitLoading(true);
      const data = await fetchDiscussion(config, tokenToUse);
      setDiscussion(data);
      // If data is null here, it means no discussion exists yet. 
      // We do NOT show an error, we just show "0 comments".
      // We will create the discussion when the first comment is posted.
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load discussion.");
    } finally {
      setInitLoading(false);
    }
  }, [config, session]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogin = async (token: string) => {
    try {
      const user = await fetchViewer(token);
      if (user) {
        setSession({ token, user, isGuest: false });
        setError(null);
      } else {
        alert("Invalid Token");
      }
    } catch (e) {
      alert("Failed to login with token");
    }
  };

  const handleLogout = () => {
    setSession(null);
  };

  const handlePostComment = async (text: string, guestInfo?: { nickname: string, website?: string, email?: string }) => {
    setLoading(true);
    try {
      let body = text;
      let token = session?.token;

      // Guest Logic
      if (!token && guestInfo) {
        token = BOT_TOKEN;
        if (!token) throw new Error("Guest posting is disabled (Server config error).");
        
        const websiteLink = guestInfo.website ? `[Website](${guestInfo.website})` : '';
        const emailLink = guestInfo.email ? ` • [Email](mailto:${guestInfo.email})` : '';
        body = `${text}\n\n<sub>Guest posting by **${guestInfo.nickname}** ${websiteLink}${emailLink}</sub>`;
      }

      if (!token) throw new Error("Authentication required.");

      // 1. Ensure Discussion Exists
      let targetDiscussionId = discussion?.id;

      if (!targetDiscussionId) {
          // Automatic Creation
          if (!config.repoId || !config.categoryId) {
              throw new Error("Cannot create discussion: Missing repoId or categoryId in configuration.");
          }
          const newDisc = await createDiscussion(config, token);
          if (!newDisc) throw new Error("Failed to create discussion.");
          targetDiscussionId = newDisc.id;
          // Optimistically set discussion to avoid full reload flickering
          setDiscussion(newDisc); 
      }

      // 2. Post Comment or Reply
      if (replyTo) {
          await addReply(replyTo.id, body, token);
      } else {
          await addComment(targetDiscussionId, body, token);
      }
      
      // Reset and Reload
      setReplyTo(null);
      await loadData();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!discussion?.comments.nodes) return;
    setLoadingSummary(true);
    const result = await summarizeComments(discussion.comments.nodes);
    setSummary(result);
    setLoadingSummary(false);
  };

  return (
    <div className="w-full mx-auto p-2 min-h-[300px]">
      
      {/* Error Banner */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 flex items-center gap-2 text-sm">
            <AlertCircle size={16} />
            {error}
        </div>
      )}

      {/* Composer Area */}
      <Composer 
          session={session} 
          onLogin={handleLogin}
          onLogout={handleLogout}
          onSubmit={handlePostComment}
          loading={loading}
          contextComments={discussion?.comments.nodes || []}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
      />

      {/* Stats & Actions */}
      {discussion && discussion.comments.totalCount > 0 && (
          <div className="flex items-center justify-between mb-4 px-1">
             <span className="text-sm font-semibold text-text-primary">
                 {discussion.comments.totalCount} Comments
             </span>
             <button 
                onClick={handleGenerateSummary}
                disabled={loadingSummary}
                className="flex items-center gap-1.5 text-xs font-medium text-btn-primary hover:opacity-80 transition-opacity"
             >
                {loadingSummary ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12} />}
                {summary ? 'Refresh Summary' : 'Summarize'}
             </button>
          </div>
      )}

      {/* AI Summary */}
      {summary && (
        <div className="mb-6 p-4 bg-canvas-overlay border border-border-default rounded-lg animate-in fade-in shadow-sm">
            <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-2">
                <Sparkles size={12} /> AI Summary
            </h4>
            <div className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
                {summary}
            </div>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-0">
          {initLoading ? (
            <div className="flex justify-center py-10">
                <Loader2 size={32} className="animate-spin text-border-muted" />
            </div>
          ) : (
            <>
                {discussion?.comments.nodes.map(comment => (
                    <Comment 
                        key={comment.id} 
                        comment={comment} 
                        currentUser={session?.user}
                        onReact={(id, content) => toggleReaction(id, content, session?.token || BOT_TOKEN)}
                        onReply={(id, author) => {
                            setReplyTo({ id, author });
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                    />
                ))}

                {(!discussion || discussion.comments.totalCount === 0) && !error && (
                    <div className="text-center py-12 border border-dashed border-border-default rounded-lg">
                        <p className="text-text-secondary text-sm">No comments yet. Start the conversation!</p>
                    </div>
                )}
            </>
          )}
      </div>

      <div className="mt-8 text-center border-t border-border-muted pt-4">
        <a href="https://github.com/cirnovsky/glog" target="_blank" rel="noreferrer" className="text-[10px] text-text-secondary hover:underline">
            Powered by Gist-Cus
        </a>
      </div>
    </div>
  );
};

export default App;
