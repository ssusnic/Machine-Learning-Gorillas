/***********************************************************************************
*
* PROGRAM:
*	Gorillas
*
* MODULE:	
*	gorilla.js - Gorilla Class : extends Phaser.Sprite
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

// ---------------------------------------------------------------------------------
// Gorilla Constructor
// ---------------------------------------------------------------------------------

var Gorilla = function(main, id, banana) {
	// extending Phaser.Sprite
	Phaser.Sprite.call(this, main.game, 0, 0, 'imgGorilla'+id);
	
	// reference to the Main State
	this.main = main;
	
	// define the gorilla id number (1 or 2)
	this.id = id;
	
	// set the gorilla's banana
	this.banana = banana;
	
	// define the shooting direction factor
	this.direction = (id==1) ? 1 : -1;
	
	// set the origin point (x=center, y=top)
	this.anchor.setTo(0.5, 0);
	
	// don't show Gorilla until the game starts
	this.kill();
	
	// add Gorilla to the game world
	this.game.add.existing(this);
};

// ---------------------------------------------------------------------------------
// Gorilla Prototype
// ---------------------------------------------------------------------------------

Gorilla.prototype = Object.create(Phaser.Sprite.prototype);
Gorilla.prototype.constructor = Gorilla;

/**
* Restarts gorilla at the roof of the given building platform.
*/
Gorilla.prototype.restart = function(platform){
	if (platform !== undefined){
		this.platform = platform;
	}
	
	var building = this.main.buildings[this.platform];	
	this.reset(building.x + building.width/2, building.y-this.height);
	
	// the coordinates of the launcher line
	this.launcher = {x:this.x, y:this.y};
};

/**
* Calculates shooting parameters and launches banana.
*/
Gorilla.prototype.chargeShot = function(toX, toY){
	// save the coordinates of the launcher
	this.launcher.x = toX
	this.launcher.y = toY;
	
	// calculate dx and dy lengths using launcher coordinates
	var dx = this.launcher.x - this.x;
	var dy = -(this.launcher.y - this.y);
	
	// calculate angle
	var angle = Math.atan2(dy, dx) * (180 / Math.PI); // rads to degs, range (-180, 180]
	if (angle < 0) angle += 360; // range [0, 360)
	
	// calculate power
	var power = Math.sqrt(dx*dx + dy*dy) * 6;
	
	// launch banana using calculated shooting parameters
	this.banana.restart(this.x, this.y);
	this.banana.launch(angle, power);
};
