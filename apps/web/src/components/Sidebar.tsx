"use client";
import { useState } from 'react';

export default function Sidebar() {
    const [activeTab, setActiveTab] = useState('messages');
    const [messages, setMessages] = useState([
        { id: 1, sender: 'Alex', content: 'Hello everyone!', time: '10:15' },
        { id: 2, sender: 'Sam', content: 'Hey Alex, welcome to the room!', time: '10:16' },
        { id: 3, sender: 'Taylor', content: 'Let\'s start the meeting', time: '10:20' }
    ]);
    
    const [members, setMembers] = useState([
        { id: 1, name: 'Alex', online: true, avatar: '👩' },
        { id: 2, name: 'Sam', online: true, avatar: '👨' },
        { id: 3, name: 'Taylor', online: true, avatar: '👧' },
        { id: 4, name: 'Jordan', online: false, avatar: '👦' },
        { id: 5, name: 'Casey', online: true, avatar: '🧑' },
        { id: 6, name: 'Robin', online: false, avatar: '👱' }
    ]);

    const [newMessage, setNewMessage] = useState('');
    
    // YouTube video state
    const [videoId, setVideoId] = useState('dQw4w9WgXcQ'); // Default video ID
    
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim()) {
            setMessages([
                ...messages, 
                { 
                    id: messages.length + 1, 
                    sender: 'You', 
                    content: newMessage, 
                    time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                }
            ]);
            setNewMessage('');
        }
    };

    return (
        <div className="w-full bg-[#392e2b] h-full flex flex-col border-l-4 border-[#5d4037] shadow-lg text-[#e8d4b7] font-pixel"> 
            {/* Top section (3/5 height) */}
            <div className="h-3/5 flex flex-col">
                {/* Tabs */}
                <div className="pixel-tabs flex border-b-4 border-[#5d4037]">
                    <button 
                        className={`flex-1 py-2 px-4 text-center ${activeTab === 'messages' ? 'bg-[#cb803e] text-white' : 'bg-[#392e2b] hover:bg-[#4d3c38]'}`}
                        onClick={() => setActiveTab('messages')}
                    >
                        <div className="pixel-icon mb-1">💬</div>
                        Messages
                    </button>
                    <button 
                        className={`flex-1 py-2 px-4 text-center ${activeTab === 'members' ? 'bg-[#cb803e] text-white' : 'bg-[#392e2b] hover:bg-[#4d3c38]'}`}
                        onClick={() => setActiveTab('members')}
                    >
                        <div className="pixel-icon mb-1">👥</div>
                        Members
                    </button>
                </div>
                
                {/* Content area */}
                <div className="flex-grow overflow-auto p-4 bg-[#2e2421]">
                    {activeTab === 'messages' && (
                        <div className="messages-container overflow-y-auto">
                            {messages.map(message => (
                                <div key={message.id} className="message mb-4 border-2 border-[#5d4037] bg-[#3e322f] p-1 rounded-lg">
                                    <div className="message-header flex justify-between">
                                        <span className="font-bold text-[#ffc107]">{message.sender}</span>
                                        <span className="text-xs text-[#a1887f]">{message.time}</span>
                                    </div>
                                    <div className="message-body mt-1 text-[#e8d4b7]">
                                        {message.content}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {activeTab === 'members' && (
                        <div className="grid grid-cols-2 gap-3">
                            {members.map(member => (
                                <div key={member.id} className={`member-card p-3 border-2 ${member.online ? 'border-[#4caf50]' : 'border-[#5d4037]'} bg-[#3e322f] rounded-lg flex items-center`}>
                                    <div className="pixel-avatar mr-2 w-8 h-8 flex items-center justify-center bg-[#cb803e] rounded-md">
                                        {member.avatar}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold">{member.name}</span>
                                        <span className={`text-xs ${member.online ? 'text-[#4caf50]' : 'text-[#a1887f]'}`}>
                                            {member.online ? 'Online' : 'Offline'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                {/* Chat input */}
                {activeTab === 'messages' && (
                    <form 
                        className="chat-input-container p-3 bg-[#3e322f] border-t-4 border-[#5d4037]"
                        onSubmit={handleSendMessage}
                    >
                        <div className="flex">
                            <input 
                                type="text" 
                                placeholder="Type a message..." 
                                className="flex-grow p-2 rounded-l-md bg-[#2e2421] border-2 border-[#5d4037] text-[#e8d4b7] focus:outline-none"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                            />
                            <button 
                                type="submit" 
                                className="px-4 py-2 bg-[#cb803e] text-white rounded-r-md hover:bg-[#b36d2d] transition-colors"
                            >
                                Send
                            </button>
                        </div>
                    </form>
                )}
            </div>
            
            {/* YouTube section (2/5 height) */}
            <div className="h-2/5 border-t-4 border-[#5d4037] flex flex-col">
                <div className="bg-[#392e2b] p-2 border-b-2 border-[#5d4037] flex justify-between items-center">
                    <h3 className="font-bold text-[#ffc107] px-2">📺 Watch Together</h3>
                    
                    <div className='h-10'>

                    </div>
                </div>
                
                <div className="flex-grow bg-[#2e2421] p-2">
                    <div className="w-full h-full border-4 border-[#5d4037] rounded-lg overflow-hidden">
                        <iframe
                            className="w-full h-full"
                            src={`https://www.youtube.com/embed/${videoId}`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>
            </div>
        </div>
    );
}