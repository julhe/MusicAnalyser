var numberOfDifferentNotes = 4;
var input = new Uint16Array(numberOfDifferentNotes);
var lastInput = new Uint16Array(numberOfDifferentNotes);
var fps = 60;
var topNoteBlocks = new Array(numberOfDifferentNotes);
var fallDownSpeed = 5; //Defines in how many seconds the blocks should fall from top to bottom
var blocks; //The blocks currently on screen
var timeLastBlockAppeared = [0,0,0,0];
var minTimeForNewBlock = 400; //Defines how many milliseconds a note will take to be formed at the top (Higher values means fewer and bigger notes)
var userInputs = new Uint16Array(numberOfDifferentNotes);
var lastUserInputs = new Uint16Array(numberOfDifferentNotes);
var unpressedKeyImage; //Value to set unpressed keys to the unpressed key image
var points = 0; //Current score
var noteArea;
//Dummy Playernames and points to be shown in highscorescreen
var playerNames = ["NoNameNelson","NoNameNelson","NoNameNelson","NoNameNelson","NoNameNelson","NoNameNelson","NoNameNelson","NoNameNelson","NoNameNelson","NoNameNelson","NoNameNelson","NoNameNelson"];
var playerPoints = [0,0,0,0,0,0,0,0,0,0];

document.onload = Init();

//This function gets called, when the analyser is prepared and starts the frontend
function start(numberOfNotes, targetFPS, timeToFall)
{
    document.getElementById("MainMenu").style.display = "none";
    document.getElementById("Game").style.display = "initial";
    noteArea = document.getElementById("noteArea");
    numberOfDifferentNotes = numberOfNotes;
    fps = targetFPS;
    fallDownSpeed = (noteArea.getBoundingClientRect().bottom + 50)/(timeToFall*fps);
    unpressedKeyImage = document.getElementById("key0").style.backgroundImage;
}

//This function gets called, when the highscores view is opened. At the end of a song it gets called with the current points. It then checks if the player is put into the highscores. If so a text input is created for the playername
function showHighscores(score){
    var playerPosition = -1;
    if(score > 0){
        for(var i = 0; i < playerPoints.length; i++){
            if(score > playerPoints[i]){
                playerPoints.splice(i, 0, score);
                playerPoints.pop();
                playerNames.splice(i, 0, "Enter your name!");
                playerNames.pop();
                playerPosition = i;
                function submitName(name, position){
                    playerNames[position] = name;
                }
                break;
            }
        }
    }
    var scoresElement = document.getElementById("scores");
    //Remove all old score elements
        while (scoresElement.firstChild) {
            scoresElement.removeChild(scoresElement.firstChild);
        }
    //Create new score entries
        for(var i = 0; i < playerPoints.length; i++){
            var playerNameElement;
            var pointElement;
            var scoreElement;
            //If the player is in the highscores create a submitfield to enter the name
            if(playerPosition == i){
                playerNameElement = document.createElement("input");
                playerNameElement.placeholder = playerNames[i]; 
                playerNameElement.onchange = function submitName(){
                    playerNames[playerPosition] = this.value;
                };       
            }
            else{
                playerNameElement = document.createElement("div");
                playerNameElement.innerHTML = playerNames[i];
            }
            playerNameElement.className = "PointEntry";
            pointElement = document.createElement("div");
            pointElement.innerHTML = playerPoints[i];
            pointElement.className = "PointEntry";
            scoreElement = document.createElement("div");
            scoreElement.className = "ScoreContainer";
            scoreElement.appendChild(playerNameElement);
            scoreElement.appendChild(pointElement);
            scoresElement.appendChild(scoreElement);
        }
        //Show the scoreboard and hide the rest
    document.getElementById("MainMenu").style.display = "none";
    document.getElementById("Game").style.display = "none";
    document.getElementById("Scoreboard").style.display = "initial";
}

function showControlls(){
    document.getElementById("MainMenu").style.display = "none";
    document.getElementById("Controlls").style.display = "initial";
}

function showCredits(){
    document.getElementById("MainMenu").style.display = "none";
    document.getElementById("Credits").style.display = "initial";
}

//When showing the main menu the points must be set to 0 to make sure the player cant just reopen the highscores view again and get another highscore
function showMainMenu(){
    document.getElementById("MainMenu").style.display = "initial";
    document.getElementById("Game").style.display = "none";
    document.getElementById("Scoreboard").style.display = "none";
    document.getElementById("Controlls").style.display = "none";
    document.getElementById("Credits").style.display = "none";
    points = 0;
}

//Function to be called each update/frame. Gets analyser input, calls functions to create new buttons depending on analyserdata, moves blocks down, process user input and fade the hitblockeffect
function step(inputArray) {
    input = inputArray;
    createBlocksFromInput();
    moveBlocks();
    pressButtonsFromUserInput();
    fadeHitBlocks();
}

//This function moves every block down and removes blocks, wich have reached the bottom.
function moveBlocks() {
    blocks = noteArea.childNodes;
    blocks.forEach(function (child) {
        var rect = child.getBoundingClientRect();
        var newTop = rect.top + fallDownSpeed;
        var newBottom = noteArea.getBoundingClientRect().bottom - fallDownSpeed - rect.bottom;
        if (newTop >= noteArea.getBoundingClientRect().bottom + fallDownSpeed) {
            child.remove;
            return;
        }
        if (newBottom <= 0) {
            newBottom = 0;
        }
        child.style.top = newTop;
        child.style.bottom = newBottom;       
    })
    
}

