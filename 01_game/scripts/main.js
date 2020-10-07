/***********************************************************************************
*
* PROGRAM:
*	Gorillas
*
* MODULE:	
*	main.js - Main Program
*
* EXTERNAL LIBRARIES:
*	phaser.min.js - Phaser 2 Framework
*
* DESCRIPTION:
* 	Prototype of the Gorillas game
*
* LINKS
*	@website	https://www.askforgametask.com
*	@videos		https://www.youtube.com/ssusnic
*	@repos		https://www.github.com/ssusnic
*
* ABOUT:
*	@author		Srdjan Susnic
*	@copyright	2020 Ask For Game Task
*
*	This program comes with ABSOLUTELY NO WARRANTY.
* 
/***********************************************************************************/

/***********************************************************************************
/* Setup procedure for creating a new Phaser Game object on window load event
/***********************************************************************************/

window.onload = function () {	
	// create a new game object which is an instance of Phaser.Game
	var game = new Phaser.Game(1280, 720, Phaser.CANVAS);
	
	// add all States to the game object (we have only one state in this project)
	game.state.add('GameState', App.GameState);
	
	// start the Game State
	game.state.start('GameState');
};

/***********************************************************************************
/* Application Namespace
/***********************************************************************************/

var App = App || {};

// ---------------------------------------------------------------------------------
// Global constants and variables
// ---------------------------------------------------------------------------------

// dimension of the game world
App.WORLD_WIDTH = 1280;
App.WORLD_HEIGHT = 720;

// world gravity in [pixels/sec^2]
App.GRAVITY = 980;

// tile size
App.TILE_SIZE = 32;

// colors
App.BACK_COLOR = Phaser.Color.createColor(0,120,210); // blue background sky

// ---------------------------------------------------------------------------------
// Game State Constructor
// ---------------------------------------------------------------------------------

App.GameState = function(){
	// definitions of all sub-states
	this.STATUS_GAME_CREATE_LEVEL = 1;
	this.STATUS_GAME_PLAY_AIM = 2;
	this.STATUS_GAME_PLAY_SHOT = 3;

	// set the current game status
	this.status = this.STATUS_GAME_CREATE_LEVEL;
};

// ---------------------------------------------------------------------------------
// Game State Prototype
// ---------------------------------------------------------------------------------

