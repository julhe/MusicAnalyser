const bandsCount = 4;
var fps = 60;
var timeToFall = 3;
var bands = [bandsCount];

window.onload = function () {
     
    //initalization
    var context = new AudioContext();

    var request = new XMLHttpRequest();
    request.open('GET', "sounds/lied2.mpeg", true);
    request.responseType = 'arraybuffer';

    var testAudio = context.createBufferSource();
    request.onload = function () {
        var undecodedAudio = request.response;
        context.decodeAudioData(undecodedAudio, function (buffer) {
            testAudio.buffer = buffer;
            OnLoadFinished();
        });
    };

    // create compresors
    var compressorSlow = context.createDynamicsCompressor();
    compressorSlow.threshold.setValueAtTime(-50, context.currentTime);
    compressorSlow.knee.setValueAtTime(40, context.currentTime);
    compressorSlow.ratio.setValueAtTime(12, context.currentTime);
    compressorSlow.attack.setValueAtTime(1, context.currentTime);
    compressorSlow.release.setValueAtTime(0.25, context.currentTime);

    var compressorFast = context.createDynamicsCompressor();
    compressorFast.threshold.setValueAtTime(-50, context.currentTime);
    compressorFast.knee.setValueAtTime(40, context.currentTime);
    compressorFast.ratio.setValueAtTime(999, context.currentTime);
    compressorFast.attack.setValueAtTime(0, context.currentTime);
    compressorFast.release.setValueAtTime(0.01, context.currentTime);

    // create debug OSC
    var osc0 = context.createOscillator();
    var gain = context.createGain();
    osc0.connect(gain);
    gain.gain.value = 0;
    osc0.frequency = 440;
    gain.connect(context.destination);
    osc0.start(context.currentTime);
    request.send();

    var analyser = context.createAnalyser();
    analyser.fftSize = 8192;
    analyser.maxDecibels = 90;
    analyser.minDecibels = -200;
    var bufferLength = analyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);

    var delay = context.createDelay(timeToFall);
    delay.delayTime.value = timeToFall;
 
    var canvasCtx, canvas, outText;
    function OnLoadFinished(){

        testAudio.connect(compressorSlow);
        testAudio.connect(compressorFast);        
        testAudio.connect(analyser);
        analyser.connect(delay);
        delay.connect(context.destination);
        testAudio.start(context.currentTime);
        
        // Get a canvas defined with ID "oscilloscope"
        // canvas = document.getElementById("oscilloscope");
        // canvasCtx = canvas.getContext("2d");

        // outText = document.getElementById("notes");

        start(bandsCount, fps, timeToFall);
        draw();
    }

    // var dpsFast = [], dpsSlow = []; // dataPoints
    // var xVal = 0;
        
    // var chart = new CanvasJS.Chart("chartContainer", {
    //     title :{
    //         text: "Dynamic Data"
    //     },
    //     axisY: {
    //         includeZero: false
    //     },      
    //     data: [
    //         {
    //             type: "line",
    //             dataPoints: dpsFast
    //         },
    //         {
    //             type: "line",
    //             dataPoints: dpsSlow
    //         },
    //     ]
    // });

    function LogCompressor() {
        var transientLevel = Math.abs(compressorSlow.reduction - compressorFast.reduction);
        if(transientLevel > 13.0) {
            //console.log("TRANSIENT!" + transientLevel);
            
        } else {
            //gain.gain.value = 0.0;
        }

        xVal++;
        dpsFast.push({x: xVal, y: compressorSlow.reduction});
        dpsSlow.push({x: xVal, y: compressorFast.reduction});
        if (dpsFast.length > 400) {
            dpsFast.shift();
            dpsSlow.shift();
        }
    
        chart.render();
        
    }



    function draw() {

        requestAnimationFrame(draw);
      
 
        //LogCompressor();
        analyser.getByteFrequencyData(dataArray);
      
        // canvasCtx.fillStyle = "rgb(200, 200, 200)";
        // canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
      
        // canvasCtx.lineWidth = 2;
        // canvasCtx.strokeStyle = "rgb(0, 0, 0)";
      
        // canvasCtx.beginPath();
          
        //split into 4 bands

        const maxFFTFreq = 44100 / 2.0;
        
        for (let i = 0; i < bandsCount; i++) {
            
            const i01 = i / bandsCount;
            const i01Plus1 = (i + 1) / bandsCount;
            const startHz = Math.log2(i01 * maxFFTFreq);
            const endHz = Math.log2(i01Plus1 * maxFFTFreq);
            //const varsPerBands = Math.floor(bufferLength * ((Math.log2(i + 3) / 8.499)));
            const varsPerBands = Math.round(bufferLength / (2*bandsCount));
            console.log(varsPerBands);
            const start = i * varsPerBands;
            const end = (i + 1) * varsPerBands;

            var average = dataArray[start];
            for (let j = start + 1; j < end; j++) {
                const element = dataArray[j];
                average += element;
            }

            average /= (end - start);
            bands[i] = average;
        }
        /*
        band0 = Math.log10(bands[0]);
        band1 = Math.log10(bands[1]);
        band2 = Math.log10(bands[2]);
        band3 = Math.log10(bands[3]);
        */
        band0 = bands[0];
        band1 = bands[1];
        band2 = bands[2];
        band3 = bands[3];
        
        var av = band0 + band1 + band2 + band3;
        av = av / 4;
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