import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import MessageInput from './MessageInput';
import { Pencil, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { api } from '../lib/api';

const MessageItem = ({ message, roomId, onRefresh }) => {
    const [showReply, setShowReply] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [voting, setVoting] = useState(false);

    const isQuestion = !message.parent_id;
    const currentUserName = localStorage.getItem('wiki_user_name') || 'Campus User';
    const isOwner = message.sender_name === currentUserName;

    const handleVote = async (type) => {
        if (voting) return;
        setVoting(true);
        try {
            await api.voteMessage(message.id, currentUserName, type);
            onRefresh();
        } catch (error) {
            console.error('Vote error:', error);
        } finally {
            setVoting(false);
        }
    };

    return (
        <div className={`group transition-all ${isQuestion ? 'bg-gray-900/30 p-5 rounded-2xl border border-gray-800 shadow-xl' : 'ml-4 md:ml-8 pl-4 border-l-2 border-orange-500/10 mt-6 pt-2'}`}>

            {/* Header Info */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold ${message.is_anonymous ? 'text-gray-500' : 'text-orange-500'}`}>
                        {message.sender_name}
                    </span>
                    <span className="text-[10px] text-gray-600">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </span>
                    {isOwner && (
                        <span className="text-[9px] bg-orange-500/10 text-orange-500/80 px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter border border-orange-500/20">Your Post</span>
                    )}
                </div>

                {isOwner && !isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-orange-500 p-1"
                        title="Edit Post"
                    >
                        <Pencil className="w-3 h-3" />
                    </button>
                )}
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                {message.media_url && !isEditing && (
                    <div className="flex-shrink-0 w-full md:w-40">
                        <img src={message.media_url} alt="post" className="w-full h-auto rounded-xl border border-gray-800 shadow-2xl hover:scale-[1.02] transition-transform" />
                    </div>
                )}
                <div className="flex-1">
                    {isEditing ? (
                        <MessageInput
                            roomId={roomId}
                            initialId={message.id}
                            initialContent={message.content}
                            onSuccess={() => {
                                setIsEditing(false);
                                onRefresh();
                            }}
                            onCancel={() => setIsEditing(false)}
                        />
                    ) : (
                        <>
                            <p className="text-gray-300 text-[15px] whitespace-pre-wrap leading-relaxed">
                                {message.content}
                            </p>

                            <div className="mt-4 flex flex-wrap items-center gap-4">
                                {/* Voting Group */}
                                <div className="flex items-center bg-gray-900/50 rounded-lg p-1 border border-gray-800/50">
                                    <button
                                        onClick={() => handleVote('like')}
                                        disabled={voting}
                                        className="flex items-center gap-1.5 px-2 py-1 text-gray-500 hover:text-orange-500 transition-colors"
                                    >
                                        <ThumbsUp className={`w-3.5 h-3.5 ${message.likes > 0 ? 'text-orange-500 fill-orange-500/20' : ''}`} />
                                        <span className="text-[11px] font-bold">{message.likes || 0}</span>
                                    </button>
                                    <div className="w-[1px] h-3 bg-gray-800 mx-1"></div>
                                    <button
                                        onClick={() => handleVote('dislike')}
                                        disabled={voting}
                                        className="flex items-center gap-1.5 px-2 py-1 text-gray-500 hover:text-red-500 transition-colors"
                                    >
                                        <ThumbsDown className={`w-3.5 h-3.5 ${message.dislikes > 0 ? 'text-red-500 fill-red-500/20' : ''}`} />
                                        <span className="text-[11px] font-bold">{message.dislikes || 0}</span>
                                    </button>
                                </div>

                                <button
                                    onClick={() => setShowReply(!showReply)}
                                    className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all ${showReply ? 'text-orange-500' : 'text-gray-500 hover:text-orange-500'}`}
                                >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    {showReply ? '[ Cancel Reply ]' : '[ Reply ]'}
                                </button>
                            </div>

                            {showReply && (
                                <div className="mt-4 shadow-2xl bg-[#0a0a0a] p-5 rounded-2xl border border-gray-800 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <MessageInput
                                        roomId={roomId}
                                        parentId={message.id}
                                        onSuccess={() => {
                                            setShowReply(false);
                                            onRefresh();
                                        }}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Recursive Threading (Infinite) */}
            {message.replies && message.replies.length > 0 && !isEditing && (
                <div className="mt-2 text-gray-200">
                    {message.replies.map(reply => (
                        <MessageItem key={reply.id} message={reply} roomId={roomId} onRefresh={onRefresh} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default MessageItem;
