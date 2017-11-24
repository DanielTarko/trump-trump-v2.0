var objects = []; 
var ctx; //canvas context
var angular_velocity = 0.001; 
var delta_radius=0;
var delta_azimuth=0; 
var futureXMovement=0;
var futureYMovement=0;
var barrelIsDropping = false;
var distance = 0;
var win = false; 
var lost = false;
var loseSound;
var winSound;
var soundPlayed = false;
var height = 0;
var scrolling = true;
var moveAmount = 200;
var playerSelected = false;


window.onload = function(){
    var canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");
    ctx.moveTo(0,0);
    //ctx.translate(600, 300); 
    addImages(); 
    addEventListeners(); 
    playSound();
    MainLoop.setUpdate(update).setDraw(draw).setEnd(end).start();
    var parent = document.getElementById("div1");
	var child = document.getElementById("playAgainButton");
	//parent.removeChild(child);
}

//every item in the game, from the background to the player, needs one of these. 
//'sprites' can be either an array of sprite objects, in which case it's just added to the class, or as a string,
//in which case the string is assumed to point to a file where the image is stored. 
class sound{
     constructor(src) {
        this.sound = document.createElement("audio");
        this.sound.src = src;
        this.sound.setAttribute("preload", "auto");
        this.sound.setAttribute("controls", "none");
        this.sound.style.display = "none";
        document.body.appendChild(this.sound);
        this.play = function(){
            this.sound.play();
        }
        this.stop = function(){
            this.sound.pause();
        }
    }
   
}



class game_object{
    constructor(xcoord, ycoord, sprites, hitbox){
        this.x_pos = xcoord; 
        this.y_pos = ycoord; 
        if(typeof sprites == "string"){
            var sp = new sprite(sprites);
            this.sprites = new Array(); 
            this.sprites.push (sp);
        }
        else if (typeof sprites == "array"){
            this.sprites = sprites; 
        }
        else {
            console.log("The third argument to a game_object constructor must be a string or an array."); 
        }
        this.active_sprite = this.sprites[0];
        this.physics = new physics(this);
        this.hitbox = hitbox; 

        this.angle = 0; 
    }
    addSprite(sprite){
        this.sprites.push(sprite); 
    }
    activateSprite(index){ 
        //activates the sprite at 'index' in the sprites array. 
        //So if 'index' is 2, it'll activate the third sprite you pushed (because array indices start at zero).
        this.active_sprite = this.sprites[index]; 

    }
    accelerateAbsolute(x_accel, y_accel){
        if(this.physics != undefined){
            this.physics.accelerate(x_accel, y_accel);
        }
        else{
            console.log("Cannot accelerate an object without a physics member")
        }
    }
    accelerateRelative(forward_accel, lateral_accel){
        if(this.physics != undefined){
            this.physics.accelerate(Math.sin(this.angle) * forward_accel + Math.cos(this.angle) * lateral_accel, Math.cos(this.angle) * forward_accel + Math.sin(this.angle) * lateral_accel);
        }
        else{
            console.log("Cannot accelerate an object without a physics member")
        }
    }
    draw(){
        if(this.active_sprite != undefined){
            ctx.drawImage(this.active_sprite.img, this.x_pos, this.y_pos); 
        }
        else{
            console.log("Cannot draw an object without an active sprite"); 
        }
    }
    applyPhysics(){
        if(this.physics != undefined){
            this.physics.applyPhysics();
        }
        else{
            console.log("Cannot apply physics to an object without a physics member");
        }
    }
}

class sprite{
    constructor(source){
        this.img = new Image();
        this.img.src = source; 
    }
}

