# Machine-Learning-Gorillas
In this tensorflow js project, AI learns to play Gorillas game using supervised machine learning algorithms. 

If you want to watch how I did this project, here is the video:  
https://youtu.be/ySANlOrdsQE

To predict the outputs, this AI bot uses a simple neural network with 3 inputs, 16 hidden nodes and 2 outputs. 

The network is trained by applying polynomial regression to a bunch of data, previously collected by the brute-force method.  

The project is consisted of 2 parts:
1. implementing original game
2. implementing AI Bot using supervised machine learning

The prototypes of both parts are stored in this repository.

The game is programmed in Javascript using [Phaser 2 framework](http://phaser.io/) and [TensorFlow.js library](https://js.tensorflow.org/).

Here you can run the AI Bot game and read the complete tutorial:  
https://www.askforgametask.com/tutorial/machine-learning/gorillas-ai-bot/

If you just want to play original Gorrilas game with your friend, go here:  
https://www.askforgametask.com/game/gorillas/

Official website:  
https://www.askforgametask.com


## Game Prototype

The game prototype is stored in the **\01_game** folder.  
It has the following subfolders:
- **\assets** - contains all the assets
- **\libs** - contains all the needed libraries
- **\scripts** - contains the source code files


## AI Bot Prototype

The AI Bot prototype is stored in the **\02_ai_bot** folder.  
It has the following subfolders:
- **\assets** - contains all the assets
- **\data** - contains the training dataset with 100,000 data records
- **\libs** - contains all the needed libraries
- **\model** - contains a pre-trained neural network model
- **\scripts** - contains the source code files


## Setup

To run javascript apps locally, you need a local web server.

So, here are the instructions how to set up this project to run it on XAMPP web server (if you already have some server installed on your computer then skip to the step 3):
1. install XAMPP on your computer (for instance in **C:\Xampp** folder)
2. configure and run the server (read the server's manual or help if you don't know how to do that)
3. navigate to the server document root: **C:\Xampp\htdocs**
4. create a new folder called 'gorillas': **C:\Xampp\htdocs\gorillas**
5. download the project
6. copy all project files directly in **C:\Xampp\htdocs\gorillas**
7. now you should have the following folder structure:  
  - **C:\Xampp\htdocs\gorillas**  
    - **\01_game**  
      - **\assets** 
      - **\libs**  
      - **\scripts**  
    - **\02_ai_bot**  
      - **\assets**  
      - **\data**  
      - **\libs**  
      - **\model**  
      - **\scripts**  
8. to run the game, open a web browser and navigate to  
  **http\://localhost:\<port\>/gorillas/01_game/scripts**
9. to run AI Bot simulation, open a web browser and navigate to  
  **http\://localhost:\<port\>/gorillas/02_ai_bot/scripts**  
  

