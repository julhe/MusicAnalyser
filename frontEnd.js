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
var LastUserInputs = new Uint16Array(numberOfDifferentNotes);
var keyColors = ["","","",""];
function start(numberOfNotes, targetFPS, timeToFall)
{
    numberOfDifferentNotes = numberOfNotes;
    fps = targetFPS;
    fallDownSpeed = document.getElementById("noteArea").getBoundingClientRect().bottom/(timeToFall*fps);
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
}
function moveBlocks() {
    blocks = document.getElementById("noteArea").childNodes;
    blocks.forEach(function (child) {
        var rect = child.getBoundingClientRect();
        var newTop = rect.top + fallDownSpeed;
        var newBottom = document.getElementById("noteArea").getBoundingClientRect().bottom - fallDownSpeed - rect.bottom;
        if (newTop >= document.getElementById("noteArea").getBoundingClientRect().bottom + fallDownSpeed) {
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
        //var newBottom = document.getElementById("noteArea").getBoundingClientRect().bottom - fallDownSpeed - rect.bottom;
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
    document.getElementById("noteArea").appendChild(topNoteBlocks[noteIndex]);
    topNoteBlocks[noteIndex].style.width = 100 / numberOfDifferentNotes + "%";
    var rect = topNoteBlocks[noteIndex].getBoundingClientRect();
    var newLeft = rect.left + document.getElementById("noteArea").offsetWidth * noteIndex / numberOfDifferentNotes;
    var newRight = rect.right + (1 + document.getElementById("noteArea").offsetWidth * noteIndex) / numberOfDifferentNotes;
    topNoteBlocks[noteIndex].style.left = newLeft;
    topNoteBlocks[noteIndex].style.rigth = newRight;
    var newBottom = document.getElementById("noteArea").getBoundingClientRect().bottom - fallDownSpeed;
    topNoteBlocks[noteIndex].style.bottom = newBottom;
}

function backGroundBeat() {
    //document.getElementById("noteArea").style.backgroundImage = "linear-gradient(#386,#321 75%)"
}

function pressButtonsFromUserInput(){
    userInputs.forEach(function (userInput, index) {
        var keyId = "key" + index;
        console.log(keyId);
        if(userInputs[index] == 0){
        document.getElementById(keyId).style.backgroundImage = keyColors[index];
        }
        else{
        document.getElementById(keyId).style.backgroundImage = "linear-gradient(#FF1800 80%, #FF7C00 95%)";
        }
    });
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