class physics{
    constructor(parent){
        this.x_vel = 0;
        this.y_vel = 0; 
        this.friction = 0.5;    //how much it'll slow down over time. 
        this.mass = 1;       //how much its velocity will change relative to the object it collides with
        this.elasticity = 1; //how 'bouncy' it is in a collision
        this.parent = parent; 
    }
    accelerate(x_accel, y_accel){
        this.x_vel += x_accel; 
        this.y_vel += y_accel; 
    }
    applyPhysics(){
        this.parent.x_pos += this.x_vel;
        this.parent.y_pos -= this.y_vel; 
        if(this.x_vel > 0){
            this.x_vel -= Math.min(this.friction, this.x_vel);
        }
        else if(this.x_vel < 0){
            this.x_vel -= Math.max(-this.friction, this.x_vel);
        }
        if(this.y_vel > 0){
            this.y_vel -= Math.min(this.friction, this.y_vel);
        }
        else if(this.y_vel < 0){
            this.y_vel -= Math.max(-this.friction, this.y_vel);
        }
    }
}

class hitbox{
    constructor(start_x, end_x, start_y, end_y){
        this.start_x = start_x;
        this.end_x = end_x;
        this.start_y = start_y;
        this.end_y = end_y;
    }
/*
    detectHit(barrelBox){
        if(((barrelBox.start_x > this.start_x && barrelBox.start_x < this.end_x )|| (barrelBox.end_x > this.start_x && barrelBox.end_x < this.end_x)) && 
        ((barrelBox.start_y > this.start_y && barrelBox.start_y < this.end_y )|| (barrelBox.end_y > this.start_y && barrelBox.end_y < this.end_y))){
            return true; 
        }
        return false; 
    }*/
}
 
function detectHit1(canadianBox, canadianPos, barrel1Box, barrel1Pos){
    var canadianStartX = canadianBox.start_x + canadianPos.x;
    var canadianEndX = canadianBox.end_x + canadianPos.x;
    var canadianStartY = canadianBox.start_y + canadianPos.y;
    var canadianEndY = canadianBox.end_y + canadianPos.y;

    var barrel1StartX = barrel1Box.start_x + barrel1Pos.x;
    var barrel1EndX = barrel1Box.end_x + barrel1Pos.x;
    var barrel1StartY = barrel1Box.start_y + barrel1Pos.y;
    var barrel1EndY = barrel1Box.end_y + barrel1Pos.y;

    if((barrel1StartX > canadianStartX && barrel1StartX < canadianEndX )|| (barrel1EndX > canadianStartX && barrel1EndX < canadianEndX)){
        if((barrel1StartY > canadianStartY && barrel1StartY < canadianEndY ) || (barrel1EndY > canadianStartY && barrel1EndY < canadianEndY)){
            return true; 
        }
    }
    return false; 
}

function detectHit2(canadianBox, canadianPos, barrel2Box, barrel2Pos){
    var canadianStartX = canadianBox.start_x + canadianPos.x;
    var canadianEndX = canadianBox.end_x + canadianPos.x;
    var canadianStartY = canadianBox.start_y + canadianPos.y;
    var canadianEndY = canadianBox.end_y + canadianPos.y;

    var barrel2StartX = barrel2Box.start_x + barrel2Pos.x;
    var barrel2EndX = barrel2Box.end_x + barrel2Pos.x;
    var barrel2StartY = barrel2Box.start_y + barrel2Pos.y;
    var barrel2EndY = barrel2Box.end_y + barrel2Pos.y;

 if((barrel2StartX > canadianStartX && barrel2StartX < canadianEndX )|| (barrel2EndX > canadianStartX && barrel2EndX < canadianEndX)){
        if((barrel2StartY > canadianStartY && barrel2StartY < canadianEndY ) || (barrel2EndY > canadianStartY && barrel2EndY < canadianEndY)){
            return true; 
        }
    }
    return false; 

}

