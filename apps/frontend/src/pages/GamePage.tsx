"use client";
import { useState, useEffect } from 'react'
import * as Phaser  from "phaser"
import Sidebar from '../components/Sidebar';
import { useParams } from 'react-router-dom';

function GamePage() {
  const {roomslug} = useParams()
  
 
    let width:Number,height:Number;
  function getscreensize(){
     width = window.innerWidth ;
     height = window.innerHeight ;
  }
  useEffect(()=>{
      getscreensize()
      // console.log(params.roomslug)
  },[])
   useEffect(() => {
    const config = {
      type: Phaser.AUTO,
      width: (width/3)*2.4,
      height: height,
      parent: 'game-container',
      scene: [SceneMain],
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false // Set to true to see collision boxes
        }
      }
    };

    const game = new Phaser.Game(config);
    
    return () => {
      game.destroy(true);
    };
  }, []);

  class SceneMain extends Phaser.Scene {
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private player!: Phaser.Physics.Arcade.Sprite;
    private map!: Phaser.Tilemaps.Tilemap;
    private layer1!: Phaser.Tilemaps.TilemapLayer;
    private layer2!: Phaser.Tilemaps.TilemapLayer;
    
    constructor() {
      super("SceneMain")
    }
    
    preload() {
      this.load.image("tiles", "/assets/tilemap.png");
      this.load.tilemapTiledJSON("map", "/assets/bed.json");
      
      // Load a simple circle for the player
      this.load.image("player", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAA7AAAAOwBeShxvQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAKBSURBVFiF7dZNiE5RGMDx/zMz3g+DkWZYTJoUG8LCWJBPG1lQShbKQrIQzcZCNspGslE+FvKVhWSDsrCRspjNLEZRFtIwNONrzJjHYu6dV7czd96ZeVd+dTr33HPPef7nOc+55xZVVY3SxmMvVuIWDuLjKAUM/Qd4LwHrIugRHMN6/OxGgimDa1PMGuI1dzcB91NoA9NxDufxfhDwF0JIRrdbcN9QBCzH2zjYuORbsKILcBfWYTPGYKgCpuJmz+j3YFaN1g5+xeh/YnkdeDcCRsf3V1iLJ/HSm3ApynsxvBs/kpDVeIzj2FB30M7GYDvxKAZ8WjO+IYJWjW8V3uB0fJ6C7/gwVHJ7iAs4gnex7wX2hzINlIBJUUjZmrEpdv+V6Auh3fgeRx9ErO3FbYcfxY3RTGJ3S/9qjMXTgbjK5V9cV1kaB2Ukwfsrrp0OgZeE1ZZpZQ24i2U13bpiZYzv9QCc92ARZR2Y38A7CCWqt2XRRVMH5tfUQZZFNCW4O/gWr8fiUkO8Mxif2XxQwK6agCaclO+uO7an/KuyOuieV9XcVmTWHcOX1DFFbsc5+Br7P+NrBF0Wr1P0Yen3JUJxslfJJdkycBlJbgTbcvzdUhPxLII9K+mfEUuwGzuxBWmVLE3AUXwowNJ4aTEeo7dy+lX4nFOCO4LJeBUvLYrXThT0z+3xDgcKvEhsrwR3BPNwI15aiDP4UNA/t1cG6SJsw4MC90t6pQ68RJ/+efmp4HyBoYSf2FaQA9+d4NawvKR/mRbhcQTZHQM2rcL5kpyjtP+3gkmYhZU4jKc4QKnA26rnLxtMRftXe1j+He8GAeerfAR2BDsieF3kHbVf/wUVP/3GrKhWowAAAABJRU5ErkJggg==");
    }

    create() {
      // Get the canvas width
      const canvasWidth = this.sys.game.canvas.width;
      
      this.map = this.make.tilemap({
        key: "map"
      });
      const tileset = this.map.addTilesetImage("mapv1", "tiles");
      
      // Create the layers
      this.layer1 = this.map.createLayer("Tile Layer 1", tileset, 0, 0);
      this.layer2 = this.map.createLayer("Tile Layer 2", tileset, 0, 0);
      
      // Calculate scale factor to make map fit canvas width
      const mapWidth = this.map.widthInPixels;
      const scaleX = canvasWidth / mapWidth;
      
      // Scale the map layers
      this.layer1.setScale(scaleX);
      this.layer2.setScale(scaleX);
      
      // Calculate the scaled map height
      const scaledMapHeight = this.map.heightInPixels * scaleX;
      
      // Resize the game to match the scaled map height
      this.scale.resize(canvasWidth, scaledMapHeight);
      
      // Set camera bounds to match the new dimensions
      this.cameras.main.setBounds(0, 0, canvasWidth, scaledMapHeight);
      
      // Add the player (a simple circle)
      this.player = this.physics.add.sprite(canvasWidth / 2, scaledMapHeight / 2, 'player');
      this.player.setScale(0.5); // Adjust size as needed
      this.player.setOrigin(0.5, 0.5);
      this.player.setCollideWorldBounds(true);
      
      // Set up keyboard input
      this.cursors = this.input.keyboard.createCursorKeys();
      
      // Set up collisions
      // First, set colliding tiles based on the "collides" property
      this.layer1.setCollisionByProperty({ collides: true });
      this.layer2.setCollisionByProperty({ collides: true });
      
      // Make the player collide with the tilemap layers
      this.physics.add.collider(this.player, this.layer1);
      this.physics.add.collider(this.player, this.layer2);
      
      // Make camera follow the player
      this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
      
      // Center the camera on the map initially
      this.cameras.main.centerOn(canvasWidth / 2, scaledMapHeight / 2);
    }
    
    update() {
      // Reset velocity
      this.player.setVelocity(0);
      
      const speed = 160;
      
      // Handle player movement
      if (this.cursors.left.isDown) {
        this.player.setVelocityX(-speed);
      } else if (this.cursors.right.isDown) {
        this.player.setVelocityX(speed);
      }
      
      if (this.cursors.up.isDown) {
        this.player.setVelocityY(-speed);
      } else if (this.cursors.down.isDown) {
        this.player.setVelocityY(speed);
      }
      
      // Normalize diagonal movement (optional)
      if (this.player.body.velocity.x !== 0 && this.player.body.velocity.y !== 0) {
        this.player.body.velocity.normalize().scale(speed);
      }
    }
  }

  return (
    <div className='test flex w-full h-screen '>
      <div id="game-container"></div>
      <div className='menu w-1/5 h-full'>
        <Sidebar roomslug={roomslug}/>
      </div>
    </div>
  )
}

export default GamePage