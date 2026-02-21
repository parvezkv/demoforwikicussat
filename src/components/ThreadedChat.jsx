import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import MessageItem from './MessageItem';
import MessageInput from './MessageInput';

const ThreadedChat = ({ roomId = 'general' }) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchMessages = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.getMessages(roomId);
            setMessages(data || []);
            setError(null);
        } catch (error) {
            console.error('Fetch Error:', error);
            setError('Backend Unreachable. Check if FastAPI is running.');
        } finally {
            setLoading(false);
        }
    }, [roomId]);

    useEffect(() => {
        fetchMessages();

        // WS for real-time
        let socket;
        try {
            socket = new WebSocket(api.getWebSocketUrl(roomId));
            socket.onmessage = () => fetchMessages();
            socket.onerror = () => console.warn('WS Connection Failed');
        } catch (e) {
            console.error('WS Setup Error');
        }

        return () => { if (socket) socket.close(); };
    }, [roomId, fetchMessages]);

    const organizeThreads = (allMessages) => {
        const messageMap = {};
        const roots = [];
        allMessages.forEach(msg => messageMap[msg.id] = { ...msg, replies: [] });
        allMessages.forEach(msg => {
            if (msg.parent_id && messageMap[msg.parent_id]) {
                messageMap[msg.parent_id].replies.push(messageMap[msg.id]);
            } else if (!msg.parent_id) {
                roots.push(messageMap[msg.id]);
            }
        });
        return roots;
    };

    const threadedMessages = organizeThreads(messages);

    return (
        <div className="px-4 space-y-8 pb-32">
            {loading && messages.length === 0 ? (
                <div className="text-center py-20 text-gray-600 animate-pulse">Connecting...</div>
            ) : error ? (
                <div className="text-center py-20 text-red-500 border border-red-900/20 rounded-xl bg-red-900/5">
                    <p className="font-bold">{error}</p>
                    <button onClick={fetchMessages} className="mt-4 underline text-xs">Try Again</button>
                </div>
            ) : threadedMessages.length === 0 ? (
                <div className="text-center py-20 text-gray-600">
                    <p>No questions yet. Start the thread below.</p>
                </div>
            ) : (
                threadedMessages.map(msg => (
                    <MessageItem key={msg.id} message={msg} roomId={roomId} onRefresh={fetchMessages} />
                ))
            )}

            {/* Input Fixed at bottom for easy access */}
            <div className="fixed bottom-0 left-0 right-0 bg-[#111] border-t border-gray-800 p-4">
                <div className="max-w-3xl mx-auto">
                    <MessageInput roomId={roomId} onSuccess={fetchMessages} />
                </div>
            </div>
        </div>
    );
};

export default ThreadedChat;