function detectHit3(canadianBox, canadianPos, barrel3Box, barrel3Pos){
    var canadianStartX = canadianBox.start_x + canadianPos.x;
    var canadianEndX = canadianBox.end_x + canadianPos.x;
    var canadianStartY = canadianBox.start_y + canadianPos.y;
    var canadianEndY = canadianBox.end_y + canadianPos.y;

    var barrel3StartX = barrel3Box.start_x + barrel3Pos.x;
    var barrel3EndX = barrel3Box.end_x + barrel3Pos.x;
    var barrel3StartY = barrel3Box.start_y + barrel3Pos.y;
    var barrel3EndY = barrel3Box.end_y + barrel3Pos.y;

     if((barrel3StartX > canadianStartX && barrel3StartX < canadianEndX )|| (barrel3EndX > canadianStartX && barrel3EndX < canadianEndX)){
        if((barrel3StartY > canadianStartY && barrel3StartY < canadianEndY ) || (barrel3EndY > canadianStartY && barrel3EndY < canadianEndY)){
            return true; 
        }
    }
    return false; 
}


function addImages(){
    var sky = new game_object(0, 0, "./sky.png");
    var background = new game_object(0, 0, "./bigWall.png");
    var wall2 = new game_object(0, -750, "./bigWall.png");
    //sat.setFriction(0.01); 
    var trump = new game_object(275, -200, "./trump.png");
    var canadian = new game_object(400, 425, "./mexican.png");
    canadian.hitbox = new hitbox(160, 280, 80, 270);
    var barrel1 = new game_object(Math.floor(Math.random() * 1000), -100, "./barrel.png") //'new' keyword -> calls the 'constructor' function
    barrel1.hitbox = new hitbox(10, 60, 20, 85);
    var barrel2 = new game_object(Math.floor(Math.random() * 1000), -400, "./barrel.png") //'new' keyword -> calls the 'constructor' function
    barrel2.hitbox = new hitbox(10, 60, 20, 85);
    var barrel3 = new game_object(Math.floor(Math.random() * 1000), -650, "./barrel.png") //'new' keyword -> calls the 'constructor' function
    barrel3.hitbox = new hitbox(10, 60, 20, 85);
    var lowEnergyLoser = new game_object(0, 0, "./losescreen.jpg");
    var winScreen = new game_object(0,0, "./flag.jpg");
    objects.push(sky); 
    objects.push(background);
    objects.push(wall2);
    objects.push(trump); 
    objects.push(canadian);
    objects.push(barrel1);
    objects.push(barrel2);
    objects.push(barrel3);
    objects.push(lowEnergyLoser);
    objects.push(winScreen);
    
}

function playSound(){
    loseSound = new sound("./you'reFired.mp3");
    winSound = new sound("./thisLandIsYourLand.mp3");
}

