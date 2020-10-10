/***********************************************************************************
*
* PROGRAM:
*	Gorillas AI Bot
*
* MODULE:	
*	gorilla.js - Gorilla Class : extends Phaser.Sprite
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
		
		this.action = {angle: 0, power: 0};
		this.correction = {angle: 0, power: 0};
	}
	
	var building = this.main.buildings[this.platform];	
	this.reset(building.x + building.width/2, building.y-this.height);
};

/**
* Calculates shooting parameters and launches banana.
*/
Gorilla.prototype.chargeShot = function(){
	// calculate shooting parameters
	var angle = this.action.angle + this.correction.angle;
	var power = this.action.power + this.correction.power;
	
	// limit parameters between a min/max value
	angle = Math.min(Math.max(angle, App.MIN_ANGLE), App.MAX_ANGLE);
	power = Math.min(Math.max(power, App.MIN_POWER), App.MAX_POWER);
	
	// set direction of the shot
	angle *= this.direction;
	power *= this.direction;
	
	// launch banana using calculated shooting parameters
	this.banana.restart(this.x, this.y);
	this.banana.launch(angle, power);
};

/**
* Calculates parameters to correct a missed shot only if both gorillas are still alive.
*/
Gorilla.prototype.correctShot = function(gorillaTarget){
	if (this.alive && gorillaTarget.alive){
		// if both gorillas are still alive, define correcting values
		var dPower = this.direction * 60;
		var dAngle = this.direction * 1;
		
		if (Math.abs(this.banana.x - this.x) < 60){
			// if the banana exploded to close to this gorilla
			this.correction.angle += dAngle*2;
			this.correction.power += dPower;
			
		} else if (this.banana.x > gorillaTarget.x){
			// if the banana exploded behind the target gorilla
			this.correction.power -= dPower;
			this.correction.angle -= dAngle;
			
		} else {
			// if the banana exploded in front of the target gorilla
			this.correction.power += dPower;
			this.correction.angle += dAngle;
		}
		
		// launch banana with correcting parameters
		this.chargeShot();
		
	} else { 
		// else if both gorillas dead, kill this banana
		this.banana.kill();
	}
};
