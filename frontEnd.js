var numberOfDifferentNotes = 4;
var input = new Uint16Array(numberOfDifferentNotes);
var lastInput = new Uint16Array(numberOfDifferentNotes);
var fps = 60;
var topNoteBlocks = new Array(numberOfDifferentNotes);
var fallDownSpeed = 5;
var blocks;
var timeLastBlockAppeared = [0,0,0,0];
var minTimeForNewBlock = 250;
var userInputs = new Uint16Array(numberOfDifferentNotes);
var lastUserInputs = new Uint16Array(numberOfDifferentNotes);
var keyColors = ["","","",""];
var points = 0;
var noteArea;
function start(numberOfNotes, targetFPS, timeToFall)
{
    document.getElementById("MainMenu").style.display = "none";
    document.getElementById("Game").style.display = "initial";
    noteArea = document.getElementById("noteArea");
    numberOfDifferentNotes = numberOfNotes;
    fps = targetFPS;
    fallDownSpeed = (noteArea.getBoundingClientRect().bottom + 50)/(timeToFall*fps);
    for(var i = 0; i < numberOfDifferentNotes; i++){
        var keyId = "key" + i;
        keyColors[i] = document.getElementById(keyId).style.backgroundImage;
    }
}

function step(inputArray) {
    input = inputArray;
    createBlocksFromInput();
    moveBlocks();
    pressButtonsFromUserInput();
    fadeHitBlocks();
}
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

function createBlocksFromInput()
{
    var d = new Date();
    var newNote = false;
    input.forEach(function (value, index) {
        if (value) {
            if(d.getTime() - timeLastBlockAppeared[index] >= minTimeForNewBlock){
                if (lastInput[index] == 0) {
                    newNote = true;
                    timeLastBlockAppeared[index] = d.getTime();
                    createNewBlock(index);
                }
                else if (value != 0){
                    elongateTopNote(index);
                }
            }         
        }
        if(d.getTime() - timeLastBlockAppeared[index] < minTimeForNewBlock){
            elongateTopNote(index);
        }
        lastInput[index] = value;
    })
    if (newNote) {
        backGroundBeat();
    }
}

function elongateTopNote(noteIndex)
{
    if(topNoteBlocks[noteIndex]){
        var rect = topNoteBlocks[noteIndex].getBoundingClientRect();
        var newTop = - fallDownSpeed;
        //var newBottom = noteArea.getBoundingClientRect().bottom - fallDownSpeed - rect.bottom;
        //console.log(rect.top + " , " + newBottom);
        topNoteBlocks[noteIndex].style.top = newTop;
        //topNoteBlocks[noteIndex].style.bottom = newBottom;
    }
    
}

function createNewBlock(noteIndex)
{
    topNoteBlocks[noteIndex] = document.createElement("div");
    topNoteBlocks[noteIndex].id = "block" + noteIndex;
    topNoteBlocks[noteIndex].className = "block";
    noteArea.appendChild(topNoteBlocks[noteIndex]);
    topNoteBlocks[noteIndex].style.width = 100 / numberOfDifferentNotes + "%";
    var rect = topNoteBlocks[noteIndex].getBoundingClientRect();
    var newLeft = rect.left + noteArea.offsetWidth * noteIndex / numberOfDifferentNotes;
    var newRight = rect.right + (1 + noteArea.offsetWidth * noteIndex) / numberOfDifferentNotes;
    topNoteBlocks[noteIndex].style.left = newLeft;
    topNoteBlocks[noteIndex].style.rigth = newRight;
    var newBottom = noteArea.getBoundingClientRect().bottom - fallDownSpeed;
    topNoteBlocks[noteIndex].style.bottom = newBottom;
}

function backGroundBeat() {
    //noteArea.style.backgroundImage = "linear-gradient(#386,#321 75%)"
}

function pressButtonsFromUserInput(){
    userInputs.forEach(function (userInput, index) {
        var keyId = "key" + index;
        //console.log(keyId);
        var noteKey = document.getElementById(keyId);
        if(userInputs[index] == 0){
            noteKey.style.backgroundImage = keyColors[index];
        }
        else{
            noteKey.style.backgroundImage = "linear-gradient(#FF1800 80%, #FF7C00 95%)";
            if(userInputs[index] != lastUserInputs[index]){
                var hitDiv = document.elementFromPoint(noteKey.getBoundingClientRect().x + noteKey.getBoundingClientRect().width/2,noteKey.getBoundingClientRect().top - 5);
                if(hitDiv.className == "block"){
                    hitDiv.id = "destroyed";
                    hitDiv.className = "destroyed";
                    var hitBlock = "hitBlock" + index;
                    document.getElementById(hitBlock).style.opacity = ".75";
                    points += 100;
                }
                else{
                    points -= 50;
                }
            }
            
        }
        console.log("Points: " + points);
        lastUserInputs[index] = userInputs[index];
    });

}

function fadeHitBlocks(){
    for(var i = 0; i < numberOfDifferentNotes; i++){
        var hitBlock = "hitBlock" + i;
        if(document.getElementById(hitBlock).style.opacity > 0){
            document.getElementById(hitBlock).style.opacity = " " + (document.getElementById(hitBlock).style.opacity - .03);

        }
    }
}


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
