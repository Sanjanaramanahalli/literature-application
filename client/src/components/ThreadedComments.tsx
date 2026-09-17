import React, { useState } from 'react';
import { MessageSquare, Reply, Trash2, Send } from 'lucide-react';
import './ThreadedComments.css';

export interface CommentUser {
  id: string;
  name: string;
  role: string;
}

export interface CommentReply {
  id: string;
  content: string;
  createdAt: string;
  user: CommentUser;
  userId: string;
}

export interface ThreadedComment {
  id: string;
  content: string;
  createdAt: string;
  user: CommentUser;
  userId: string;
  replies: CommentReply[];
}

interface ThreadedCommentsProps {
  literatureId: string;
  comments: ThreadedComment[];
  user: any;
  onCommentsUpdated: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const ThreadedComments: React.FC<ThreadedCommentsProps> = ({
  literatureId,
  comments,
  user,
  onCommentsUpdated,
  onOpenAuth,
}) => {
  // Top-level input
  const [topComment, setTopComment] = useState('');
  const [submittingTop, setSubmittingTop] = useState(false);

  // Active inline reply parent ID
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Error / message feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Post Top-level Comment
  const handlePostTopComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth('login');
      return;
    }

    if (!topComment.trim()) return;

    try {
      setSubmittingTop(true);
      setErrorMsg(null);
      const token = localStorage.getItem('literature_token');

      const res = await fetch(`/api/reader/literature/${literatureId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: topComment.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to post comment.');
      }

      setTopComment('');
      onCommentsUpdated();
    } catch (err: any) {
      console.error('Post comment error:', err);
      setErrorMsg(err.message || 'Failed to post reflection.');
    } finally {
      setSubmittingTop(false);
    }
  };

  // 2. Post 1-Level Deep Reply
  const handlePostReply = async (parentId: string) => {
    if (!user) {
      onOpenAuth('login');
      return;
    }

    if (!replyText.trim()) return;

    try {
      setSubmittingReply(true);
      setErrorMsg(null);
      const token = localStorage.getItem('literature_token');

      const res = await fetch(`/api/reader/literature/${literatureId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: replyText.trim(),
          parentId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to post reply.');
      }

      setReplyText('');
      setReplyingToId(null);
      onCommentsUpdated();
    } catch (err: any) {
      console.error('Post reply error:', err);
      setErrorMsg(err.message || 'Failed to post reply.');
    } finally {
      setSubmittingReply(false);
    }
  };