App.GameState.prototype = {
	/**
	* Called by Phaser Framework to load all assets.
	*/
	preload : function(){
		this.game.load.image('btnAuthor', '../assets/btn_author.png');
		
		this.game.load.image('imgBuilding', '../assets/img_building.png');
		this.game.load.image('imgGorilla1', '../assets/img_gorilla1.png');
		this.game.load.image('imgGorilla2', '../assets/img_gorilla2.png');
		this.game.load.image('imgBanana', '../assets/img_banana.png');
	},
	
	/**
	* Called by Phaser Framework immediately after all assets are loaded to create all objects.
	*/
	create : function(){
		// set scale mode to cover the entire screen
		this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
		this.scale.pageAlignVertically = true;
		this.scale.pageAlignHorizontally = true;
		
		// keep game running if it loses the focus
		this.game.stage.disableVisibilityChange = true;
		
		// start the Phaser arcade physics engine
		this.game.physics.startSystem(Phaser.Physics.ARCADE);

		// set the gravity of the world
		this.game.physics.arcade.gravity.y = App.GRAVITY;

		// create a bitmap data of the game world so we can check collisions between banana and buildings using pixel colors
		this.bmpWorld = this.game.make.bitmapData(App.WORLD_WIDTH, App.WORLD_HEIGHT);
		this.bmpWorld.addToWorld(0, 0);
		
		// create an array to store the buildings data 
		this.buildings = [];
		for (var i=0; i<10; i++){
			this.buildings.push({x:0, y:0, width:0, height:0});
		}
		
		// create the sprite which contains all tiles for drawing buildings
		this.sprBuilding = this.game.make.sprite(0, 0, 'imgBuilding');
		
		// create bananas
		this.banana1 = new Banana(this);
		this.banana2 = new Banana(this);
		
		// create gorillas
		this.gorilla1 = new Gorilla(this, 1, this.banana1);
		this.gorilla2 = new Gorilla(this, 2, this.banana2);
		
		// bring the bananas on top of all others sprites
		this.game.world.bringToTop(this.banana1);
		this.game.world.bringToTop(this.banana2);
	
		// create the graphic object to draw launcher lines
		this.gfxLauncher = this.game.add.graphics(0, 0);  

		// create the user interface
		this.ui = new UI(this);
		
		// draw the background
		this.bmpWorld.rect(0, 0, App.WORLD_WIDTH, App.WORLD_HEIGHT, App.BACK_COLOR.rgba);
	},
	
	/**
	* Called by Phaser Framework on every tick representing the main loop.
	*/
	update : function(){		
		switch(this.status){
			// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// create a new level
			// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			case this.STATUS_GAME_CREATE_LEVEL:
				// create new buildings background
				this.makeBuildings();
				this.drawBuildings();
				
				// resize both gorillas
				this.gorilla1.scale.setTo(0.5);
				this.gorilla2.scale.setTo(0.5);
				
				// restart both gorillas
				this.gorilla1.restart(this.game.rnd.between(0, 3));
				this.gorilla2.restart(this.game.rnd.between(6, 9));
				
				// set the next shooter
				this.gorillaShooter = (this.gorillaShooter === this.gorilla1) ? this.gorilla2 : this.gorilla1;
				
				// flag to know if the shooter can launch banana
				this.canLaunch = false;
						
				this.status = this.STATUS_GAME_PLAY_AIM;
				break;
			
			// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// play the game: get shooting parameters
			// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			case this.STATUS_GAME_PLAY_AIM:
				// draw banana at gorilla's hand by restarting it
				this.gorillaShooter.banana.restart(this.gorillaShooter.x, this.gorillaShooter.y);
				
				// clear launcher graphics
				this.gfxLauncher.clear();
				
				// draw the current launcher line in green color
				if (this.game.input.activePointer.withinGame){
					this.gfxLauncher.lineStyle(6, 0x00dd00);
					this.gfxLauncher.moveTo(this.gorillaShooter.x, this.gorillaShooter.y);
					this.gfxLauncher.lineTo(this.game.input.x, this.game.input.y);
				}
				
				// draw the last (previous) launcher line in red color
				this.gfxLauncher.lineStyle(3, 0xee0000);
				this.gfxLauncher.moveTo(this.gorillaShooter.x, this.gorillaShooter.y);
				this.gfxLauncher.lineTo(this.gorillaShooter.launcher.x, this.gorillaShooter.launcher.y);
				
				// if the active pointer is pressed down, then set the launching flag
				if (this.game.input.activePointer.isDown) this.canLaunch = true;
				
				// if the active pointer is up after setting the launch flag, then charge a shot
				if (this.game.input.activePointer.isUp && this.canLaunch){
					this.gfxLauncher.clear();
						
					this.gorillaShooter.chargeShot(this.game.input.x, this.game.input.y);
					this.canLaunch = false;
						
					this.status = this.STATUS_GAME_PLAY_SHOT;
				}

				break;
				
			// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// play the game: execute game logic 
			// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			case this.STATUS_GAME_PLAY_SHOT:
				// check collisions between the objects and banana1 launched by gorilla1
				if (this.banana1.alive){
					// if banana1 hit the gorilla2
					if (this.banana1.isHitTarget(this.gorilla2)){
						this.drawBananaExplosion(this.gorilla2);
						this.banana1.kill();
						this.gorilla2.kill();
						
					// if banana1 hit the gorilla1 (self-destruction)
					} else if (this.banana1.isHitShooter(this.gorilla1)){
						this.drawBananaExplosion(this.gorilla1);
						this.banana1.kill();
						this.gorilla1.kill();
					
					// if banana1 hit a building
					} else if (this.banana1.isHitBuilding()){
						this.drawBananaExplosion(this.banana1);
						this.banana1.kill();
					
					// if banana1 goes out of the world bounds
					} else if (this.banana1.isOutOfBounds()){
						this.banana1.kill();
					}
				}
				
				// check collisions between the objects and banana2 launched by gorilla2
				if (this.banana2.alive){
					// if banana2 hit the gorilla1
					if (this.banana2.isHitTarget(this.gorilla1)){
						this.drawBananaExplosion(this.gorilla1);
						this.banana2.kill();
						this.gorilla1.kill();
						
					// if banana2 hit the gorilla2 (self-destruction)
					} else if (this.banana2.isHitShooter(this.gorilla2)){
						this.drawBananaExplosion(this.gorilla2);
						this.banana2.kill();
						this.gorilla2.kill();

					// if banana2 hit a building
					} else if (this.banana2.isHitBuilding()){
						this.drawBananaExplosion(this.banana2);
						this.banana2.kill();
							
					// if banana2 goes out of the world bounds
					} else if (this.banana2.isOutOfBounds()){
						this.banana2.kill();
					}
				}
				
				if (!this.gorilla1.alive || !this.gorilla2.alive){
					// if any gorilla is dead, then create a new level
					this.status = this.STATUS_GAME_CREATE_LEVEL;
					
				} else if (!this.banana1.alive && !this.banana2.alive){
					// else if both bananas are dead, then change the shooter and aim again
					this.gorillaShooter = (this.gorillaShooter === this.gorilla1) ? this.gorilla2 : this.gorilla1;
					this.status =  this.STATUS_GAME_PLAY_AIM;
				}
				
				break;
		}
	},
	
	/**
	* Makes a new buildings layout.
	*/
	makeBuildings: function(){
		// width of the horizontal range that must be filled with the buildings
		var range_width = 40;
		
		// current total sum of all building widths
		var total_width = 0;
		
		// randomize the properties of all buildings
		for (var i=0; i<this.buildings.length; i++){
			this.buildings[i].width = this.game.rnd.between(3, 7);
			this.buildings[i].height = this.game.rnd.between(4, 12);
			
			total_width += this.buildings[i].width;
		}
		
		// adjust the width of the buildings to fill the entire horizontal range
		while (total_width != range_width){
			var i = this.game.rnd.between(0, this.buildings.length-1);
			
			if (total_width < range_width && this.buildings[i].width<7){
				this.buildings[i].width++;
				total_width++;
				
			} else if (total_width > range_width && this.buildings[i].width>3){
				this.buildings[i].width--;
				total_width--;				
			}
		}
		
		// calculate the world coordinates (in pixels) of the buildings
		var x = 0;
		for (var i=0; i<this.buildings.length; i++){
			this.buildings[i].width *= App.TILE_SIZE;
			this.buildings[i].height *= App.TILE_SIZE;
			
			this.buildings[i].x = x;
			this.buildings[i].y = App.WORLD_HEIGHT - this.buildings[i].height;
			
			x += this.buildings[i].width;
		}
	},
	
	/**
	* Draws the buildings layout.
	*/
	drawBuildings: function(){
		this.bmpWorld.rect(0, 0, App.WORLD_WIDTH, App.WORLD_HEIGHT, App.BACK_COLOR.rgba);
		
		for (var i=0; i<this.buildings.length; i++){
			var building = this.buildings[i];
		
			for (var dx=0; dx<building.width; dx+=App.TILE_SIZE){
				for (var dy=0; dy<building.height; dy+=App.TILE_SIZE){
					this.bmpWorld.draw(this.sprBuilding, building.x + dx, building.y + dy);
				}
			}
			
		}
		
		this.bmpWorld.update();
	},
	
	/**
	* Draws a banana explosion.
	*/
	drawBananaExplosion: function(object){
		var	x = object.x;
		var y = object.y + (typeof(object)==='Gorilla' ? object.height/2 : 0);
		var r = object.width*2;
		
		this.bmpWorld.circle(x, y, r, App.BACK_COLOR.rgba);
		this.bmpWorld.update();
	}
};
