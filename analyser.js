const bandsCount = 4;
var fps = 60;
var timeToFall = 3;
var bands = [bandsCount];

window.onload = function () {
     
    //initalization
    var context = new AudioContext();

    var request = new XMLHttpRequest();
    request.open('GET', "sounds/Daft Punk - HarderBetter Faster Stronger Remix.mp3", true);
    request.responseType = 'arraybuffer';

    var testAudio = context.createBufferSource();
    request.onload = function () {
        var undecodedAudio = request.response;
        context.decodeAudioData(undecodedAudio, function (buffer) {
            testAudio.buffer = buffer;
            
        });
    };

    var analyser = context.createAnalyser();
    analyser.fftSize = 32;
    analyser.maxDecibels = 90;
    analyser.minDecibels = -200;
    var bufferLength = analyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);

    var delay = context.createDelay(timeToFall);
    delay.delayTime.value = timeToFall;
    OnLoadFinished();
    var canvasCtx, canvas, outText;
    function OnLoadFinished(){       
        testAudio.connect(analyser);
        analyser.connect(delay);
        delay.connect(context.destination);
        testAudio.start(context.currentTime);

        start(bandsCount, fps, timeToFall);
        draw();
    }



    function draw() {

        requestAnimationFrame(draw);
      
 
        //LogCompressor();
        analyser.getByteFrequencyData(dataArray);
      
        var av = 1;
        /*
        console.log(parseFloat(Math.round(band0 * 100) / 100).toFixed(2) + "," + parseFloat(Math.round(band1 * 100) / 100).toFixed(2) + "," + parseFloat(Math.round(band2 * 100) / 100).toFixed(2) + "," + parseFloat(Math.round(band3 * 100) / 100).toFixed(2) + "," + parseFloat(Math.round(av * 100) / 100).toFixed(2));
        bands[0] = band0 > av * document.getElementById("myRange0").value;
        bands[1] = band1 > av * document.getElementById("myRange1").value;
        bands[2] = band2 > av * document.getElementById("myRange2").value;
        bands[3] = band3 > av * document.getElementById("myRange3").value;
        console.log(document.getElementById("myRange0").value + "," + document.getElementById("myRange1").value + "," + document.getElementById("myRange2").value + "," + document.getElementById("myRange3").value)

        //console.log(bands[3]);
        //TODO: schwellwert adaptive machen
        /*
        bands[0] = bands[0] > 125;
        bands[1] = bands[1] > 110;
        bands[2] = bands[2] > 80;
        bands[3] = bands[3] > 50;
        */
        

        step(bands);

        // var sliceWidth = canvas.width * 1.0 / bandsCount;
        // var x = 0;
        // for (var i = 0; i < bands.length; i++) {
      
        //     var v = bands[i] / 128.0;
        //     var y = v * canvas.height / 2.0;

        //     if (i === 0) {
        //         canvasCtx.moveTo(x, y);
        //     } else {
        //         canvasCtx.lineTo(x, y);
        //     }

        //     x += sliceWidth;
        // }
      
        
        // canvasCtx.lineTo(canvas.width, canvas.height / 2);
        // canvasCtx.stroke();
    
        // var bufferWithIndex = [];
        // for (let i = 0; i < bufferLength; i++) {
        //     const element = dataArray[i];
        //     bufferWithIndex.push({x: i, value: element});
        // }
        // bufferWithIndex.sort(function(a, b) {return b.value - a.value});
        // outText.innerHTML = bufferWithIndex[0].value + " " + bufferWithIndex[0].x;
      }      
}