  // 3. Delete Comment or Reply (Owner or Admin with Cascade Deletion)
  const handleDeleteComment = async (commentId: string) => {
    try {
      setErrorMsg(null);
      const token = localStorage.getItem('literature_token');

      const res = await fetch(`/api/reader/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete comment.');
      }

      onCommentsUpdated();
    } catch (err: any) {
      console.error('Delete comment error:', err);
      setErrorMsg(err.message || 'Failed to delete comment.');
    }
  };

  // Count total comments and direct replies
  const totalCommentsCount = comments.reduce(
    (acc, comment) => acc + 1 + (comment.replies ? comment.replies.length : 0),
    0
  );

  return (
    <section className="comments-section-container" id="comments-section">
      <div className="comments-section-header">
        <h3 className="comments-section-title">
          <MessageSquare size={20} />
          <span>Scholarly Contemplations & Dialogues</span>
        </h3>
        <span className="comments-count-pill" id="total-dialogues-count">
          {totalCommentsCount} {totalCommentsCount === 1 ? 'Entry' : 'Entries'}
        </span>
      </div>

      {errorMsg && (
        <div style={{ color: '#c33', marginBottom: '1rem', fontSize: '0.9rem' }} id="comment-error-alert">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Top-level Comment Editor */}
      <div className="comment-editor-card" id="top-comment-editor">
        <form onSubmit={handlePostTopComment}>
          <textarea
            className="comment-textarea"
            id="input-top-comment"
            placeholder={
              user
                ? 'Inscribe your scholarly reflections or contemplation on this text...'
                : 'Sign in to participate in classical scholarship and dialogue...'
            }
            value={topComment}
            onChange={(e) => setTopComment(e.target.value)}
            disabled={!user || submittingTop}
          />

          <div className="comment-editor-footer">
            {!user ? (
              <div className="comment-guest-hint" id="guest-comment-hint">
                Scholars must <span onClick={() => onOpenAuth('login')}>sign in</span> to inscribe reflections.
              </div>
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Sharing as <strong>{user.name}</strong> ({user.role})
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={!user || submittingTop || !topComment.trim()}
              id="btn-submit-top-comment"
            >
              <Send size={13} style={{ marginRight: '4px' }} />
              {submittingTop ? 'Inscribing...' : 'Inscribe Dialogue'}
            </button>
          </div>
        </form>
      </div>

      {/* Threaded Comments Tree */}
      {comments.length === 0 ? (
        <div className="comments-empty-state" id="empty-comments-state">
          <div className="comments-empty-icon">📜</div>
          <p>No scholarly dialogues yet inscribed.</p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Be the first scholar to leave reflections and invite discourse on this timeless work.
          </p>
        </div>
      ) : (
        <div className="comments-list" id="comments-tree-list">
          {comments.map((comment) => {
            const isOwner = user && (user.id === comment.userId || user.userId === comment.userId);
            const isAdmin = user && user.role === 'ADMIN';
            const canDelete = isOwner || isAdmin;

            const initials = comment.user?.name
              ? comment.user.name.split(' ').map((n) => n[0]).join('').substring(0, 2)
              : 'S';

            const commentDate = new Date(comment.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={comment.id}
                className="comment-node-card"
                id={`comment-node-${comment.id}`}
                data-testid="comment-card"
              >
                {/* Parent Comment Header */}
                <div className="comment-header">
                  <div className="comment-author-group">
                    <div className="comment-avatar">{initials}</div>
                    <div>
                      <span className="comment-author-name">{comment.user?.name || 'Scholar'}</span>
                      {comment.user?.role === 'ADMIN' && (
                        <span className="tag-badge burgundy" style={{ marginLeft: '6px', fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
                          Curator
                        </span>
                      )}
                      <span className="comment-date">• {commentDate}</span>
                    </div>
                  </div>

                  {canDelete && (
                    <button
                      className="btn-comment-action delete"
                      onClick={() => handleDeleteComment(comment.id)}
                      title="Delete Comment (Cascade deletes replies)"
                      id={`btn-delete-comment-${comment.id}`}
                      data-testid="btn-delete-comment"
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>
                  )}
                </div>

                {/* Parent Comment Body */}
                <div className="comment-body" data-testid="comment-content">
                  {comment.content}
                </div>

                {/* Action Bar (Reply trigger) */}
                <div className="comment-actions">
                  <button
                    className="btn-comment-action"
                    onClick={() => {
                      if (!user) {
                        onOpenAuth('login');
                      } else {
                        setReplyingToId(replyingToId === comment.id ? null : comment.id);
                        setReplyText('');
                      }
                    }}
                    id={`btn-reply-trigger-${comment.id}`}
                    data-testid="btn-reply-trigger"
                  >
                    <Reply size={13} />
                    <span>Reply</span>
                  </button>
                </div>

                {/* Inline 1-Level Deep Reply Input */}
                {replyingToId === comment.id && (
                  <div className="inline-reply-editor" id={`inline-reply-editor-${comment.id}`}>
                    <textarea
                      className="reply-textarea"
                      placeholder={`Direct reply to ${comment.user?.name}...`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      disabled={submittingReply}
                      id={`input-reply-${comment.id}`}
                    />
                    <div className="reply-editor-actions">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setReplyingToId(null);
                          setReplyText('');
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handlePostReply(comment.id)}
                        disabled={submittingReply || !replyText.trim()}
                        id={`btn-submit-reply-${comment.id}`}
                      >
                        {submittingReply ? 'Posting...' : 'Post Reply'}
                      </button>
                    </div>
                  </div>
                )}

                {/* 1-Level Deep Nested Direct Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="replies-branch-container" id={`replies-branch-${comment.id}`}>
                    {comment.replies.map((reply) => {
                      const isReplyOwner = user && (user.id === reply.userId || user.userId === reply.userId);
                      const canDeleteReply = isReplyOwner || (user && user.role === 'ADMIN');

                      const replyInitials = reply.user?.name
                        ? reply.user.name.split(' ').map((n) => n[0]).join('').substring(0, 2)
                        : 'S';

                      const replyDate = new Date(reply.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <div
                          key={reply.id}
                          className="reply-node-card"
                          id={`reply-node-${reply.id}`}
                          data-testid="reply-card"
                        >
                          <div className="comment-header">
                            <div className="comment-author-group">
                              <div className="comment-avatar" style={{ width: '26px', height: '26px', fontSize: '0.75rem' }}>
                                {replyInitials}
                              </div>
                              <div>
                                <span className="comment-author-name">{reply.user?.name || 'Scholar'}</span>
                                {reply.user?.role === 'ADMIN' && (
                                  <span className="tag-badge burgundy" style={{ marginLeft: '4px', fontSize: '0.65rem' }}>
                                    Curator
                                  </span>
                                )}
                                <span className="comment-date">• {replyDate}</span>
                              </div>
                            </div>

                            {canDeleteReply && (
                              <button
                                className="btn-comment-action delete"
                                onClick={() => handleDeleteComment(reply.id)}
                                title="Delete Reply"
                                id={`btn-delete-reply-${reply.id}`}
                                data-testid="btn-delete-reply"
                              >
                                <Trash2 size={12} />
                                <span>Delete</span>
                              </button>
                            )}
                          </div>

                          <div className="comment-body" data-testid="reply-content">
                            {reply.content}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
