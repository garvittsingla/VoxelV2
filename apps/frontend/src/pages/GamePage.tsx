"use client";
import { useState, useEffect, useRef } from 'react';
import * as Phaser from "phaser";
import Sidebar from '../components/Sidebar';
import { useParams } from 'react-router-dom';
import { useRoomSocket } from "../hooks/useWebSocket";

function GamePage() {
  const { roomslug } = useParams();
  const [username] = useState((Math.random()).toString()); // Same random username generation as Sidebar
  
  // Game state refs
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<SceneMain | null>(null);
  
  // Screen dimensions
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  // WebSocket connection
  const { 
    isConnected, 
    players, 
    sendPlayerMove, 
    sendPlayerOnStage,
    joinRoom,
    leaveRoom
  } = useRoomSocket();
  
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
  
  // Update other players when their positions change
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.updateOtherPlayers(players);
    }
  }, [players]);
  
  // Initialize Phaser game
  useEffect(() => {
    if (dimensions.width === 0) return;
    
    class SceneMain extends Phaser.Scene {
      private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
      private player!: Phaser.Physics.Arcade.Sprite;
      private map!: Phaser.Tilemaps.Tilemap;
      private layer1!: Phaser.Tilemaps.TilemapLayer;
      private layer2!: Phaser.Tilemaps.TilemapLayer;
      private playerOnStage: boolean = false;
      private otherPlayers: Map<string, Phaser.Physics.Arcade.Sprite> = new Map();
      private lastPositionUpdate = 0;
      private nameLabels: Map<string, Phaser.GameObjects.Text> = new Map();
      
      constructor() {
        super("SceneMain");
      }
      
      preload() {
        this.load.image("tiles", "/assets/tilemap.png");
        this.load.tilemapTiledJSON("map", "/assets/bed.json");
        
        // Load player sprite
        this.load.image("player", "/assets/player.png");
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
        
        // Create layers
        this.layer1 = this.map.createLayer("Tile Layer 1", tileset, 0, 0);
        this.layer2 = this.map.createLayer("Tile Layer 2", tileset, 0, 0);
        
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
          username,
          { font: '14px Arial', color: '#ffffff', backgroundColor: '#000000' }
        );
        playerLabel.setOrigin(0.5);
        this.nameLabels.set(username, playerLabel);
        
        // Set up keyboard input
        this.cursors = this.input.keyboard.createCursorKeys();
        
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
        
        // Normalize diagonal movement
        if (this.player.body.velocity.x !== 0 && this.player.body.velocity.y !== 0) {
          this.player.body.velocity.normalize().scale(speed);
        }
        
        // Update player label position
        const playerLabel = this.nameLabels.get(username);
        if (playerLabel) {
          playerLabel.setPosition(this.player.x, this.player.y - 30);
        }
        
        // Check if player is on a stage tile
        const playerTileX = this.layer1.worldToTileX(this.player.x);
        const playerTileY = this.layer1.worldToTileY(this.player.y);
        
        const tileLayer1 = this.map.getTileAt(playerTileX, playerTileY, false, 'Tile Layer 1');
        const tileLayer2 = this.map.getTileAt(playerTileX, playerTileY, false, 'Tile Layer 2');
        
        const isOnStage = 
          (tileLayer1 && tileLayer1.properties && tileLayer1.properties.stage === true) || 
          (tileLayer2 && tileLayer2.properties && tileLayer2.properties.stage === true);
        
        // Handle stage entry/exit
        if (isOnStage && !this.playerOnStage) {
          console.log('Player is on stage!');
          this.playerOnStage = true;
          
          // Send stage status to other players
          if (roomslug && isConnected) {
            sendPlayerOnStage(true, roomslug, username);
          }
          
          // Visual effect when on stage (optional glow)
          this.player.setTint(0xffff00);
        } else if (!isOnStage && this.playerOnStage) {
          console.log('Player left the stage!');
          this.playerOnStage = false;
          
          // Send stage status to other players
          if (roomslug && isConnected) {
            sendPlayerOnStage(false, roomslug, username);
          }
          
          // Remove visual effect
          this.player.clearTint();
        }
        
        // Send position updates to other players when this player moves
        if (playerMoved && roomslug && isConnected && time - this.lastPositionUpdate > 100) {
          this.lastPositionUpdate = time;
          sendPlayerMove({ x: this.player.x, y: this.player.y }, roomslug, username);
        }
      }
      
      // Method to update other players
      updateOtherPlayers(players: Map<string, any>) {
        players.forEach((playerData, playerName) => {
          // Skip current player
          if (playerName === username) return;
          
          const position = playerData.position;
          
          // Get or create sprite for this player
          let playerSprite = this.otherPlayers.get(playerName);
          if (!playerSprite) {
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
          
          // Apply tint if player is on stage
          if (playerData.onStage) {
            playerSprite.setTint(0xffff00);
          } else {
            playerSprite.clearTint();
          }
          
          // Move player with animation
          this.tweens.add({
            targets: playerSprite,
            x: position.x,
            y: position.y,
            duration: 100,
            ease: 'Linear'
          });
          
          // Update label position
          const label = this.nameLabels.get(playerName);
          if (label) {
            label.setPosition(position.x, position.y - 30);
          }
        });
        
        // Clean up disconnected players
        this.otherPlayers.forEach((sprite, playerName) => {
          if (!players.has(playerName)) {
            // Remove sprite
            sprite.destroy();
            this.otherPlayers.delete(playerName);
            
            // Remove label
            const label = this.nameLabels.get(playerName);
            if (label) {
              label.destroy();
              this.nameLabels.delete(playerName);
            }
          }
        });
      }
    }
    
    // Create the Phaser game
    const config = {
      type: Phaser.AUTO,
      width: (dimensions.width/3)*2.4,
      height: dimensions.height,
      parent: 'game-container',
      scene: [SceneMain],
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
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
  
  // Join room when connected
  useEffect(() => {
    if (isConnected && roomslug) {
      joinRoom(username, roomslug);
      console.log(`Joining game room ${roomslug} as ${username}`);
    }
    
    return () => {
      if (isConnected && roomslug) {
        leaveRoom(username, roomslug);
      }
    };
  }, [isConnected, roomslug, username, joinRoom, leaveRoom]);
  
  return (
    <div className='test flex w-full h-screen'>
      <div id="game-container" className="w-4/5 h-full"></div>
      <div className='menu w-1/5 h-full'>
        <Sidebar roomslug={roomslug || ''}/>
      </div>
    </div>
  );
}

export default GamePage;