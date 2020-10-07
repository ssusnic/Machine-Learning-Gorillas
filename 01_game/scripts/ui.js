/***********************************************************************************
*
* PROGRAM:
*	Gorillas
*
* MODULE:	
*	ui.js - UI Class (User Interface)
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
// UI Constructor
// ---------------------------------------------------------------------------------

var UI = function(main){
	// reference to the Main State
	this.main = main;
	
	// reference to the Phaser Game object
	this.game = this.main.game;

	// create buttons
	this.btnAuthor = this.game.add.button(970, 693, 'btnAuthor', this.onMoreGamesClick, this);
};

// ---------------------------------------------------------------------------------
// UI Prototype
// ---------------------------------------------------------------------------------

/**
* Triggers on pressing "Play More Games" button.
*/  
UI.prototype.onMoreGamesClick = function(){
	window.open("http://www.askforgametask.com", "_blank");
};
