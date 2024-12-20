class Chat {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.notifications = [];
        this.userEmail = localStorage.getItem('userEmail');
        this.userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        this.typingUsers = new Map();
        this.readReceipts = new Map();
        this.onlineUsers = new Set();
        
        if (!this.userEmail) {
            window.location.href = 'index.html';
        }

        // Start online simulation
        this.startOnlineSimulation();
        // Initial update
        this.updateOnlineUsers();
    }

    updateOnlineUsers() {
        const onlineUsersList = document.getElementById('onlineUsersList');
        if (!onlineUsersList) return;

        const allUsers = this.loadAllUsers();
        onlineUsersList.innerHTML = '';

        allUsers.forEach(user => {
            if (user.email === this.userEmail) return;

            const isOnline = this.onlineUsers.has(user.email);
            const div = document.createElement('div');
            div.className = 'user-list-item';
            div.onclick = () => this.startChat(user);
            div.innerHTML = `
                <div class="user-avatar">
                    <img src="default-profile.jpg" alt="${user.fullName}">
                    <span class="online-status ${isOnline ? 'online' : ''}"></span>
                </div>
                <div class="user-info">
                    <div class="user-name">${user.fullName}</div>
                    <div class="user-status">${isOnline ? 'Online' : 'Offline'}</div>
                </div>
            `;
            onlineUsersList.appendChild(div);
        });

        // Update status in chat list
        this.updateChatList();
    }

    startOnlineSimulation() {
        // Simulate online status changes every 30 seconds
        setInterval(() => {
            const allUsers = this.loadAllUsers();
            allUsers.forEach(user => {
                if (user.email !== this.userEmail && Math.random() > 0.7) {
                    if (this.onlineUsers.has(user.email)) {
                        this.onlineUsers.delete(user.email);
                    } else {
                        this.onlineUsers.add(user.email);
                    }
                }
            });
            this.updateOnlineUsers();
        }, 30000);
    }

    updateChatList() {
        const chatItems = document.querySelectorAll('.chat-item');
        chatItems.forEach(item => {
            const userEmail = item.dataset.email;
            const statusDot = item.querySelector('.online-status');
            if (statusDot && userEmail) {
                statusDot.classList.toggle('online', this.onlineUsers.has(userEmail));
            }
        });
    }

    searchUsers(query) {
        const allUsers = this.loadAllUsers();
        query = query.toLowerCase();
        return allUsers.filter(user => {
            return user.email !== this.userEmail && (
                user.fullName.toLowerCase().includes(query) ||
                user.email.toLowerCase().includes(query) ||
                (user.languages && user.languages.some(lang => 
                    lang.toLowerCase().includes(query)
                ))
            );
        });
    }

    loadAllUsers() {
        // In a real app, this would be a server call
        const usersStr = localStorage.getItem('allUsers');
        if (!usersStr) {
            const demoUsers = [
                { email: 'support@lrhub.com', fullName: 'Voice Acting Support', languages: ['English'] },
                { email: 'john@example.com', fullName: 'John Doe', languages: ['English', 'Spanish'] },
                { email: 'sarah@example.com', fullName: 'Sarah Johnson', languages: ['English', 'French'] }
            ];
            localStorage.setItem('allUsers', JSON.stringify(demoUsers));
            return demoUsers;
        }
        return JSON.parse(usersStr);
    }

    createGroup(name, members) {
        const group = {
            id: 'group_' + Date.now(),
            type: 'group',
            name: name,
            creator: this.userEmail,
            members: [...members, this.userEmail],
            created: new Date().toISOString(),
            image: 'default-profile.jpg'
        };

        // Save group
        const groups = JSON.parse(localStorage.getItem('chatGroups') || '[]');
        groups.push(group);
        localStorage.setItem('chatGroups', JSON.stringify(groups));

        // Add to user's chats
        this.saveChat({
            id: group.id,
            type: 'group',
            name: group.name,
            image: group.image,
            lastMessage: 'Group created'
        });

        return group;
    }

    loadGroups() {
        const groups = JSON.parse(localStorage.getItem('chatGroups') || '[]');
        return groups.filter(group => group.members.includes(this.userEmail));
    }

    setTyping(chatId, isTyping) {
        if (isTyping) {
            this.typingUsers.set(chatId, {
                user: this.userEmail,
                timestamp: Date.now()
            });
        } else {
            this.typingUsers.delete(chatId);
        }
        this.updateTypingStatus(chatId);
    }

    updateTypingStatus(chatId) {
        const typingInfo = this.typingUsers.get(chatId);
        const statusElement = document.getElementById('chatStatus');
        if (statusElement && typingInfo && Date.now() - typingInfo.timestamp < 5000) {
            statusElement.textContent = 'Typing...';
        } else {
            this.typingUsers.delete(chatId);
            statusElement.textContent = 'Online';
        }
    }

    markAsRead(chatId, messageId) {
        const receipt = {
            messageId,
            readAt: new Date().toISOString(),
            by: this.userEmail
        };

        let receipts = this.readReceipts.get(chatId) || [];
        receipts.push(receipt);
        this.readReceipts.set(chatId, receipts);

        // Update UI
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.querySelector('.read-receipt').innerHTML = '&#10004;&#10004;';
        }
    }

    async startVoiceMessage() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                this.sendVoiceMessage(audioBlob);
            };

            this.mediaRecorder.start();
            return true;
        } catch (error) {
            console.error('Error accessing microphone:', error);
            return false;
        }
    }

    stopVoiceMessage() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
            return true;
        }
        return false;
    }

    sendVoiceMessage(audioBlob) {
        const messagesContainer = document.getElementById('chatMessages');
        const div = document.createElement('div');
        div.className = 'message sent';
        
        const audio = document.createElement('audio');
        audio.controls = true;
        audio.src = URL.createObjectURL(audioBlob);
        
        div.appendChild(audio);
        div.innerHTML += `<div class="message-time">${new Date().toLocaleTimeString()}</div>`;
        
        messagesContainer.appendChild(div);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    async handleFileUpload(file) {
        if (!file) return;

        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('File size must be less than 10MB');
            return;
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword'];
        if (!allowedTypes.includes(file.type)) {
            alert('Invalid file type. Please upload an image, PDF, or Word document.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const messagesContainer = document.getElementById('chatMessages');
            const div = document.createElement('div');
            div.className = 'message sent';

            if (file.type.startsWith('image/')) {
                div.innerHTML = `
                    <img src="${e.target.result}" alt="Uploaded file">
                    <div class="file-name">${file.name}</div>
                    <div class="message-time">${new Date().toLocaleTimeString()}</div>
                `;
            } else {
                div.innerHTML = `
                    <div class="file-attachment">
                        <span class="file-icon">&#128279;</span>
                        <span class="file-name">${file.name}</span>
                        <span class="file-size">${(file.size / 1024).toFixed(1)} KB</span>
                    </div>
                    <div class="message-time">${new Date().toLocaleTimeString()}</div>
                `;
            }

            messagesContainer.appendChild(div);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        };
        reader.readAsDataURL(file);
    }

    addNotification(message, type = 'message') {
        const notification = {
            id: Date.now(),
            message,
            type,
            timestamp: new Date()
        };

        this.notifications.push(notification);
        this.showNotification(notification);
        this.updateNotificationBadge();
    }

    showNotification(notification) {
        const div = document.createElement('div');
        div.className = `notification ${notification.type}`;
        div.innerHTML = `
            <div class="notification-content">
                <div class="notification-message">${notification.message}</div>
                <div class="notification-time">${notification.timestamp.toLocaleTimeString()}</div>
            </div>
            <button class="notification-close" onclick="removeNotification(${notification.id})">&#215;</button>
        `;

        document.body.appendChild(div);
        setTimeout(() => div.remove(), 5000);
    }

    updateNotificationBadge() {
        const unreadCount = this.notifications.length;
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'block' : 'none';
        }
    }

    removeNotification(id) {
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.updateNotificationBadge();
    }

    updateUserStatus() {
        const userEmail = this.userEmail;
        const userFullName = this.userProfile.fullName || userEmail;
        
        // Update UI with user info
        const profilePic = document.querySelector('.profile-section img');
        if (profilePic) {
            profilePic.src = this.userProfile.profilePic || 'default-profile.jpg';
            profilePic.alt = userFullName;
        }

        // Update chat header if it exists
        const chatName = document.getElementById('chatName');
        if (chatName) {
            chatName.textContent = userFullName;
        }
    }

    loadUserChats() {
        // In a real app, this would fetch from a server
        const userChats = JSON.parse(localStorage.getItem(`chats_${this.userEmail}`) || '[]');
        return userChats;
    }

    saveChat(chatData) {
        const userChats = this.loadUserChats();
        userChats.push(chatData);
        localStorage.setItem(`chats_${this.userEmail}`, JSON.stringify(userChats));
    }

    addReaction(messageId, reaction) {
        const reactionData = {
            reaction,
            by: this.userEmail,
            timestamp: new Date().toISOString()
        };

        // Get message's reactions
        const messageKey = `reactions_${messageId}`;
        const reactions = JSON.parse(localStorage.getItem(messageKey) || '[]');
        
        // Remove existing reaction from same user
        const existingIndex = reactions.findIndex(r => r.by === this.userEmail);
        if (existingIndex !== -1) {
            reactions.splice(existingIndex, 1);
        }
        
        reactions.push(reactionData);
        localStorage.setItem(messageKey, JSON.stringify(reactions));

        // Update UI
        this.updateReactionsUI(messageId);
    }

    removeReaction(messageId) {
        const messageKey = `reactions_${messageId}`;
        const reactions = JSON.parse(localStorage.getItem(messageKey) || '[]');
        
        // Remove user's reaction
        const updatedReactions = reactions.filter(r => r.by !== this.userEmail);
        localStorage.setItem(messageKey, JSON.stringify(updatedReactions));

        // Update UI
        this.updateReactionsUI(messageId);
    }

    updateReactionsUI(messageId) {
        const messageKey = `reactions_${messageId}`;
        const reactions = JSON.parse(localStorage.getItem(messageKey) || '[]');
        
        const reactionCounts = reactions.reduce((acc, r) => {
            acc[r.reaction] = (acc[r.reaction] || 0) + 1;
            return acc;
        }, {});

        const reactionElement = document.querySelector(`[data-message-id="${messageId}"] .message-reactions`);
        if (reactionElement) {
            reactionElement.innerHTML = Object.entries(reactionCounts)
                .map(([reaction, count]) => `
                    <span class="reaction ${reactions.some(r => r.by === this.userEmail && r.reaction === reaction) ? 'active' : ''}"
                          onclick="toggleReaction('${messageId}', '${reaction}')">
                        ${reaction} ${count}
                    </span>
                `).join('');
        }
    }

    exportChat(chatId) {
        return new Promise((resolve) => {
            const chatHistory = JSON.parse(localStorage.getItem(
                `chat_history_${this.userEmail}_${chatId}`
            ) || '[]');

            const chat = this.loadUserChats().find(c => c.id === chatId);
            if (!chat) {
                resolve(null);
                return;
            }

            // Format chat history
            const exportData = {
                chatInfo: {
                    name: chat.name,
                    type: chat.type,
                    created: chat.created || new Date().toISOString(),
                    participants: chat.type === 'group' ? chat.members : [this.userEmail, chat.email]
                },
                messages: chatHistory.map(msg => ({
                    type: msg.type,
                    content: msg.type === 'text' ? msg.content : '[Media Content]',
                    from: msg.from,
                    timestamp: msg.timestamp,
                    reactions: JSON.parse(localStorage.getItem(`reactions_${msg.id}`) || '[]')
                }))
            };

            // Create downloadable file
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            // Create download link
            const a = document.createElement('a');
            a.href = url;
            a.download = `chat_export_${chat.name}_${new Date().toISOString()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            resolve(exportData);
        });
    }

    importChat(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importData = JSON.parse(e.target.result);
                    
                    // Validate import data
                    if (!importData.chatInfo || !importData.messages) {
                        throw new Error('Invalid chat export file');
                    }

                    // Create or update chat
                    const chatId = `imported_${Date.now()}`;
                    const chat = {
                        id: chatId,
                        type: importData.chatInfo.type,
                        name: importData.chatInfo.name,
                        created: importData.chatInfo.created,
                        members: importData.chatInfo.participants,
                        lastMessage: importData.messages[importData.messages.length - 1]?.content || 'No messages'
                    };

                    // Save chat
                    this.saveChat(chat);

                    // Save messages
                    const chatKey = `chat_history_${this.userEmail}_${chatId}`;
                    localStorage.setItem(chatKey, JSON.stringify(importData.messages));

                    // Save reactions
                    importData.messages.forEach((msg, index) => {
                        if (msg.reactions && msg.reactions.length > 0) {
                            localStorage.setItem(
                                `reactions_${msg.id || `imported_${chatId}_${index}`}`,
                                JSON.stringify(msg.reactions)
                            );
                        }
                    });

                    resolve(chat);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }
}

// Initialize chat
const chat = new Chat();

// Add to window for global access
window.chat = chat;
