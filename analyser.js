// hey there!
const bandsCount = 4;
var fps = 60;
var timeToFall = 3;
var bands = [bandsCount];

var compGlobal, compLocal;
var transientSettings = { attack: 0.083, transientLength: 0.7, threshold: 4, localRelease: 0.0006, bandF: 500, bandQ: 0}
var comp_global_attack = 0.01, 
    comp_global_release = 0.01; 
    comp_global_thresshold = -100, 
    comp_global_ratio = 12;
var comp_local_attack = 0.00,
    comp_local_release = 0.0, 
    comp_local_thresshold = -100, 
    comp_local_ratio = 12;
var gui = new dat.GUI();


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
            OnLoadFinished();
        });
    };

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
    var transDectBands = [];
    function OnLoadFinished(){

        function createTransientDetector(name, bandFreq, bandQ){
            var transDec = [];
            transDec.compLocal = context.createDynamicsCompressor();
            transDec.compGlobal = context.createDynamicsCompressor();
            transDec.bandpassFilter = context.createBiquadFilter();
            transDec.bandpassFilter.type = "bandpass";

            testAudio.connect(transDec.bandpassFilter);
            transDec.bandpassFilter.connect(transDec.compGlobal);
            transDec.bandpassFilter.connect(transDec.compLocal);

            transDec.guiFolder = gui.addFolder(name);

            // default settings
            var transientSettings = { 
                attack: 0.083, 
                transientLength: 0.7, 
                threshold: 4, 
                localRelease: 0.0006, 
                bandF: bandFreq, 
                bandQ: bandQ};
            transDec.guiFolder.add(transientSettings, 'attack').min(0.001).max(0.2);
            transDec.guiFolder.add(transientSettings, 'transientLength').min(0.001).max(1.5);
            transDec.guiFolder.add(transientSettings, 'localRelease').min(0.000).max(0.001);
            // gui.add(transientSettings, 'threshold').min(0.2).max(6);
            transDec.guiFolder.add(transientSettings, 'bandF').min(20).max(20000);
            transDec.guiFolder.add(transientSettings, 'bandQ').min(0,).max(50);
            transDec.settings = transientSettings;


            return transDec;
        }
        transDectBands[0] = createTransientDetector("band0", 250, 10);
        transDectBands[1] = createTransientDetector("band1", 1500, 8);
        transDectBands[2] = createTransientDetector("band2", 3000, 6);
        transDectBands[3] = createTransientDetector("band3", 6000, 5);

        

        testAudio.connect(context.destination);       
        testAudio.connect(analyser);
        analyser.connect(delay);
       // compGlobal.connect(context.destination);
       // gainByTransient.connect(context.destination);
        testAudio.start(context.currentTime);
        
        // Get a canvas defined with ID "oscilloscope"
        // canvas = document.getElementById("oscilloscope");
        // canvasCtx = canvas.getContext("2d");

        // outText = document.getElementById("notes");

        start(bandsCount, fps, timeToFall);
        draw();
    }


    function updateCompressorValues(transDec) {
    
        transDec.compGlobal.attack.setValueAtTime(transDec.settings.attack, context.currentTime);
        transDec.compGlobal.release.setValueAtTime(transDec.settings.transientLength, context.currentTime);
        transDec.compGlobal.threshold.setValueAtTime(comp_global_thresshold, context.currentTime);
        transDec.compGlobal.ratio.setValueAtTime(comp_global_ratio, context.currentTime);

        transDec.compLocal.attack.setValueAtTime(comp_local_attack, context.currentTime);
        transDec.compLocal.release.setValueAtTime(transDec.settings.localRelease, context.currentTime);
        transDec.compLocal.threshold.setValueAtTime(comp_local_thresshold, context.currentTime);
        transDec.compLocal.ratio.setValueAtTime(comp_local_ratio, context.currentTime);

        transDec.bandpassFilter.frequency.value = transDec.settings.bandF;
        transDec.bandpassFilter.Q.value = transDec.settings.bandQ;
    }

    var dpsFast = [], dpsSlow = [], dpsTrans = []; // dataPoints
    var xVal = 0;
        
    var chart = new CanvasJS.Chart("chartContainer", {
        title :{
            text: "Dynamic Data"
        },
        axisY: {
            includeZero: false
        },      
        data: [
            {
                type: "line",
                dataPoints: dpsFast
            },
            {
                type: "line",
                dataPoints: dpsSlow
            },
            {
                type: "line",
                dataPoints: dpsTrans
            },
        ]
    });

    var transientLevel = 0;
    function GetTransientLevel(transDec){
        return transDec.compLocal.reduction - transDec.compGlobal.reduction;
    }
    function UpdateTransientDetectors() {
        return;


        transientLevel = ( compLocal.reduction - compGlobal.reduction);
        if(transientLevel > 13.0) {
            //console.log("TRANSIENT!" + transientLevel);
            
        } else {
            //gain.gain.value = 0.0;
        }

        xVal++;
        dpsFast.push({x: xVal, y: compGlobal.reduction});
        dpsSlow.push({x: xVal, y: compLocal.reduction});
        // dpsTrans.push({x: xVal, y: transientLevel > transientSettings.threshold ? -40 : -80});
        dpsTrans.push({x: xVal, y: transientLevel });
        if (dpsFast.length > 180) {
            dpsFast.shift();
            dpsSlow.shift();
            dpsTrans.shift();
        }
        gainByTransient.gain.value = Math.min(1, Math.max(0, transientLevel));
      //   chart.render();
        
    }


    function draw() {

        requestAnimationFrame(draw);
        updateCompressorValues(transDectBands[0]);
        updateCompressorValues(transDectBands[1]);
        updateCompressorValues(transDectBands[2]);
        updateCompressorValues(transDectBands[3]);

      
        UpdateTransientDetectors();
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
            //const varsPerBands = Math.floor(bufferLength * ((Math.log2(i + 3) / 8.499)));
            const varsPerBands = Math.round(bufferLength / (2*bandsCount));
            // console.log(varsPerBands);
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

        band0 = bands[0];
        band1 = bands[1];
        band2 = bands[2];
        band3 = bands[3];
        // bands[0] = bands[1] = bands[2] = bands[3] = transientLevel > 0 ? 1 : 0;
        // bands[0] = transientLevel > 0;
        bands[0] = GetTransientLevel(transDectBands[0]) > 0;
        bands[1] = GetTransientLevel(transDectBands[1]) > 0;  
        bands[2] = GetTransientLevel(transDectBands[2]) > 0;  
        bands[3] = GetTransientLevel(transDectBands[3]) > 0;  

     
        // console.log(parseFloat(Math.round(band0 * 100) / 100).toFixed(2) + "," + parseFloat(Math.round(band1 * 100) / 100).toFixed(2) + "," + parseFloat(Math.round(band2 * 100) / 100).toFixed(2) + "," + parseFloat(Math.round(band3 * 100) / 100).toFixed(2) + "," + parseFloat(Math.round(av * 100) / 100).toFixed(2));
        // bands[0] = band0 > av * document.getElementById("myRange0").value;
        // bands[1] = band1 > av * document.getElementById("myRange1").value;
        // bands[2] = band2 > av * document.getElementById("myRange2").value;
        // bands[3] = band3 > av * document.getElementById("myRange3").value;
        // console.log(document.getElementById("myRange0").value + "," + document.getElementById("myRange1").value + "," + document.getElementById("myRange2").value + "," + document.getElementById("myRange3").value)

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