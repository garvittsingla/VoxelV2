import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserButton, useUser } from '@clerk/clerk-react';
import { Document, Packer, Paragraph, TextRun } from 'docx';

interface MeetingRecord {
    roomName: string;
    duration: string;
    date: string;
    summary?: string;
}

const generateAndDownloadSummary = async (roomName: string, summary: string, date: string) => {
    // Create a new document
    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Meeting Summary - ${roomName}`,
                            bold: true,
                            size: 32
                        })
                    ]
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Date: ${new Date(date).toLocaleString()}`,
                            size: 24
                        })
                    ]
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: summary,
                            size: 24
                        })
                    ]
                })
            ]
        }]
    });

    // Generate the DOCX file
    const blob = await Packer.toBlob(doc);

    // Create a download link and trigger the download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${roomName}-summary.docx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
};

const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useUser();
    const [recentMeets, setRecentMeets] = useState<MeetingRecord[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [roomName, setRoomName] = useState('');

    useEffect(() => {
        const storedMeets = localStorage.getItem('recentMeets');
        if (storedMeets) {
            setRecentMeets(JSON.parse(storedMeets));
        }
    }, []);

    const handleJoinRoom = (e: React.FormEvent) => {
        e.preventDefault();
        if (roomName.trim()) {
            const roomSlug = roomName.trim().toLowerCase().replace(/\s+/g, '-');
            navigate(`/game/${roomSlug}`);
        }
    };

    return (
        <div className="min-h-screen bg-[#36393f] text-white">
            {/* Top Navigation Bar */}
            <div className="bg-[#202225] h-14 flex items-center justify-between px-4 shadow-lg">
                <div className="flex items-center space-x-4">
                    <img src="/logo.png" alt="VOXEL Logo" className="h-8 w-8" />
                    <span className="text-xl font-bold text-white">VOXEL</span>
                </div>
                <div className="flex items-center space-x-4">
                    <span className="text-gray-300">{user?.primaryEmailAddress?.emailAddress}</span>
                    <UserButton afterSignOutUrl="/" />
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Recent Meetings Section */}
                    <div className="bg-[#2f3136] rounded-lg shadow-lg overflow-hidden">
                        <div className="px-6 py-4 bg-[#202225] border-b border-[#40444b]">
                            <h2 className="text-xl font-semibold text-white">Recent Meetings</h2>
                        </div>
                        <div className="divide-y divide-[#40444b]">
                            {recentMeets.length === 0 ? (
                                <div className="p-6 text-center text-gray-400">
                                    No recent meetings found
                                </div>
                            ) : (
                                recentMeets.map((meet: MeetingRecord) => (
                                    <div key={meet.date} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg mb-2">
                                        <div>
                                            <h3 className="text-lg font-semibold">{meet.roomName}</h3>
                                            <p className="text-sm text-gray-400">
                                                {new Date(meet.date).toLocaleString()}
                                            </p>
                                            <p className="text-sm text-blue-400">
                                                Duration: {meet.duration}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {meet.summary && meet.summary.length > 0 && (
                                                <button
                                                    onClick={() => generateAndDownloadSummary(meet.roomName, meet.summary!, meet.date)}
                                                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-1"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                                    </svg>
                                                    Summary
                                                </button>
                                            )}
                                            <button
                                                onClick={() => navigate(`/room/${meet.roomName}`)}
                                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                            >
                                                Join
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Quick Actions Section */}
                    <div className="bg-[#2f3136] rounded-lg shadow-lg overflow-hidden">
                        <div className="px-6 py-4 bg-[#202225] border-b border-[#40444b]">
                            <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="w-full bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium py-3 px-4 rounded-md transition-colors duration-150 flex items-center justify-center space-x-2"
                            >
                                <span>🎮</span>
                                <span>Join New Meeting</span>
                            </button>
                            <button
                                onClick={() => navigate('/game/meet')}
                                className="w-full bg-[#43b581] hover:bg-[#3ca374] text-white font-medium py-3 px-4 rounded-md transition-colors duration-150 flex items-center justify-center space-x-2"
                            >
                                <span>🚀</span>
                                <span>Quick Start</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Join Meeting Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-[#2f3136] rounded-lg shadow-xl max-w-md w-full">
                        <div className="px-6 py-4 bg-[#202225] border-b border-[#40444b] flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-white">Join Meeting</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleJoinRoom} className="p-6">
                            <div className="mb-4">
                                <label htmlFor="roomName" className="block text-sm font-medium text-gray-300 mb-2">
                                    Enter Room Name
                                </label>
                                <input
                                    type="text"
                                    id="roomName"
                                    value={roomName}
                                    onChange={(e) => setRoomName(e.target.value)}
                                    className="w-full px-3 py-2 bg-[#40444b] border border-[#202225] rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5865f2] focus:border-transparent"
                                    placeholder="Enter room name..."
                                    required
                                />
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-[#40444b] hover:bg-[#36393f] rounded-md transition-colors duration-150"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-[#5865f2] hover:bg-[#4752c4] rounded-md transition-colors duration-150"
                                >
                                    Join Room
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard; 