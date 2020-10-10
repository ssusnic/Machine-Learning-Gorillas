/***********************************************************************************
*
* PROGRAM:
*	Gorillas AI Bot
*
* MODULE:	
*	ui.js - UI Class (User Interface)
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
// UI Constructor
// ---------------------------------------------------------------------------------

var UI = function(main){
	// reference to the Main State
	this.main = main;
	
	// reference to the Phaser Game object
	this.game = this.main.game;
	
	// create buttons
	this.btnCollect = this.game.add.button(10, 634, 'imgButtons', this.onCollectClick, this, 0, 0, 0, 0);
	this.btnTrain = this.game.add.button(108, 634, 'imgButtons', this.onTrainClick, this, 1, 1, 1, 1);
	this.btnSave = this.game.add.button(206, 634, 'imgButtons', this.onSaveClick, this, 2, 2, 2, 2);
	
	this.btnAuthor = this.game.add.button(970, 693, 'btnAuthor', this.onMoreGamesClick, this);
	
	// create a text object for showing dataset info (name and number of records)
	this.txtDataset = this.game.add.text(350, 695, "", {font: "18px Arial", fill: "#000"});
	
	// create a text object for showing the number of currently processed training iterations
	this.txtTrainIter = this.game.add.text(650, 695, "", {font: "18px Arial", fill: "#000"});
	
	// create a text object for showing the current percent of the model training
	this.txtTrainPerc = this.game.add.text(640, 70, "", {font: "48px Arial", fill: "#FFF", align: "center"});
	this.txtTrainPerc.anchor.setTo(0.5, 0); // center align
	
	// create a text object for showing the current percent of the data collecting
	this.txtCollectPerc = this.game.add.text(640, 620, "", {font: "36px Arial", fill: "#000", align: "center"});
	this.txtCollectPerc.anchor.setTo(0.5, 0); // center align
};

// ---------------------------------------------------------------------------------
// UI Prototype
// ---------------------------------------------------------------------------------

/**
* Enables/disables all buttons at once.
*/
UI.prototype.setButtons = function(isEnabled){
	this.enableButton(this.btnCollect, isEnabled);
	this.enableButton(this.btnTrain, isEnabled);
	this.enableButton(this.btnSave, isEnabled);
};

/**
* Enables/disables a special button.
*/
UI.prototype.enableButton = function(button, isEnabled){
	button.input.enabled = isEnabled;
	button.alpha = isEnabled ? 1 : 0.3;
};

/**
* Opens Official Web Site on pressing "Play More Games" button.
*/  
UI.prototype.onMoreGamesClick = function(){
	window.open("http://www.askforgametask.com", "_blank");
};

/**
* Triggers on pressing "Start/Stop Data Collect" button.
*/ 
UI.prototype.onCollectClick = function(){
	if (this.main.status == this.main.STATUS_DATA_COLLECT_WORK){
		// stop data collecting
		this.main.status = this.main.STATUS_DATA_COLLECT_SAVE;
		
	} else {
		// start data collecting
		this.changeGameStatus(this.main.STATUS_DATA_COLLECT_INIT);
	}
};

/**
* Triggers on pressing "Train" button.
*/ 
UI.prototype.onTrainClick = function(){
	this.changeGameStatus(this.main.STATUS_MODEL_TRAIN);
};

/**
* Triggers on pressing "Save" button.
*/ 
UI.prototype.onSaveClick = function(){
	this.changeGameStatus(this.main.STATUS_MODEL_SAVE);
};

/**
* Changes the current game status only if the stated condition is true.
*/ 
UI.prototype.changeGameStatus = function(newMainStatus){
	if (this.main.status == this.main.STATUS_GAME_PLAY_SHOT || this.main.status == this.main.STATUS_GAME_PLAY_AIM){
		this.main.status = newMainStatus;
	}
}

/**
* Prints the current training percentage.
*/
UI.prototype.printTrainPercent = function(value){
	this.txtTrainPerc.text = value<0 ? "" : "Training: " + value + " %";
};

/**
* Prints the current data collecting percentage.
*/
UI.prototype.printCollectPercent = function(value, max){
	var percent = (value / max)*100;
	this.txtCollectPerc.text = value<0 ? "" : "Collecting Data: " + percent.toFixed(1) + "%";
};

/**
* Prints the dataset info.
*/
UI.prototype.printDatasetInfo = function(){
	var num_records = this.main.dataset.length/5;	

	this.txtDataset.text = "DATASET: " + num_records + " data records" ;
	this.txtTrainIter.text = "TRAINING: " + this.main.brain.trainIteration + " iterations";
};