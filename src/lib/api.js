const API_URL = 'http://127.0.0.1:8001';

export const api = {
    getMessages: async (roomId) => {
        const response = await fetch(`${API_URL}/messages/${roomId}`);
        if (!response.ok) throw new Error('Failed to fetch messages');
        return response.json();
    },

    createMessage: async (payload) => {
        const response = await fetch(`${API_URL}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Failed to create message');
        return response.json();
    },

    updateMessage: async (id, payload) => {
        const response = await fetch(`${API_URL}/messages/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Failed to update message');
        return response.json();
    },

    uploadImage: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            body: formData
        });
        if (!response.ok) throw new Error('Failed to upload image');
        return response.json();
    },

    voteMessage: async (id, userName, voteType) => {
        const response = await fetch(`${API_URL}/messages/${id}/vote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_name: userName, vote_type: voteType })
        });
        if (!response.ok) throw new Error('Failed to vote');
        return response.json();
    },

    getWebSocketUrl: (roomId) => {
        return `ws://127.0.0.1:8001/ws/${roomId}`;
    }
};
