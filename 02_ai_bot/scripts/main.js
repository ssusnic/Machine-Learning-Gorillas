/***********************************************************************************
*
* PROGRAM:
*	Gorillas AI Bot
*
* MODULE:	
*	main.js - Main Program
*
* EXTERNAL LIBRARIES:
*	phaser.min.js - Phaser 2 Framework
*
* DESCRIPTION:
* 	Supervised Machine Learning for the Gorillas game using Polynomial Regression
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

// angle range for launching banana
App.MIN_ANGLE = 55;
App.MAX_ANGLE = 82;

// power range for launching banana
App.MIN_POWER = 500;
App.MAX_POWER = 2200;

// colors
App.BACK_COLOR = Phaser.Color.createColor(0,120,210); // blue background sky

// number of records to be generated during data collecting
// (increase this number, if you want to collect more data records)
App.RECORDS_TO_COLLECT = 1000;

// scale values of the gorillas during data collecting
App.GORILLA_SCALE_X = 1/12;
App.GORILLA_SCALE_Y = 1/6;

// define a pre-trained model in the '../model' folder that you want to load 
// by setting the number of its processed training iterations
// (set this number to 0, if you don't want to load a pre-trained model)
App.pretrained_model = 0;

// ---------------------------------------------------------------------------------
// Game State Constructor
// ---------------------------------------------------------------------------------

App.GameState = function(){
	// definitions of all sub-states
	this.STATUS_GAME_NEW = 0;
	this.STATUS_GAME_INIT = 1;
	this.STATUS_GAME_CREATE_LEVEL = 2;
	this.STATUS_GAME_PLAY_AIM = 3;
	this.STATUS_GAME_PLAY_SHOT = 4;
	
	this.STATUS_DATA_COLLECT_INIT = 11;
	this.STATUS_DATA_COLLECT_WORK = 12;
	this.STATUS_DATA_COLLECT_SAVE = 13;
	
	this.STATUS_MODEL_TRAIN = 21;
	this.STATUS_MODEL_LOAD = 22;
	this.STATUS_MODEL_SAVE = 23;
	
	// set the current game status
	this.status = this.STATUS_GAME_NEW;
	
	// flag to know if we need to wait on completion of some action inside a sub-state
	this.wait = false;
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
		
		this.game.load.spritesheet('imgButtons', '../assets/img_buttons.png', 78, 78, 4, 0, 2);
		
		// here define a dataset you want to load from the '../data' folder
		// (if you want to start with an empty dataset, comment out this line)
		this.game.load.binary('dataset', '../data/dataset.bin');
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
		
		// create a bitmap data for drawing trajectories during data collecting
		this.bmpTrajectory = this.game.make.bitmapData(App.WORLD_WIDTH, App.WORLD_HEIGHT);
		this.bmpTrajectory.addToWorld(0, 0);
		
		// create an array to store the buildings data 
		this.buildings = [];
		for (var i=0; i<10; i++){
			this.buildings.push({x:0, y:0, width:0, height:0});
		}
		
		// create the sprite which contains all tiles for drawing buildings
		this.sprBuilding = this.game.make.sprite(0, 0, 'imgBuilding');
		
		// create graphic objects to draw the direction line of the gorilla's view
		this.gfxView1 = this.game.add.graphics(0, 0);
		this.gfxView2 = this.game.add.graphics(0, 0);
		
		// create bananas
		this.banana1 = new Banana(this);
		this.banana2 = new Banana(this);
		
		// create gorillas
		this.gorilla1 = new Gorilla(this, 1, this.banana1);
		this.gorilla2 = new Gorilla(this, 2, this.banana2);

		// create the user interface
		this.ui = new UI(this);
		
		// create the brain (neural network)
		this.brain = new Brain(this);
		
		// store the dataset to an array
		var binary = this.game.cache.getBinary('dataset');
		this.dataset = (binary == null) ? [] : Array.from(new Uint8Array(binary));
		
		// draw the background
		this.bmpWorld.rect(0, 0, App.WORLD_WIDTH, App.WORLD_HEIGHT, App.BACK_COLOR.rgba);
	},
	
	/**
	* Called by Phaser Framework on every tick representing the main loop.
	*/
	update : function(){		
		switch(this.status){
			// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// start a new game
			// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			case this.STATUS_GAME_NEW:
				console.log("Starting a new game.");
				
				// disable all buttons
				this.ui.setButtons(false);
					
				// kill both bananas
				this.banana1.kill();
				this.banana2.kill();
				
				// go to loading a pre-trained model						
				this.status = this.STATUS_MODEL_LOAD;
				break;
				
			// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// initialize the game 
			// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			case this.STATUS_GAME_INIT:
				console.log("Initializing game.");
			
				// disable all buttons
				this.ui.setButtons(false);
				
				// prepare training data using dataset
				this.brain.prepareData(this.dataset);
				this.ui.printDatasetInfo();
				
				// reset waiting flag
				this.wait = false;
				
				this.status = this.STATUS_GAME_CREATE_LEVEL;
				break;
			
			// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// create a new level
			// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			case this.STATUS_GAME_CREATE_LEVEL:
				console.log("Creating new level.");
			
				// enable all buttons
				this.ui.setButtons(true);
			
				// create new buildings background
				this.makeBuildings();
				this.drawBuildings();
				
				// resize both gorillas
				this.gorilla1.scale.setTo(0.5);
				this.gorilla2.scale.setTo(0.5);
				
				// restart both gorillas
				this.gorilla1.restart(this.game.rnd.between(0, 3));
				this.gorilla2.restart(this.game.rnd.between(6, 9));
				
				this.status = this.STATUS_GAME_PLAY_AIM;
				break;
			
			// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// play the game: get shooting parameters
			// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			case this.STATUS_GAME_PLAY_AIM:
				console.log("Playing game.");
			
				// get the input parameters
				var input = this.getInputParams();
				
				// get the output action from the Neural Net passing the input parameters for the gorilla1
				this.gorilla1.action = this.brain.predict(input.theta1, input.theta2, input.dist);
				this.gorilla1.chargeShot();
				
				// get the output action from the Neural Net passing the input parameters for the gorilla2
				this.gorilla2.action = this.brain.predict(input.theta2, input.theta1, input.dist);
				this.gorilla2.chargeShot();
				
				this.status = this.STATUS_GAME_PLAY_SHOT;
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
						this.gfxView2.clear();
					
					// if banana1 hit a building
					} else if (this.banana1.isHitBuilding()){
						this.drawBananaExplosion(this.banana1);
						this.gorilla1.correctShot(this.gorilla2);
					
					// if banana1 goes out of the world bounds
					} else if (this.banana1.isOutOfBounds()){
						this.gorilla1.correctShot(this.gorilla2);
					}
				}
				
				// check collisions between the objects and banana2 launched by gorilla2
				if (this.banana2.alive){
					// if banana2 hit the gorilla1
					if (this.banana2.isHitTarget(this.gorilla1)){
						this.drawBananaExplosion(this.gorilla1);
						this.banana2.kill();
						this.gorilla1.kill();
						this.gfxView1.clear();

					// if banana2 hit a building
					} else if (this.banana2.isHitBuilding()){
						this.drawBananaExplosion(this.banana2);
						this.gorilla2.correctShot(this.gorilla1);
							
					// if banana2 goes out of the world bounds
					} else if (this.banana2.isOutOfBounds()){
						this.gorilla2.correctShot(this.gorilla1);
					}
				}
				
				// if both bananas are not alive, then create a new level
				if (!this.banana1.alive && !this.banana2.alive){
					this.status = this.STATUS_GAME_CREATE_LEVEL;
				}
				
				break;

			// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// initialize data collecting
			// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			case this.STATUS_DATA_COLLECT_INIT:
				console.log("Collecting data...");
			
				// disable all buttons
				this.ui.setButtons(false);
				
				// change the frames for Data Collect button to show the "Stop Data Collect" title
				this.ui.btnCollect.setFrames(3, 3, 3, 3);
				
				// enable Stop Data Collect button
				this.ui.enableButton(this.ui.btnCollect, true);
				
				// define the number of the currently collected records
				this.rec_counter = 0;
				
				// define the number of processed gorillas positions for the current level layout
				// (each gorilla can be placed on 4 different buildings, so there are 4*4=16 different positions per level)
				this.pos_counter = 16;
				
				// hide bananas during data collecting
				this.banana1.kill();
				this.banana2.kill();
				
				// scale down both gorillas as much as possible to get more accurate shots (data records)!
				this.gorilla1.scale.setTo(App.GORILLA_SCALE_X, App.GORILLA_SCALE_Y);
				this.gorilla2.scale.setTo(App.GORILLA_SCALE_X, App.GORILLA_SCALE_Y);
				
				this.status = this.STATUS_DATA_COLLECT_WORK;
				break;

			// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// perform data collecting by generating trajectories using the brute-force method
			// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			case this.STATUS_DATA_COLLECT_WORK:
				// if all positions are processed, then make a new level
				if (this.pos_counter == 16){
					this.makeBuildings();
					this.drawBuildings();
					
					this.pos_counter = 0;
				}
				
				// restart both gorrilas at the roof of the adjacent building
				this.gorilla1.restart(this.pos_counter%4);
				this.gorilla2.restart(9-(this.pos_counter/4>>0));
				
				// get the input parameters
				var input = this.getInputParams();
				
				// define the array to store records with output parameters
				var output = [];
				
				// define the array to store points of all trajectory curves
				var curves = [];
			
				// Just a variable to make the trajectory match the actual track a little better.
				// The mismatch is probably due to rounding or the physics engine making approximations.
				var correctionFactor = 0.99;
				
				// define the rectangles of the banana and target gorilla, so we can test if they collide
				var rectBanana = new Phaser.Rectangle(0, 0, 8, 8);
				var rectTarget = new Phaser.Rectangle(this.gorilla2.x-this.gorilla2.width/2, this.gorilla2.y, this.gorilla2.width, this.gorilla2.height);
				
				// clear the bitmap for drawing trajectories
				this.bmpTrajectory.clear();

				// set fill style to white
				this.bmpTrajectory.context.fillStyle = 'rgba(255, 255, 255, 0.9)';
				
				// generate trajectories for all angles and powers
				for (var angle=App.MIN_ANGLE; angle<=App.MAX_ANGLE; angle++){
					var theta = -angle * (Math.PI / 180); // degs to rads
					var cos = Math.cos(theta);
					var sin = Math.sin(theta);
						
					var xstart = cos + this.gorilla1.x;
					var ystart = sin + this.gorilla1.y;
					
					for (var power=App.MIN_POWER; power<=App.MAX_POWER; power+=40){
						var points=[];
						
						var power_cos = power * cos * correctionFactor;
						var power_sin = power * sin * correctionFactor;
						
						var step=0.06;
						for (var t=0.0; t<10; t+=step){
							// calculate the XY point of the next segment of the trajectory(angle, power)
							var x = xstart + (power_cos * t);
							var y = ystart + (power_sin * t + 0.5 * App.GRAVITY * t * t);
							
							// if we are very close to the target (distance<20 pixels) then reduce the step number to avoid a miss
							if (x>this.gorilla2.x-20) step=0.01;
							
							// store the XY point to the array
							points.push({x:x, y:y});
							
							// update position of the banana rectangle
							rectBanana.x = x - 4; 
							rectBanana.y = y - 4;
							
							// to check if the trajectory is in interaction with the game world,
							// we can use the banana1 sprite, so we need to update its position also
							this.banana1.x = x;
							this.banana1.y = y;
							
							if (this.banana1.isHitBuilding() || this.banana1.isOutOfBounds()){
								// if the banana hits the building or goes out of the world bounds, exit the loop
								break;
								
							} else if (rectBanana.intersects(rectTarget)){
								// else if the banana intersects with the target, store the output data and curve points
								output.push({angle: angle, power: power});
								curves.push(points);
								
								// show the trajectory by drawing line segments using stored points
								for (var i=1; i<points.length; i++){
									this.bmpTrajectory.line(points[i-1].x, points[i-1].y, points[i].x, points[i].y);
								}
								break;
							}
						}
					}
				}
				
				// if we found at least one output trajectory...
				if (output.length>0){				
					// store the input/output data for the middle trajectory (it should be the best output choice)
					var mid = output.length / 2 >> 0;
					this.addData(this.dataset, input, output[mid]);
					
					// increase the counter of processed positions
					this.pos_counter++;
					
					// increase the counter of collected data records
					this.rec_counter++;
					
					// scale the target gorilla back to the size used for data collecting
					this.gorilla2.scale.x = App.GORILLA_SCALE_X;
					this.gorilla2.scale.y = App.GORILLA_SCALE_Y;
					this.gorilla2.restart();

				// ... else if there is no any output trajectory then scale up the target gorilla and try again
				} else {
					this.gorilla2.scale.x = App.GORILLA_SCALE_X*2;
					this.gorilla2.scale.y += App.GORILLA_SCALE_Y;
					this.gorilla2.restart();
				}
				
				this.ui.printCollectPercent(this.rec_counter, App.RECORDS_TO_COLLECT);
				this.ui.printDatasetInfo();
				
				// if we reached the number of data records we want to collect, then save the dataset
				if (this.rec_counter == App.RECORDS_TO_COLLECT){
					this.status = this.STATUS_DATA_COLLECT_SAVE;
				}
				
				break;
				
			// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// save the datasets
			// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			case this.STATUS_DATA_COLLECT_SAVE:
				console.log("Collecting data completed.");
				console.log("Saving Dataset.");
				
				// clear the text about the current collecting percentage
				this.ui.printCollectPercent(-1);
			
				var blob = new Blob([Uint8Array.from(this.dataset)], {type: "application/octet-stream"});
				saveAs(blob, "dataset.bin");
								
				// hide the bitmap with trajectories by clearing it
				this.bmpTrajectory.clear();
				
				// change the frames for Data Collect button to show the "Start Data Collect" title
				this.ui.btnCollect.setFrames(0, 0, 0, 0);
				
				// refresh data with new dataset
				this.brain.prepareData(this.dataset);
				
				this.status = this.STATUS_GAME_CREATE_LEVEL;
				break;
				
			// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// train the Neural Network model
			// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			case this.STATUS_MODEL_TRAIN:
				if (!this.wait){
					console.log("Training model...");
					
					this.banana1.kill();
					this.banana2.kill();
					this.ui.setButtons(false);
				
					this.brain.train();
					this.wait = true;

				} else {
					if (this.brain.isTrainCompleted){
						console.log("Training completed. [training iterations = " + this.brain.trainIteration + "]");

						this.ui.printTrainPercent(-1);
						
						this.wait = false;
						this.status = this.STATUS_GAME_INIT;
					}
				}
				
				break;
				
			// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// load the pre-trained Neural Network model
			// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			case this.STATUS_MODEL_LOAD:
				if (!this.wait){
					console.log("Loading model...");
				
					this.banana1.kill();
					this.banana2.kill();
					this.ui.setButtons(false);
					
					this.brain.load();
					this.wait = true;
					
				} else {
					if (this.brain.isModelLoaded){
						console.log("Loading completed.");
						this.wait = false;
						this.status = this.STATUS_GAME_INIT;
					}
				}
				
				break;

			// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			// save the Neural Network model
			// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
			case this.STATUS_MODEL_SAVE:
				if (!this.wait){
					console.log("Saving model...");
				
					this.banana1.kill();
					this.banana2.kill();
					this.ui.setButtons(false);
					
					this.brain.save();				
					this.wait = true;
					
				} else {
					if (this.brain.isModelSaved){
						console.log("Saving model completed. [training iterations = " + this.brain.trainIteration + "]");
						this.wait = false;
						this.status = this.STATUS_GAME_CREATE_LEVEL;
					}
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
	},
	
	/**
	* Gets the input parameters for the Neural Network using gorillas positions and buildings layout.
	*/
	getInputParams: function(){
		// initialize input parameters
		var input = {
			dist  : this.gorilla2.x - this.gorilla1.x,	// distance between gorillas
			theta1: -180, x1: -1, y1: -1,				// view line parameters of the left gorilla
			theta2: -180, x2: -1, y2: -1				// view line parameters of the right gorilla
		};
		
		// find the highest viewing angle for both gorillas using the heights of all the buildings
		for (var i=this.gorilla1.platform; i<=this.gorilla2.platform; i++){
			var viewLine1 = this.calcViewLine(this.gorilla1, this.buildings[i]);
			var viewLine2 = this.calcViewLine(this.gorilla2, this.buildings[i]);
			
			if (viewLine1.theta > input.theta1){
				input.theta1 = viewLine1.theta;
				input.x1 = viewLine1.x;
				input.y1 = viewLine1.y;
			}
			
			if (viewLine2.theta >= input.theta2){
				input.theta2 = viewLine2.theta;
				input.x2 = viewLine2.x;
				input.y2 = viewLine2.y;
			}
		}
		
		// draw the viewing lines for both gorillas
		this.drawLine(this.gfxView1, this.gorilla1.x, this.gorilla1.y, input.x1, input.y1, 0x000000);
		this.drawLine(this.gfxView2, this.gorilla2.x, this.gorilla2.y, input.x2, input.y2, 0xBE906F);
		
		return input;
	},
	
	/**
	* Calculates parameters of the viewing line between a gorilla and a building.
	*/
	calcViewLine: function(gorilla, building){
		var y = building.y;						// top of the building
		var x1 = building.x;					// left edge of the building
		var x2 = building.x + building.width;	// right edge of the building
		
		var dy = gorilla.y - y;							// height(gorilla top - building top)
		var dx1 = gorilla.direction * (x1 - gorilla.x);	// distance(gorilla - building left edge)
		var dx2 = gorilla.direction * (x2 - gorilla.x);	// distance(gorilla - building right edge)
		
		// calculate angle between the gorilla and the left edge of the building
		var theta1 = -1000;
		if (x1>this.gorilla1.x && x1<this.gorilla2.x){
			theta1 = Math.atan2(dy, dx1);
			theta1 = Math.ceil(theta1 * (180 / Math.PI)); // rads to degs = (-180, 180]
		}
		
		// calculate angle between the gorilla and the right edge of the building
		var theta2 = -1000;
		if (x2>this.gorilla1.x && x2<this.gorilla2.x){
			theta2 = Math.atan2(dy, dx2);
			theta2 = Math.ceil(theta2 * (180 / Math.PI)); // rads to degs = (-180, 180]
		}
		
		// return the view line with the bigger angle
		if (theta1>theta2) return {theta:theta1, x:x1, y:y};
		else return {theta:theta2, x:x2, y:y};
	},
	
	/**
	* Draws a line on a graphics object.
	*/
	drawLine: function(graphics, x1, y1, x2, y2, color){
		graphics.clear();
		graphics.lineStyle(4, color);
		graphics.moveTo(x1, y1);
		graphics.lineTo(x2, y2);
	},
	
	/**
	* Adds collected input/output data to an array mapping it into 1-byte numbers [0-255]
	*/
	addData: function(array, input, output){
		array.push(
			input.theta1+90,
			input.theta2+90,
			input.dist/16,
			output.angle,
			output.power/40,							
		);
	}
};
