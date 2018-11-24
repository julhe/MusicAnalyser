var numberOfDifferentNotes = 4;
var input = new Uint16Array(numberOfDifferentNotes);
var lastInput = new Uint16Array(numberOfDifferentNotes);
var fps = 1;
var topNoteBlocks = new Array(numberOfDifferentNotes);
var fallDownSpeed = 5;

document.body.onload = start;


function start()
{
    setInterval(createBlocksFromInput, 1000 / fps);
}

function addElement() {
    // erstelle ein neues div Element
    // und gib ihm etwas Inhalt
    var newDiv = document.createElement("div");
    var newContent = document.createTextNode("Hi there and greetings!");
    newDiv.appendChild(newContent); // füge den Textknoten zum neu erstellten div hinzu.

    // füge das neu erstellte Element und seinen Inhalt ins DOM ein
    var currentDiv = document.getElementById("div1");
    document.body.insertBefore(newDiv, currentDiv);
}

function createBlocksFromInput()
{
    console.log(input);
    input.forEach(function (value, index) {
        if (value != 0) {
            if (lastInput[index] == 0) {
                createNewBlock(index);
            }
            if (value == lastInput[index]) {
                elongateTopNote(index);
            }            
        }
        lastInput[index] = value;
    })
}

function elongateTopNote(noteIndex)
{
    topNoteBlocks[noteIndex].style.width += fallDownSpeed;
}

function createNewBlock(noteIndex)
{
    console.log("newBlock");
    topNoteBlocks[noteIndex] = document.createElement("div");
    document.getElementById("noteArea").appendChild(topNoteBlocks[noteIndex]);
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