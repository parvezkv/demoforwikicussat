import React, { useState, useRef } from 'react';
import { api } from '../lib/api';
import { Image, X, Send } from 'lucide-react';

const MessageInput = ({ roomId, parentId = null, onSuccess, initialContent = '', initialId = null, onCancel = null }) => {
    const [content, setContent] = useState(initialContent);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);
    const isEditing = !!initialId;

    // Simulate getting data from existing Login/Auth system
    // This will be replaced by your friend's auth context later
    const getLoggedInUser = () => {
        return localStorage.getItem('wiki_user_name') || 'Campus User';
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const removeFile = () => {
        setSelectedFile(null);
        setPreviewUrl('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim() && !selectedFile && !isEditing) return;

        setLoading(true);
        try {
            if (isEditing) {
                await api.updateMessage(initialId, {
                    room_id: roomId,
                    content,
                    sender_name: getLoggedInUser(),
                    is_anonymous: false
                });
            } else {
                let mediaUrl = null;
                if (selectedFile) {
                    const uploadRes = await api.uploadImage(selectedFile);
                    mediaUrl = `http://127.0.0.1:8001${uploadRes.url}`;
                }

                await api.createMessage({
                    room_id: roomId,
                    parent_id: parentId,
                    content,
                    sender_name: getLoggedInUser(),
                    is_anonymous: false,
                    media_url: mediaUrl,
                    media_type: mediaUrl ? 'image' : null
                });
            }

            setContent('');
            removeFile();
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Post Error:', error);
            alert('Failed to post. Check if backend is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={`space-y-3 ${isEditing ? 'bg-gray-800/20 p-4 rounded-xl border border-orange-500/20' : ''}`}>
            {previewUrl && !isEditing && (
                <div className="relative inline-block">
                    <img src={previewUrl} alt="preview" className="h-20 w-20 object-cover rounded-lg border border-gray-700" />
                    <button
                        type="button"
                        onClick={removeFile}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            )}

            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={parentId ? "Compose your answer..." : "Ask the campus a question..."}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all resize-none text-gray-200"
                rows={parentId ? 2 : 3}
            />

            <div className="flex justify-between items-center">
                <div className="flex gap-2">
                    {!isEditing && (
                        <>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedFile ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                    }`}
                            >
                                <Image className="w-4 h-4" />
                                {selectedFile ? 'Selected' : 'Image'}
                            </button>
                        </>
                    )}
                    {isEditing && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="bg-gray-800 text-gray-400 px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-700 transition-all"
                        >
                            CANCEL
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-[10px] text-gray-600 font-bold uppercase tracking-wider hidden sm:block">
                        Posting as: <span className="text-gray-400">{getLoggedInUser()}</span>
                    </span>
                    <button
                        type="submit"
                        disabled={loading || (!content.trim() && !selectedFile && !isEditing)}
                        className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white px-6 py-2 rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95"
                    >
                        {loading ? 'SAVING...' : (
                            <>
                                {isEditing ? 'SAVE CHANGES' : (parentId ? 'ANSWER' : 'POST QUESTION')}
                                <Send className="w-3 h-3" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default MessageInput;
