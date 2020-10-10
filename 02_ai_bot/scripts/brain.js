/***********************************************************************************
*
* PROGRAM:
*	Gorillas AI Bot
*
* MODULE:	
*	brain.js - Brain Class (Neural Network)
*
* EXTERNAL LIBRARIES:
*	phaser.min.js - Phaser 2 Framework
*	tensorflow.js - TensorFlow JS Library
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
// Brain Constructor
// ---------------------------------------------------------------------------------

var Brain = function(main){
	// reference to the Main State
	this.main = main;
	
	// set the bounds of the input data
	this.BOUND_THETA = {min: tf.tensor(-90), max: tf.tensor(90)};
	this.BOUND_DIST  = {min: tf.tensor(0), max: tf.tensor(App.WORLD_WIDTH)};
	
	// set the bounds of the output data
	this.BOUND_ANGLE = {min: tf.tensor(App.MIN_ANGLE), max: tf.tensor(App.MAX_ANGLE)};
	this.BOUND_POWER = {min: tf.tensor(App.MIN_POWER), max: tf.tensor(App.MAX_POWER)};
	
	// set the batch size
	this.BATCH_SIZE = 100;
	
	// number of currently processed training iterations
	this.trainIteration = 0;
	
	// array to store model's loss values during training
	this.aLoss = [];
	
	// create the model
	this.createModel();
	
	// print out model summary on the console
	console.log("Neural Network Model created:");
	this.model.summary();
};

// ---------------------------------------------------------------------------------
// Brain Prototype
// ---------------------------------------------------------------------------------

/**
* Create a new Neural Network model.
*/
Brain.prototype.createModel = function(){
	// use a sequential model where tensors are consecutively passed from one layer to the next 
	this.model = tf.sequential();
	
	// add hidden layer 
	this.model.add(tf.layers.dense({
		inputShape: [3],
		units: 16,
		useBias: false,
		kernelInitializer: 'Zeros'
	}));
	
	// add output layer
	this.model.add(tf.layers.dense({
		units: 2
	}));

	// compile the model
	this.model.compile({
		optimizer: tf.train.sgd(0.1), // use SGD optimizer
		loss: tf.losses.meanSquaredError, // loss function
	});
}

/**
* Prepares training data.
*/
Brain.prototype.prepareData = function(dataset){
	// all data in the dataset are byte values [0-255] to be saved to a binary file, 
	// so at first we need to map them back to the real values
	this.dataTable = [];
	
	for (var i=0; i<dataset.length; i+=5){
		this.dataTable.push({
			in_theta1 : dataset[i] - 90,
			in_theta2 : dataset[i+1] - 90,
			in_distan : dataset[i+2] * 16,
			out_angle : dataset[i+3],
			out_power : dataset[i+4] * 40,
		});
	}
	
	// all data must be converted to tensors before being passed to the neural network
	this.dataTensor = this.convertToTensor();
	
	console.log("Data prepared. [data records = " + this.dataTable.length + "]");
}

/**
* Converts training data to tensors.
*/
Brain.prototype.convertToTensor = function(){
	return tf.tidy(() => {
		// shuffle the data
		tf.util.shuffle(this.dataTable);
		
		// map each column of the data table to its special array
		const colInTheta1 = this.dataTable.map(d => d.in_theta1);
		const colInTheta2 = this.dataTable.map(d => d.in_theta2);
		const colInDistan = this.dataTable.map(d => d.in_distan);
		const colOutAngle = this.dataTable.map(d => d.out_angle);
		const colOutPower = this.dataTable.map(d => d.out_power);

		// convert arrays to tensors
		var tensorInTheta1 = tf.tensor2d(colInTheta1, [colInTheta1.length, 1]);
		var tensorInTheta2 = tf.tensor2d(colInTheta2, [colInTheta2.length, 1]);
		var tensorInDistan = tf.tensor2d(colInDistan, [colInDistan.length, 1]);
		var tensorOutAngle = tf.tensor2d(colOutAngle, [colOutAngle.length, 1]);
		var tensorOutPower = tf.tensor2d(colOutPower, [colOutPower.length, 1]);
		
		// normalize the tensors to the range 0-1
		tensorInTheta1 = this.normalize(tensorInTheta1, this.BOUND_THETA);
		tensorInTheta2 = this.normalize(tensorInTheta2, this.BOUND_THETA);
		tensorInDistan = this.normalize(tensorInDistan, this.BOUND_DIST);
		tensorOutAngle = this.normalize(tensorOutAngle, this.BOUND_ANGLE);
		tensorOutPower = this.normalize(tensorOutPower, this.BOUND_POWER);
		
		// return the training data converted to tensors
		return {
			inputs: tf.concat([tensorInTheta1.square(), tensorInTheta2.pow(tf.scalar(3, 'int32')), tensorInDistan], 1),
			labels: tf.concat([tensorOutAngle, tensorOutPower], 1)
		}
	});
}

