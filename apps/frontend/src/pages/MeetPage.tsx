import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAgora } from '../hooks/useAgora';

const MeetPage = () => {
    const { roomslug } = useParams();
    const [username, setUsername] = useState('');
    const [isUsernameSet, setIsUsernameSet] = useState(false);

    // Only initialize the Agora hook if we have a username
    const agora = isUsernameSet ? useAgora(username) : null;

    // Auto-join the call when username is set
    useEffect(() => {
        if (isUsernameSet && agora) {
            agora.joinCall();
        }

        // Cleanup when component unmounts
        return () => {
            if (agora) {
                agora.leaveCall();
            }
        };
    }, [isUsernameSet, agora]);

    const handleUsernameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (username.trim()) {
            setIsUsernameSet(true);
        }
    };

    if (!isUsernameSet) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
                <div className="p-8 bg-white rounded-lg shadow-md w-96">
                    <h1 className="text-2xl font-bold mb-6 text-center">Join Meeting</h1>
                    <p className="mb-4 text-center text-gray-600">Room: {roomslug}</p>

                    <form onSubmit={handleUsernameSubmit}>
                        <div className="mb-4">
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                                Your Name
                            </label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter your name"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Join Meeting
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            <header className="bg-white shadow-sm p-4">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-bold">Meeting: {roomslug}</h1>
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">You: {username}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${agora?.isJoined ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {agora?.isJoined ? 'Connected' : 'Disconnected'}
                        </span>
                    </div>
                </div>
            </header>

            <main className="flex-1 container mx-auto p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 bg-white rounded-lg shadow p-4">
                        <h2 className="text-lg font-semibold mb-4">Meeting Room</h2>

                        {agora?.error && (
                            <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
                                Error: {agora.error}
                            </div>
                        )}

                        <div className="flex flex-wrap gap-4 mb-6">
                            <button
                                onClick={agora?.joinCall}
                                disabled={agora?.isJoined}
                                className={`px-4 py-2 rounded-md ${agora?.isJoined
                                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                            >
                                Join Call
                            </button>

                            <button
                                onClick={agora?.leaveCall}
                                disabled={!agora?.isJoined}
                                className={`px-4 py-2 rounded-md ${!agora?.isJoined
                                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                        : 'bg-red-600 text-white hover:bg-red-700'
                                    }`}
                            >
                                Leave Call
                            </button>

                            <button
                                onClick={agora?.toggleMic}
                                disabled={!agora?.isJoined}
                                className={`px-4 py-2 rounded-md ${!agora?.isJoined
                                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                        : agora?.isMicMuted
                                            ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                                            : 'bg-green-600 text-white hover:bg-green-700'
                                    }`}
                            >
                                {agora?.isMicMuted ? 'Unmute Mic' : 'Mute Mic'}
                            </button>
                        </div>

                        <div className="border rounded-md p-4 bg-gray-50">
                            <h3 className="font-medium mb-2">Participants ({agora?.remoteUsers.length || 0})</h3>
                            {agora?.remoteUsers.length === 0 ? (
                                <p className="text-gray-500">No other participants in the call</p>
                            ) : (
                                <ul className="space-y-2">
                                    {agora?.remoteUsers.map((uid) => (
                                        <li key={uid} className="flex items-center">
                                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                            <span>User {uid}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-4">
                        <h2 className="text-lg font-semibold mb-4">Meeting Info</h2>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-500">Room Name</p>
                                <p className="font-medium">{roomslug}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Your Name</p>
                                <p className="font-medium">{username}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Status</p>
                                <p className={`font-medium ${agora?.isJoined ? 'text-green-600' : 'text-red-600'}`}>
                                    {agora?.isJoined ? 'Connected' : 'Disconnected'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Microphone</p>
                                <p className={`font-medium ${agora?.isMicMuted ? 'text-red-600' : 'text-green-600'}`}>
                                    {agora?.isMicMuted ? 'Muted' : 'Unmuted'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MeetPage; 