/*
This bit lets you control what happens when keys get pressed!
window.addEventListener makes the browser wait for an event, in this case keypress, 
and then execute the code in the curly brackets after function. 
Of course, you can add more if statements of your own using the same syntax. 
*/
function addEventListeners(){
var canadian = objects[4]; 
var canadianButton = document.getElementById("canadian");
var mexicanButton = document.getElementById("mexican");


    window.addEventListener("keypress", function(press){
        var trump = objects[3];
        var canadian = objects[4]; 
        var barrel = objects[5];
        if(press.key == "w"){
            //canadian.accelerateAbsolute(0, 10);
            futureYMovement -= moveAmount;
        }
        if(press.key == "a"){
            canadian.x_pos--;
           //canadian.accelerateAbsolute(-10, 0);
           //futureMovement = futureMovement - 10;
           futureXMovement -= moveAmount;

            
        }
        if(press.key == "s"){
            //canadian.y_pos++;
            //canadian.accelerateAbsolute(0, -10);
           futureYMovement += moveAmount;
        }
        if(press.key == "d"){
           // canadian.x_pos=canadian.x_pos+20;
           // canadian.accelerateAbsolute(10, 0);
           futureXMovement += moveAmount; 
        }        
    });



    canadianButton.addEventListener("click", function(click){
        objects[4].active_sprite.img = new Image();

        objects[4].active_sprite.img.src = "./canadian 2.png";
        playerSelected = true;
        
       var parent = document.getElementById("div1");
		var child = document.getElementById("p1");
		parent.removeChild(child);
		parent.removeChild(mexicanButton);
		parent.removeChild(canadianButton);


  

    });
    mexicanButton.addEventListener("click", function(click){
        objects[4].active_sprite.img = new Image();

        objects[4].active_sprite.img.src = "./mexican.png";
        playerSelected = true;

        var parent = document.getElementById("div1");
		var child = document.getElementById("p1");
		parent.removeChild(child);
		parent.removeChild(mexicanButton);
		parent.removeChild(canadianButton);
      

    });

    playAgainButton.addEventListener("click", function(click){
        
        location.reload();

    });
}
function moveTrump() {  
    var trump = objects[3];
     var barrel = objects[5];
     var canadian = objects[4]; 
     var wall1 = objects[1];
    var wall2 = objects[2];  
    //if (futureMovement == 0) {
     // clearInterval(id);}
      /*if (futureMovement < 0){
     trump.x_pos--; 
     barrel.x_pos--; 
    futureMovement++;
    } else if (futureMovement > 0){
    trump.x_pos++; 
    barrel.x_pos++;
    futureMovement--;
    }*/
    if (trump.x_pos > canadian.x_pos+65 && trump.x_pos > canadian.x_pos+71){
        trump.x_pos = trump.x_pos-2;
        
    }
    else if (trump.x_pos < canadian.x_pos+65 && trump.x_pos < canadian.x_pos+71){
        trump.x_pos = trump.x_pos+2;                    
    }
    if (trump.x_pos > canadian.x_pos+65 && barrelIsDropping == false){
        
        barrel.x_pos = barrel.x_pos-2;
    }
    else if (trump.x_pos < canadian.x_pos+65 && barrelIsDropping == false){
        
        barrel.x_pos = barrel.x_pos+2;
    }

        if(wall2.y_pos>1 && wall1.y_pos>1 && trump.y_pos<0){
    trump.y_pos -= futureYMovement / 10;   
     }
}

function dropBarrel() {
    var wall1 = objects[1];
    var wall2 = objects[2];
    var trump = objects[3];
    var barrel1 = objects[5];
    var barrel2 = objects[6];
    var barrel3 = objects[7];
    var canadian = objects[4];

    if (playerSelected == true){
        distance =  Math.abs(trump.x_pos-canadian.x_pos-65);



        if (barrel1.y_pos > -101){
            barrelIsDropping = true;
        }
        else if (barrel1.y_pos < -101){
        	barrelIsDropping = false;
        }
       
        if (barrel1.y_pos > 700 && height < 5){
            barrel1.x_pos = trump.x_pos+100;
            barrel1.y_pos = trump.y_pos+100;
        }
       
        else if (barrel1.y_pos > 700 && height == 5){
        	barrel1.x_pos = trump.x_pos+100;
            barrel1.y_pos = trump.y_pos+100;
        }

        if (barrelIsDropping == true){
            barrel1.y_pos = barrel1.y_pos + 3;

        }

            barrel2.y_pos += 3;
            barrel3.y_pos += 3;
        

        if (barrel2.y_pos > 700 && (wall2.y_pos<1 || wall1.y_pos<1)){
            barrel2.y_pos = -100;
            barrel2.x_pos = Math.floor(Math.random() * 1100);
        }
        if (barrel3.y_pos > 700 && (wall2.y_pos<1 || wall1.y_pos<1)){
            barrel3.y_pos = -100;
            barrel3.x_pos = Math.floor(Math.random() * 1100);
        }
    }
}
function scroll() {
    var barrel1 = objects[5];
    var barrel2 = objects[6];
    var barrel3 = objects[7];
    var wall1 = objects[1];
    var wall2 = objects[2];
    var canadian = objects[4];
    var trump = objects[3];

    if ((canadian.y_pos < 250 && height < 5) && (wall1.y_pos < 200 || wall2.y_pos < 200)){
        scrolling = true;
    }
    else {
        scrolling = false;
    }

    if(scrolling == true){
        wall1.y_pos -= futureYMovement / 10;
        wall2.y_pos -= futureYMovement / 10;
        barrel1.y_pos -= futureYMovement / 10;
        barrel2.y_pos -= futureYMovement / 10;
        barrel3.y_pos -= futureYMovement / 10;
        futureYMovement *= 0.9;
    }

    if (wall1.y_pos > 750 &&  height < 4){
        wall1.y_pos = wall2.y_pos - 750;
        height += 1;
    }

    if (wall2.y_pos > 700 && height < 4){
        wall2.y_pos = wall1.y_pos - 750;
        height += 1;
    }
    if(height == 5){
        wall1.y_pos = 200;
        wall2.y_pos = 200;
    }
}