/**
* Normalize the tensor to the range 0-1 using min-max scaling
*/
Brain.prototype.normalize = function(tensor, bound){
	return tensor.sub(bound.min).div((bound.max).sub(bound.min));
}

/**
* Un-normalize the tensor by doing the inverse of the min-max scaling
*/
Brain.prototype.unnormalize = function(tensor, bound){
    return tensor.mul(bound.max.sub(bound.min)).add(bound.min);
}
	  
/**
* Trains the model.
*/
Brain.prototype.train = async function(){
	// reset the training flag to know the training is currently in progress
	this.isTrainCompleted = false;

	// increase the number of training iterations
	this.trainIteration++;
	
	// start with the training!
	const training = await this.model.fit(
		this.dataTensor.inputs,
		this.dataTensor.labels,
		{batchSize: this.BATCH_SIZE, epochs: 1, shuffle: true, callbacks: {onBatchEnd: this.onBatchEnd.bind(this)}}
	);
		
	// mitigate blocking the UI thread and freezing the tab during training
	await tf.nextFrame();
  
	// set the training flag to know the training is completed
	this.isTrainCompleted = true;
};

/**
* Called during the training, every time when batch of data is processed, to show the training progress.
*/
Brain.prototype.onBatchEnd = function(batch, logs){
	// show the current percentage of the training
	var data_size = this.dataTensor.inputs.shape[0];
	var train_percent = ((batch+1)*this.BATCH_SIZE / data_size)*100;
	this.main.ui.printTrainPercent(train_percent.toFixed(1));
}

/**
* Predicts the output action using input parameters.
*/
Brain.prototype.predict = function(theta1, theta2, distan){
	// convert input parameters to the input tensors
	var tensorInTheta1 = tf.tensor2d([theta1], [1, 1]);
	var tensorInTheta2 = tf.tensor2d([theta2], [1, 1]);
	var tensorInDistan = tf.tensor2d([distan], [1, 1]);

	// normalize the input tensors to the range 0-1
	tensorInTheta1 = this.normalize(tensorInTheta1, this.BOUND_THETA);
	tensorInTheta2 = this.normalize(tensorInTheta2, this.BOUND_THETA);
	tensorInDistan = this.normalize(tensorInDistan, this.BOUND_DIST);
	
	// concatenate all input tensors
	const input = tf.concat([tensorInTheta1.square(), tensorInTheta2.pow(tf.scalar(3, 'int32')), tensorInDistan], 1);
	
	// dispose temporary tensors
	tf.dispose(tensorInTheta1);
	tf.dispose(tensorInTheta2);
	tf.dispose(tensorInDistan);
	
	// initialize the prediction values
	var prediction = {angle: 0, power: 0};
	
	tf.tidy(() => {
		// get the output tensor from the model
		const output = this.model.predict(input);
		
		// split the output tensor into two sub-tensors
		const [outAngle, outPower] = tf.split(output, 2, 1);
	
		// unnormalize the sub-tensors to get the final prediction values for angle and power
		prediction.angle = (this.unnormalize(outAngle, this.BOUND_ANGLE)).dataSync()[0];
		prediction.power = (this.unnormalize(outPower, this.BOUND_POWER)).dataSync()[0];
		
		tf.dispose(input);
		tf.dispose(output);
	});

	return prediction;
};

/**
* Loads a pre-trained model.
*/
Brain.prototype.load = async function(){
	// reset the flag to know that loading of the model is currently in progress
	this.isModelLoaded = false;
	
	// define the loading error flag
	var loadError = false;
	
	// dispose all variables kept in backend engine
	tf.disposeVariables();
	
	// try to load the model
	try {
		this.model = await tf.loadLayersModel(
			'../model/trained_model_'+App.pretrained_model+'.json'
		);
	} catch(error) {
		console.log("The model could not be loaded: " + error);
		loadError = true;
	}
	
	if (loadError){
		// if a pre-trained model cannot be loaded, then create a new one 
		this.createModel();
		this.trainIteration = 0;
		
	} else {
		// if a pre-trained model is loaded, then compile it
		this.model.compile({
			optimizer: tf.train.sgd(0.05), // SGD optimizer
			loss: tf.losses.meanSquaredError, // loss function
		});
			
		// set the number of already processed training iterations for the pretrained model
		this.trainIteration = App.pretrained_model;
		
		console.log("Loaded a pre-trained model [training iterations = " + this.trainIteration + "]");
	}
	
	// set the flag to know that the model is loaded
	this.isModelLoaded = true;
};

/**
* Saves the model.
*/
Brain.prototype.save = async function(){
	// reset the flag to know that saving of the model is currently in progress
	this.isModelSaved = false;
	
	// save the model naming it with the current number of training iterations
	const saveResult = await this.model.save('downloads://trained_model_'+this.trainIteration);
	
	// set the flag to know that the model is saved
	this.isModelSaved = true;
};