//Get the analyserdata and create new blocks
function createBlocksFromInput()
{
    var d = new Date();
    input.forEach(function (value, index) {
        if (value) {
            if(d.getTime() - timeLastBlockAppeared[index] >= minTimeForNewBlock){
                //Create a new block, if a note is struck (if the note value was 0 before and is now !0)
                if (lastInput[index] == 0) {
                    timeLastBlockAppeared[index] = d.getTime();
                    createNewBlock(index);
                }
            }         
        }
        //If the note started less than minTimeForNewBlock ago keep creating the note even if the value is 0 now
        if(d.getTime() - timeLastBlockAppeared[index] < minTimeForNewBlock){
            elongateTopNote(index);
        }
        lastInput[index] = value;
    })
}

//elongate the top note in the correct collumn by moving the top up, while the rest ist moving down
function elongateTopNote(noteIndex)
{
    if(topNoteBlocks[noteIndex]){
        var newTop = - fallDownSpeed;
        topNoteBlocks[noteIndex].style.top = newTop;
    }
    
}

//create a new block
function createNewBlock(noteIndex)
{
    //reference the new block as the top block in its collumn
    topNoteBlocks[noteIndex] = document.createElement("div");
    //set id and class for the div
    topNoteBlocks[noteIndex].id = "block" + noteIndex;
    topNoteBlocks[noteIndex].className = "block";
    //add the new block to the note area
    noteArea.appendChild(topNoteBlocks[noteIndex]);
    //position it correctly
    var rect = topNoteBlocks[noteIndex].getBoundingClientRect();
    var newLeft = rect.left + noteArea.offsetWidth * noteIndex / numberOfDifferentNotes;
    var newRight = rect.right + (1 + noteArea.offsetWidth * noteIndex) / numberOfDifferentNotes;
    topNoteBlocks[noteIndex].style.left = newLeft;
    topNoteBlocks[noteIndex].style.rigth = newRight;
    var newBottom = noteArea.getBoundingClientRect().bottom - fallDownSpeed;
    topNoteBlocks[noteIndex].style.bottom = newBottom;
}

function pressButtonsFromUserInput(){
    userInputs.forEach(function (userInput, index) {
        var keyId = "key" + index;
        //console.log(keyId);
        var noteKey = document.getElementById(keyId);
        //if the user has not pressed the button change the button image to the unpressed button image
        if(userInputs[index] == 0){
            noteKey.style.backgroundImage = unpressedKeyImage;
        }
        //if the user presses the button
        else{
            //and doesn't just keep it pressed
            if(userInputs[index] != lastUserInputs[index]){
                //change the button image accordingly
                noteKey.style.backgroundImage = "url('images/CircleDown.png')";
                //Check at the top, the middle and the bottom of the button, if a note is below. Comment top and bottom out, to make it harder
                var hitDivsTop = document.elementsFromPoint(noteKey.getBoundingClientRect().x + noteKey.getBoundingClientRect().width/2,noteKey.getBoundingClientRect().top);
                var hitDivsMiddle = document.elementsFromPoint(noteKey.getBoundingClientRect().x + noteKey.getBoundingClientRect().width/2,noteKey.getBoundingClientRect().top + noteKey.getBoundingClientRect().height/2);
                var hitDivsBottom = document.elementsFromPoint(noteKey.getBoundingClientRect().x + noteKey.getBoundingClientRect().width/2, noteKey.getBoundingClientRect().top - 5 + noteKey.getBoundingClientRect().height);
                var hitDivs = hitDivsTop.concat(hitDivsMiddle, hitDivsBottom);
                var hitSomething = false;
                hitDivs.forEach(hitDiv => {
                    //If the user has hit a block change it, so it looks different and cant be hit again. Also apply a hit effect
                    if(hitDiv.className == "block"){
                        hitDiv.className = "destroyed block";
                        hitDiv.style.backgroundImage = "url('images/NoteDead.png')";
                        var hitBlock = "hitBlock" + index;
                        document.getElementById(hitBlock).style.opacity = ".75";
                        hitSomething = true;
                    }
                });
                //If the user has hit something award points. Else remove points
                if(hitSomething){
                    points += 100;
                }
                else{
                    points -= 50;
                }
            }
            
        }
        //Show the correct updated amount of points
        document.getElementById("points").innerHTML = "" + points;
        lastUserInputs[index] = userInputs[index];
    });

}

//To make the hit effect fade simply lower it's opacity every frame
function fadeHitBlocks(){
    for(var i = 0; i < numberOfDifferentNotes; i++){
        var hitBlock = "hitBlock" + i;
        if(document.getElementById(hitBlock).style.opacity > 0){
            document.getElementById(hitBlock).style.opacity = " " + (document.getElementById(hitBlock).style.opacity - .03);

        }
    }
}

//Get Userinput.
document.addEventListener('keydown', function (event) {
    if (event.key == 'q') {
        userInputs[0] = 1;
    }
    if (event.key == 'w') {
        userInputs[1] = 1;
    }
    if (event.key == 'e') {
        userInputs[2] = 1;
    }
    if (event.key == 'r') {
        userInputs[3] = 1;
    }
});

document.addEventListener('keyup', function (event) {
    if (event.key == 'q') {
        userInputs[0] = 0;
    }
    if (event.key == 'w') {
        userInputs[1] = 0;
    }
    if (event.key == 'e') {
        userInputs[2] = 0;
    }
    if (event.key == 'r') {
        userInputs[3] = 0;
    }
});
