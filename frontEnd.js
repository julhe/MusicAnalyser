var numberOfDifferentNotes = 4;
var input = new Uint16Array(numberOfDifferentNotes);
var lastInput = new Uint16Array(numberOfDifferentNotes);
var fps = 60;
var topNoteBlocks = new Array(numberOfDifferentNotes);
var fallDownSpeed = 5;
var blocks;

function start(numberOfNotes, targetFPS, timeToFall)
{
    numberOfDifferentNotes = numberOfNotes;
    fps = targetFPS;
    fallDownSpeed = document.getElementById("noteArea").getBoundingClientRect().bottom/(timeToFall*fps);
}

function step(inputArray) {
    input = inputArray;
    createBlocksFromInput();
    moveBlocks();
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
    var newNote = false;
    input.forEach(function (value, index) {
        if (value != 0) {
            if (lastInput[index] == 0) {
                newNote = true;
                createNewBlock(index);
            }
            if (value == lastInput[index]) {
                elongateTopNote(index);
            }            
        }
        lastInput[index] = value;
    })
    if (newNote) {
        backGroundBeat();
    }
    else {
        document.getElementById("noteArea").style.backgroundImage = "linear-gradient(#375,#210 75%)"
    }
}

function elongateTopNote(noteIndex)
{
    var rect = topNoteBlocks[noteIndex].getBoundingClientRect();
    var newTop = - fallDownSpeed;
    //var newBottom = document.getElementById("noteArea").getBoundingClientRect().bottom - fallDownSpeed - rect.bottom;
    //console.log(rect.top + " , " + newBottom);
    topNoteBlocks[noteIndex].style.top = newTop;
    //topNoteBlocks[noteIndex].style.bottom = newBottom;
}

function createNewBlock(noteIndex)
{
    console.log("newBlock");
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
    document.getElementById("noteArea").style.backgroundImage = "linear-gradient(#386,#321 75%)"
}

document.addEventListener('keydown', function (event) {
    if (event.key == 'q') {
        input[0] = 1;
    }
    if (event.key == 'w') {
        input[1] = 1;
    }
    if (event.key == 'e') {
        input[2] = 1;
    }
    if (event.key == 'r') {
        input[3] = 1;
    }
});

document.addEventListener('keyup', function (event) {
    if (event.key == 'q') {
        input[0] = 0;
    }
    if (event.key == 'w') {
        input[1] = 0;
    }
    if (event.key == 'e') {
        input[2] = 0;
    }
    if (event.key == 'r') {
        input[3] = 0;
    }
});