function Win(){
    var canadian = objects[4];
    var winScreen = objects[9];
    var wall1 = objects[1];
    var wall2 = objects[2];
    if (canadian.y_pos < 100){
        win = true;
    }
    if (win == true){
        winScreen.draw()

        var button = document.getElementById("playAgainButton");
		button.style.display = "block"; 
		
        if (soundPlayed == false){
           winSound.play();
        }
    }

    if (height > 1){
        moveAmount = 150;

    }

    if (height > 2){
        moveAmount = 100;

    }

    if (height > 3){
        moveAmount = 50;

    }
}
 
//FUNCTIONS FOR MAINLOOP.JS:
//take input and move objects
function update(delta_time){
    var trump = objects[3];
    var barrel1 = objects[5];
    var barrel2 = objects[6];
    var barrel3 = objects[7];
    var canadian = objects[4];
    //sat.rotate(delta_time * angular_velocity); 
    canadianPos = {x : canadian.x_pos, y : canadian.y_pos};
    barrel1Pos = {x : barrel1.x_pos, y : barrel1.y_pos};
    barrel2Pos = {x : barrel2.x_pos, y : barrel2.y_pos};
    barrel3Pos = {x : barrel3.x_pos, y : barrel3.y_pos};
    if(detectHit1(canadian.hitbox, canadianPos, barrel1.hitbox, barrel1Pos)){
        //console.log("ouch!");
        lost=true;
    }

    if(detectHit2(canadian.hitbox, canadianPos, barrel2.hitbox, barrel2Pos)){
        //console.log("ouch!");
        lost=true;
    }

    if(detectHit3(canadian.hitbox, canadianPos, barrel3.hitbox, barrel3Pos)){
        //console.log("ouch!");
        lost=true;
    }
    
    //sat.x_pos += delta_time * delta_radius * 0.2; 
    //delta_radius *= 0.8; 
    /*
    for(var i=0; i< objects.length; i++){
        objects[i].applyPhysics(); 
    } */
    if (scrolling == false){
        canadian.y_pos += futureYMovement / 10; 
        futureYMovement *= 0.9;
    }

    if(canadian.x_pos < -170 && futureXMovement < 0){
        futureXMovement *= 0.9;
    }
    else if(canadian.x_pos > 870 && futureXMovement > 0){
        futureXMovement *= 0.9;        
    }
    else{
        canadian.x_pos += futureXMovement / 10;
        futureXMovement *= 0.9;
    }
}

function draw(interpolationPercentage){
    var barrel1 = objects[5];
    if(lost == true && win == false && playerSelected ==true){
        var loseScreen = objects[8];
        loseScreen.draw();
		var button = document.getElementById("playAgainButton");
		button.style.display = "block"; 
        if (soundPlayed == false){
            loseSound.play();
            soundPlayed =true;
        }
    }
    else if (playerSelected == true){
        for(var i=0; i<objects.length-2; i++){
            objects[i].draw(); 
        }
    }

    moveTrump();
    dropBarrel();
    Win();
    scroll();
}

//executes at end of frame 
function end(fps, panic){
    //panic==true if it's lagging too much
}
