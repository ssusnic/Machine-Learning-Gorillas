/***********************************************************************************
*
* PROGRAM:
*	Gorillas AI Bot
*
* MODULE:	
*	banana.js - Banana Class : extends Phaser.Sprite
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
// Banana Constructor
// ---------------------------------------------------------------------------------

var Banana = function(main) {
	// extending Phaser.Sprite
	Phaser.Sprite.call(this, main.game, 0, 0, 'imgBanana');
	
	// reference to the Main State
	this.main = main;
	
	// define the banana radius
	this.radius = (this.width/2)>>0;
	
	// set the origin point (x=center, y=middle)
	this.anchor.setTo(0.5);
	
	// don't show Banana until the game starts
	this.kill();
	
	// enable physics on Banana
	this.game.physics.arcade.enableBody(this);
	
	// add Banana to the game world
	this.game.add.existing(this);
};

// ---------------------------------------------------------------------------------
// Banana Prototype
// ---------------------------------------------------------------------------------

Banana.prototype = Object.create(Phaser.Sprite.prototype);
Banana.prototype.constructor = Banana;

/**
* Restarts banana at the given XY position.
*/
Banana.prototype.restart = function(x, y){
	this.reset(x, y);
	this.body.allowGravity = false;
};

/**
* Launches banana using the angle and power of the shot.
*/
Banana.prototype.launch = function(angleDeg, power){
	// convert angle from degs to rads
	if (angleDeg > 180) angleDeg -= 360;
	var angleRad = -angleDeg * (Math.PI / 180);
	
	// set the banana's starting position (over the gorilla's head)
	var startPower = Math.sign(power) * 1;
	this.x += startPower * Math.cos(angleRad);
	this.y += startPower * Math.sin(angleRad)*40;
	
	// set the banana's velocity
	this.body.velocity.x = power * Math.cos(angleRad);
	this.body.velocity.y = power * Math.sin(angleRad);
	
	// enable the gravity
	this.body.allowGravity = true;
};

/**
* Checks if banana hit gorilla.
*/
Banana.prototype.isHitTarget = function(gorilla){
	var boundsA = this.getBounds();
	var boundsB = gorilla.getBounds();

	return Phaser.Rectangle.intersects(boundsA, boundsB);
};

/**
* Checks if banana is out of the world bounds.
*/
Banana.prototype.isOutOfBounds = function(){
	return 	(this.x - this.width > App.WORLD_WIDTH) |
			(this.x + this.width < 0) | 
			(this.y - this.height > App.WORLD_HEIGHT);
};

/**
* Checks if banana hit a building.
*/
Banana.prototype.isHitBuilding = function(){
	// convert banana coordinates to integer values
	var x = this.x>>0;
	var y = this.y>>0;
	var r = this.radius>>0;
	
	// check the pixel colors of the background using 4 points on the banana circle
	var color1 = this.checkPixelColor(x-r, y-r);
	var color2 = this.checkPixelColor(x-r, y+r);
	var color3 = this.checkPixelColor(x+r, y-r);
	var color4 = this.checkPixelColor(x+r, y+r);
	
	// return true (a building is hit) if any of the previous 4 pixel colors is not the background color
	return !color1 | !color2 | !color3 | !color4;
};

/**
* Returns true if the pixel color at (x, y) is the equal to the background (sky) color
*/
Banana.prototype.checkPixelColor = function(x, y){
	if (x<0 || x>App.WORLD_WIDTH || y<0 || y>App.WORLD_HEIGHT){
		return true;
	
	} else {
		var pixel = this.main.bmpWorld.getPixel(x, y);
		
		var r = pixel.r;
		var g = pixel.g;
		var b = pixel.b;
		
		// We need to compare these rgb parameters with the back color using a tolerance of -1 / +1
		// because it seems that getPixel() returns rgb parameters with a mismatch around the real value
		return ( 
			(r>=App.BACK_COLOR.r-1 & r<=App.BACK_COLOR.r+1) &
			(g>=App.BACK_COLOR.g-1 & g<=App.BACK_COLOR.g+1) &
			(b>=App.BACK_COLOR.b-1 & b<=App.BACK_COLOR.b+1)
		);
	}
};
