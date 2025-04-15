//hola
"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import * as Phaser from "phaser";
import Sidebar from '../components/Sidebar';
import { useNavigate, useParams } from 'react-router-dom';
import { useRoomSocket } from "../hooks/useWebSocket";
import { useAgora } from "../hooks/useAgora";
import { IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";

// Define SceneMain type before using it in useRef
interface ISceneMain extends Phaser.Scene {
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  player: Phaser.Physics.Arcade.Sprite;
  map: Phaser.Tilemaps.Tilemap;
  layer1: Phaser.Tilemaps.TilemapLayer;
  layer2: Phaser.Tilemaps.TilemapLayer;
  playerOnStage: boolean;
  otherPlayers: Map<string, Phaser.Physics.Arcade.Sprite>;
  lastPositionUpdate: number;
  nameLabels: Map<string, Phaser.GameObjects.Text>;
  audioIndicators: Map<string, Phaser.GameObjects.Image>;
  updateOtherPlayers(players: Map<string, any>): void;
}

function GamePage() {
  const navigate = useNavigate()
  const { roomslug } = useParams();
  const [username] = useState(() => Math.floor(Math.random() * 1000000) + 1); // Generate numeric username between 1-1000000

  // Game state refs
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<ISceneMain | null>(null);

  // Screen dimensions
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // WebSocket connection
  const {
    isConnected,
    messages,
    players,
    sendPlayerMove,
    sendPlayerOnStage,
    joinRoom,
    leaveRoom,
    isAudioEnabled,
    playersOnStage,
    sendMessage
  } = useRoomSocket();

  // Agora voice connection
  const agora = useAgora(username);

  // Local state to track if player is on stage
  const [playerOnStage, setPlayerOnStage] = useState(false);

  // Add recording state
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const audioSourcesRef = useRef<Map<string, MediaStreamAudioSourceNode>>(new Map());

  // Get screen size
  useEffect(() => {
    function getScreenSize() {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }

    getScreenSize();

    window.addEventListener('resize', getScreenSize);
    return () => window.removeEventListener('resize', getScreenSize);
  }, []);

  // Join room when component mounts
  useEffect(() => {
    if (!isConnected) {
      console.log("Waiting for WebSocket connection...");
      return;
    }

    if (roomslug && username) {
      console.log("Joining room with username:", username.toString(), "roomslug:", roomslug);
      joinRoom(username.toString(), roomslug);
      // Connect to Agora voice channel when joining room
      agora.joinCall();
    }

    // Cleanup when component unmounts
    return () => {
      if (roomslug && username) {
        console.log("Component unmounting, leaving room...");
        leaveRoom(username.toString(), roomslug);
        agora.leaveCall();
      }
    };
  }, [isConnected, roomslug, username]); // Add isConnected to dependencies

  // Update microphone status whenever player's stage status changes
  useEffect(() => {
    // Check if player is on stage from players map
    const isOnStage = players.get(username.toString())?.onStage || false;
    console.log("Player stage status check:", { username: username.toString(), isOnStage });

    // Update local state
    setPlayerOnStage(isOnStage);

    // Only update microphone status when entering/leaving stage, not during manual mute
    if (!isOnStage) {
      // Always mute when leaving stage
      agora.updateMicrophoneByStageStatus(false);
    } else if (!agora.isMicMuted) {
      // Only unmute when entering stage if not manually muted
      agora.updateMicrophoneByStageStatus(true);
    }
  }, [players, username, agora]);

  // Add meeting start time tracking
  const [meetingStartTime] = useState(() => new Date());

  // Function to format duration
  const formatDuration = (startTime: Date) => {
    const duration = new Date().getTime() - startTime.getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((duration % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle leaving the meeting
  const handleLeaveMeeting = async () => {
    if (!roomslug) return;

    // Calculate meeting duration
    const duration = formatDuration(meetingStartTime);

    // Store meeting info in localStorage
    const recentMeets = JSON.parse(localStorage.getItem('recentMeets') || '[]');
    recentMeets.unshift({
      roomName: roomslug,
      duration: duration,
      date: new Date().toISOString(),
    });
    localStorage.setItem('recentMeets', JSON.stringify(recentMeets.slice(0, 10))); // Keep last 10 meetings

    // Leave the Agora channel
    await agora.leaveCall();

    // Navigate to dashboard
    // window.location.href = '/dashboard';
    navigate("/dashboard")
  };

  // Update other players when their positions change
  useEffect(() => {
    if (sceneRef.current) {
      console.log("Players state updated:", Array.from(players.entries()));
      sceneRef.current.updateOtherPlayers(players);
    }
  }, [players]);

  // Initialize Phaser game
  useEffect(() => {
    if (dimensions.width === 0) return;

    class SceneMain extends Phaser.Scene implements ISceneMain {
      cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
      player!: Phaser.Physics.Arcade.Sprite;
      map!: Phaser.Tilemaps.Tilemap;
      layer1!: Phaser.Tilemaps.TilemapLayer;
      layer2!: Phaser.Tilemaps.TilemapLayer;
      playerOnStage: boolean = false;
      otherPlayers: Map<string, Phaser.Physics.Arcade.Sprite> = new Map();
      lastPositionUpdate = 0;
      nameLabels: Map<string, Phaser.GameObjects.Text> = new Map();
      audioIndicators: Map<string, Phaser.GameObjects.Image> = new Map();

      constructor() {
        super("SceneMain");
      }

      preload() {
        this.load.image("tiles", "/assets/tilemap.png");
        this.load.tilemapTiledJSON("map", "/assets/bed.json");

        // Load player sprite
        this.load.image("player", "/assets/player.png");

        // Load audio indicator icon
        this.load.image("audio", "/assets/audio-icon.png"); // Add this icon to your assets
      }

      create() {
        // Store reference to this scene
        sceneRef.current = this;

        // Get canvas width
        const canvasWidth = this.sys.game.canvas.width;

        // Create tilemap
        this.map = this.make.tilemap({
          key: "map"
        });
        const tileset = this.map.addTilesetImage("mapv1", "tiles");

        // Create layers with null checks
        if (tileset) {
          this.layer1 = this.map.createLayer("Tile Layer 1", tileset, 0, 0)!;
          this.layer2 = this.map.createLayer("Tile Layer 2", tileset, 0, 0)!;
        } else {
          console.error("Failed to create tileset");
          return;
        }

        // Calculate scale factor to make map fit canvas
        const mapWidth = this.map.widthInPixels;
        const scaleX = canvasWidth / mapWidth;

        // Scale map layers
        this.layer1.setScale(scaleX);
        this.layer2.setScale(scaleX);

        // Calculate scaled map height
        const scaledMapHeight = this.map.heightInPixels * scaleX;

        // Resize game to match scaled height
        this.scale.resize(canvasWidth, scaledMapHeight);

        // Set camera bounds
        this.cameras.main.setBounds(0, 0, canvasWidth, scaledMapHeight);

        // Add player sprite
        this.player = this.physics.add.sprite(canvasWidth / 2, scaledMapHeight / 2, 'player');
        this.player.setScale(1.5);
        this.player.setOrigin(0.5, 0.5);
        this.player.setCollideWorldBounds(true);

        // Add username label above player
        const playerLabel = this.add.text(
          this.player.x,
          this.player.y - 30,
          username.toString(),
          { font: '14px Arial', color: '#ffffff', backgroundColor: '#000000' }
        );
        playerLabel.setOrigin(0.5);
        this.nameLabels.set(username.toString(), playerLabel);

        // Set up keyboard input
        if (this.input && this.input.keyboard) {
          this.cursors = this.input.keyboard.createCursorKeys();
        } else {
          console.error("Keyboard input not available");
        }

        // Set collisions
        this.layer1.setCollisionByProperty({ collides: true });
        this.layer2.setCollisionByProperty({ collides: true });

        // Make player collide with tilemap layers
        this.physics.add.collider(this.player, this.layer1);
        this.physics.add.collider(this.player, this.layer2);

        // Make camera follow player
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

        // Center camera initially
        this.cameras.main.centerOn(canvasWidth / 2, scaledMapHeight / 2);

        // Clean up on scene destroy
        this.events.on('destroy', () => {
          sceneRef.current = null;
        });
      }

      update(time: number, delta: number) {
        // Reset velocity
        this.player.setVelocity(0);

        const speed = 160;
        let playerMoved = false;

        // Handle player movement
        if (this.cursors.left.isDown) {
          this.player.setVelocityX(-speed);
          playerMoved = true;
        } else if (this.cursors.right.isDown) {
          this.player.setVelocityX(speed);
          playerMoved = true;
        }

        if (this.cursors.up.isDown) {
          this.player.setVelocityY(-speed);
          playerMoved = true;
        } else if (this.cursors.down.isDown) {
          this.player.setVelocityY(speed);
          playerMoved = true;
        }

        // Normalize diagonal movement with null checks
        if (this.player.body && this.player.body.velocity) {
          if (this.player.body.velocity.x !== 0 && this.player.body.velocity.y !== 0) {
            this.player.body.velocity.normalize().scale(speed);
          }
        }

        // Update player label position
        const playerLabel = this.nameLabels.get(username.toString());
        if (playerLabel) {
          playerLabel.setPosition(this.player.x, this.player.y - 30);
        }

        // Update audio indicator for current player if on stage
        if (this.playerOnStage) {
          let audioIcon = this.audioIndicators.get(username.toString());
          if (!audioIcon) {
            audioIcon = this.add.image(this.player.x, this.player.y - 50, 'audio');
            audioIcon.setScale(0.5);
            this.audioIndicators.set(username.toString(), audioIcon);
          }
          audioIcon.setPosition(this.player.x, this.player.y - 50);
        }

        // Check if player is on a stage tile
        const playerTileX = this.layer1.worldToTileX(this.player.x);
        const playerTileY = this.layer1.worldToTileY(this.player.y);

        const tileLayer1 = this.map.getTileAt(playerTileX, playerTileY, false, 'Tile Layer 1');
        const tileLayer2 = this.map.getTileAt(playerTileX, playerTileY, false, 'Tile Layer 2');

        const isOnStage =
          (tileLayer1 && tileLayer1.properties && tileLayer1.properties.stage === true) ||
          (tileLayer2 && tileLayer2.properties && tileLayer2.properties.stage === true);

        // Handle stage entry/exit with audio
        if (isOnStage && !this.playerOnStage) {
          console.log('Player is on stage!');
          this.playerOnStage = true;

          // Send stage status to other players
          if (roomslug && isConnected) {
            sendPlayerOnStage(true, roomslug, username.toString());
          }

          // Visual effect when on stage (optional glow)
          this.player.setTint(0xffff00);

          // Add audio indicator
          if (!this.audioIndicators.get(username.toString())) {
            const audioIcon = this.add.image(this.player.x, this.player.y - 50, 'audio');
            audioIcon.setScale(0.5);
            this.audioIndicators.set(username.toString(), audioIcon);
          }

        } else if (!isOnStage && this.playerOnStage) {
          console.log('Player left the stage!');
          this.playerOnStage = false;

          // Send stage status to other players
          if (roomslug && isConnected) {
            sendPlayerOnStage(false, roomslug, username.toString());
          }

          // Remove visual effect
          this.player.clearTint();

          // Remove audio indicator
          const audioIcon = this.audioIndicators.get(username.toString());
          if (audioIcon) {
            audioIcon.destroy();
            this.audioIndicators.delete(username.toString());
          }
        }

        // Send position updates to other players when this player moves
        if (playerMoved && roomslug && isConnected && time - this.lastPositionUpdate > 100) {
          this.lastPositionUpdate = time;
          console.log("Sending player move:", { x: this.player.x, y: this.player.y });
          sendPlayerMove({ x: this.player.x, y: this.player.y }, roomslug, username.toString());
        }
      }

      // Update the updateOtherPlayers method in SceneMain class:
      updateOtherPlayers(players: Map<string, any>) {
        console.log("updateOtherPlayers called with players:", players);

        players.forEach((playerData, playerName) => {
          // Skip current player
          if (playerName === username.toString()) {
            console.log("Skipping current player:", playerName);
            return;
          }

          const position = playerData.position;
          if (!position) {
            console.log("No position data for player:", playerName);
            return; // Skip if no position data
          }

          console.log("Processing player:", playerName, "at position:", position);

          // Get or create sprite for this player
          let playerSprite = this.otherPlayers.get(playerName);
          if (!playerSprite) {
            console.log("Creating new sprite for player:", playerName);
            playerSprite = this.physics.add.sprite(position.x, position.y, 'player');
            playerSprite.setScale(1.5);
            this.otherPlayers.set(playerName, playerSprite);

            // Add collision with map
            this.physics.add.collider(playerSprite, this.layer1);
            this.physics.add.collider(playerSprite, this.layer2);

            // Add username label
            const nameLabel = this.add.text(
              position.x,
              position.y - 30,
              playerName,
              { font: '14px Arial', color: '#ffffff', backgroundColor: '#000000' }
            );
            nameLabel.setOrigin(0.5);
            this.nameLabels.set(playerName, nameLabel);
          }

          // Update player properties
          playerSprite.setData('onStage', playerData.onStage || false);

          // Apply tint if player is on stage
          if (playerData.onStage) {
            playerSprite.setTint(0xffff00);

            // Add audio indicator if not already there
            if (!this.audioIndicators.get(playerName)) {
              const audioIcon = this.add.image(position.x, position.y - 50, 'audio');
              audioIcon.setScale(0.5);
              this.audioIndicators.set(playerName, audioIcon);
            }
          } else {
            playerSprite.clearTint();

            // Remove audio indicator if exists
            const audioIcon = this.audioIndicators.get(playerName);
            if (audioIcon) {
              audioIcon.destroy();
              this.audioIndicators.delete(playerName);
            }
          }

          // Only update position if it's different to prevent jitter
          if (playerSprite.x !== position.x || playerSprite.y !== position.y) {
            console.log("Updating sprite position for:", playerName, "from", { x: playerSprite.x, y: playerSprite.y }, "to", position);
            this.tweens.add({
              targets: playerSprite,
              x: position.x,
              y: position.y,
              duration: 100,
              ease: 'Linear'
            });
          }

          // Update label position
          const label = this.nameLabels.get(playerName);
          if (label) {
            label.setPosition(position.x, position.y - 30);
          }

          // Update audio indicator position if exists
          const audioIndicator = this.audioIndicators.get(playerName);
          if (audioIndicator) {
            audioIndicator.setPosition(position.x, position.y - 50);
          }
        });

        // Clean up disconnected players
        const currentPlayerNames = Array.from(players.keys());
        this.otherPlayers.forEach((sprite, playerName) => {
          if (!currentPlayerNames.includes(playerName)) {
            console.log("Removing disconnected player:", playerName);
            // Remove sprite
            sprite.destroy();
            this.otherPlayers.delete(playerName);

            // Remove label
            const label = this.nameLabels.get(playerName);
            if (label) {
              label.destroy();
              this.nameLabels.delete(playerName);
            }

            // Remove audio indicator
            const audioIcon = this.audioIndicators.get(playerName);
            if (audioIcon) {
              audioIcon.destroy();
              this.audioIndicators.delete(playerName);
            }
          }
        });
      }
    }

    // Create the Phaser game
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: (dimensions.width / 3) * 2.4,
      height: dimensions.height,
      parent: 'game-container',
      scene: [SceneMain],
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false
        }
      }
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
      }
    };
  }, [dimensions, isConnected, roomslug, username, sendPlayerMove, sendPlayerOnStage]);

  // Audio UI indicators - show who's currently on stage
  const renderPlayersOnStage = () => {
    if (playersOnStage.length === 0) return null;

    return (
      <div className="absolute top-4 right-4 bg-black bg-opacity-70 p-2 rounded-lg">
        <h3 className="text-white font-bold mb-1">On Stage:</h3>
        <ul>
          {playersOnStage.map(player => (
            <li key={player} className="text-white flex items-center">
              <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>
              {player}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Audio permission banner if needed
  const [showMicPermission, setShowMicPermission] = useState(false);

  // Check if player is on stage
  const isOnStage = players.get(username.toString())?.onStage || false;

  // Show microphone permission banner when player first goes on stage
  useEffect(() => {
    if (isOnStage && !isAudioEnabled) {
      setShowMicPermission(true);
    } else {
      setShowMicPermission(false);
    }
  }, [isOnStage, isAudioEnabled]);

  // Function to start recording
  const startRecording = useCallback(async () => {
    try {
      // Only allow recording if user is on stage
      if (!isOnStage) {
        console.log("You must be on stage to record");
        return;
      }

      // Create audio context and destination
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const audioDestination = audioContext.createMediaStreamDestination();
      audioDestinationRef.current = audioDestination;

      // Get local microphone stream
      const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create source for local audio
      const localSource = audioContext.createMediaStreamSource(localStream);
      localSource.connect(audioDestination);
      audioSourcesRef.current.set('local', localSource);

      // Connect all remote users' audio to the destination
      if (agora.remoteUsers && agora.remoteUsers.length > 0) {
        agora.remoteUsers.forEach((user: IAgoraRTCRemoteUser) => {
          if (user.audioTrack) {
            // Create a MediaStream from the audio track
            const remoteStream = new MediaStream([user.audioTrack.getMediaStreamTrack()]);

            // Create source for remote audio
            const remoteSource = audioContext.createMediaStreamSource(remoteStream);
            remoteSource.connect(audioDestination);
            audioSourcesRef.current.set(user.uid.toString(), remoteSource);

            console.log(`Connected remote user ${user.uid} audio to recording`);
          }
        });
      }

      // Create MediaRecorder with the combined audio stream
      const mediaRecorder = new MediaRecorder(audioDestination.stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Create audio blob from chunks
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });

        // Create download link
        const url = URL.createObjectURL(audioBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stage-recording-${new Date().toISOString()}.wav`;
        document.body.appendChild(a);
        a.click();

        // Clean up
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);

        // Disconnect all audio sources
        audioSourcesRef.current.forEach(source => {
          source.disconnect();
        });
        audioSourcesRef.current.clear();

        // Stop all tracks
        localStream.getTracks().forEach(track => track.stop());

        // Close audio context
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
      };

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      console.log("Recording started - capturing all stage audio");
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  }, [isOnStage, agora.remoteUsers]);

  // Function to stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log("Recording stopped");
    }
  }, [isRecording]);

  // Update audio sources when remote users change
  useEffect(() => {
    if (isRecording && audioDestinationRef.current && agora.remoteUsers && agora.remoteUsers.length > 0) {
      // Connect any new remote users
      agora.remoteUsers.forEach((user: IAgoraRTCRemoteUser) => {
        if (user.audioTrack && !audioSourcesRef.current.has(user.uid.toString())) {
          // Create a MediaStream from the audio track
          const remoteStream = new MediaStream([user.audioTrack.getMediaStreamTrack()]);

          // Create source for remote audio
          const remoteSource = audioContextRef.current!.createMediaStreamSource(remoteStream);
          remoteSource.connect(audioDestinationRef.current!);
          audioSourcesRef.current.set(user.uid.toString(), remoteSource);

          console.log(`Connected new remote user ${user.uid} audio to recording`);
        }
      });

      // Disconnect users who left
      const currentUserIds = new Set(agora.remoteUsers.map((user: IAgoraRTCRemoteUser) => user.uid.toString()));
      audioSourcesRef.current.forEach((source, userId) => {
        if (userId !== 'local' && !currentUserIds.has(userId)) {
          source.disconnect();
          audioSourcesRef.current.delete(userId);
          console.log(`Disconnected remote user ${userId} audio from recording`);
        }
      });
    }
  }, [isRecording, agora.remoteUsers]);

  // Handle stage status changes
  const handleStageStatusChange = async (onStage: boolean) => {
    if (!roomslug) return;
    sendPlayerOnStage(onStage, roomslug, username.toString());
  };

  // Handle mic toggle
  const handleMicToggle = () => {
    if (!roomslug || !isOnStage) return;

    if (agora.isMicMuted) {
      // Unmute - stay on stage and enable mic
      agora.updateMicrophoneByStageStatus(true);
    } else {
      // Mute - stay on stage but disable mic
      agora.updateMicrophoneByStageStatus(false);
    }
  };

  return (
    <div className='test flex w-full h-screen relative'>
      <div id="game-container" className="w-4/5 h-full"></div>
      <div className='menu w-1/5 h-full'>
        <Sidebar
          roomslug={roomslug || ''}
          username={username.toString()}
          isConnected={isConnected}
          messages={messages}
          sendMessage={sendMessage}
        />
      </div>

      {/* Audio status indicators */}
      {renderPlayersOnStage()}

      {/* Microphone permission banner */}
      {showMicPermission && (
        <div className="absolute top-0 left-0 right-0 bg-yellow-500 text-black p-2 text-center">
          This game requires microphone access for stage audio. Please allow microphone permissions.
        </div>
      )}

      {/* Audio status notification */}
      {isOnStage && (
        <div className="absolute bottom-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full flex items-center">
          <div className="w-2 h-2 bg-red-300 rounded-full animate-pulse mr-2"></div>
          {agora.isMicMuted ? "Your microphone is muted while on stage" : "Your microphone is active - you're on stage!"}
        </div>
      )}

      {/* Record button - only visible when on stage */}
      {isOnStage && (
        <div className="absolute bottom-4 right-86">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-3 rounded-full ${isRecording ? 'bg-red-600' : 'bg-blue-500'} text-white shadow-lg hover:opacity-90 transition-opacity flex items-center gap-2`}
            title={isRecording ? "Stop Recording" : "Start Recording"}
          >
            {isRecording ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
                <span>Stop Recording</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <span>Start Recording</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Mic control overlay buttons */}
      <div className="absolute bottom-4 right-4 flex space-x-2">
        <button
          disabled={!isOnStage}
          onClick={handleMicToggle}
          className={`p-3 rounded-full ${isOnStage ? (agora.isMicMuted ? 'bg-gray-500' : 'bg-green-500') : 'bg-gray-500'} text-white shadow-lg hover:opacity-90 transition-opacity flex items-center gap-2 ${!isOnStage ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={agora.isMicMuted ? "Unmute microphone" : "Mute microphone"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          <span>{agora.isMicMuted ? "Unmute" : "Mute"}</span>
        </button>

        <button
          onClick={() => handleStageStatusChange(false)}
          className={`p-3 rounded-full ${!isOnStage ? 'bg-red-500' : 'bg-gray-500'} text-white shadow-lg hover:opacity-90 transition-opacity flex items-center gap-2`}
          title="Leave stage"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
          <span>Leave Stage</span>
        </button>
      </div>

      {/* Leave meeting button */}
      <div className="absolute top-4 left-4">
        <button
          onClick={handleLeaveMeeting}
          className="p-3 rounded-full bg-red-500 text-white shadow-lg hover:opacity-90 transition-opacity flex items-center gap-2"
          title="Leave Meeting"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Leave Meeting</span>
        </button>
      </div>
    </div>
  );
}

export default GamePage;