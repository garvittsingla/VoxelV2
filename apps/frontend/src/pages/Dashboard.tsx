import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface MeetingRecord {
    roomName: string;
    duration: string;
    date: string;
}

const Dashboard = () => {
    const navigate = useNavigate();
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
            // Convert room name to URL-friendly slug
            const roomSlug = roomName.trim().toLowerCase().replace(/\s+/g, '-');
            navigate(`/game/${roomSlug}`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white shadow-xl rounded-lg overflow-hidden">
                    <div className="px-6 py-4 bg-blue-600">
                        <h1 className="text-2xl font-bold text-white">Recent Meetings</h1>
                    </div>

                    <div className="divide-y divide-gray-200">
                        {recentMeets.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">
                                No recent meetings found
                            </div>
                        ) : (
                            recentMeets.map((meet, index) => (
                                <div key={index} className="p-6 flex items-center justify-between hover:bg-gray-50">
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            Room: {meet.roomName}
                                        </h2>
                                        <p className="mt-1 text-sm text-gray-500">
                                            {new Date(meet.date).toLocaleDateString()} {new Date(meet.date).toLocaleTimeString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-medium text-blue-600">
                                            Duration: {meet.duration}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Join New Meeting
                    </button>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
                    <div className="relative bg-white rounded-lg shadow-xl p-8 max-w-md w-full m-4">
                        <div className="absolute top-4 right-4">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Join Meeting</h2>

                        <form onSubmit={handleJoinRoom}>
                            <div className="mb-4">
                                <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 mb-2">
                                    Enter Room Name
                                </label>
                                <input
                                    type="text"
                                    id="roomName"
                                    value={roomName}
                                    onChange={(e) => setRoomName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter room name..."
                                    required
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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