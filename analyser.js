
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

var context = new AudioContext();
var testAudio;
var globalSettings = {
    songGain: 1.0,
};

//window.onload = function () {
function Start(){

    //initalization
   

    var request = new XMLHttpRequest();
    request.open('GET', "sounds/Daft Punk - HarderBetter Faster Stronger Remix.mp3", true);
    request.responseType = 'arraybuffer';

    request.onload = function () {
        var undecodedAudio = request.response;
        context.decodeAudioData(undecodedAudio, function (buffer) {
            testAudio = context.createBufferSource();
            testAudio.buffer = buffer;        
            OnLoadFinished();
        });
    };

    var songGain = context.createGain();
    gui.add(globalSettings, "songGain",0.0, 1.0);
    gui.remember(globalSettings);
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
            transDec.debugGain = context.createGain();


            testAudio.connect(transDec.bandpassFilter);
            transDec.bandpassFilter.connect(transDec.compGlobal);
            transDec.bandpassFilter.connect(transDec.compLocal);
            transDec.bandpassFilter.connect(transDec.debugGain);
            transDec.debugGain.connect(context.destination);

            transDec.guiFolder = gui.addFolder(name);

            function setActive() {
                testAudio.sourceNode.disconnect(context.destination);
                transDec.bandpassFilter.connect(context.destination);
            }
            // default settings
            var transientSettings = { 
                
                attack: 0.083, 
                transientLength: 0.7, 
                threshold: 4, 
                localRelease: 0.0006, 
                bandF: bandFreq, 
                bandQ: bandQ,
                bandToMaster: 0.0
            };

            var results = {
                transientLevel: 0,
            };

            transDec.guiFolder.add(results, 'transientLevel', -2, 2).listen();
            transDec.guiFolder.add(transientSettings, 'attack').min(0.001).max(0.2);
            transDec.guiFolder.add(transientSettings, 'transientLength').min(0.001).max(1.5);
            transDec.guiFolder.add(transientSettings, 'localRelease').min(0.000).max(0.001);
            // gui.add(transientSettings, 'threshold').min(0.2).max(6);
            transDec.guiFolder.add(transientSettings, 'bandF').min(20).max(10000);
            transDec.guiFolder.add(transientSettings, 'bandQ').min(0,).max(25);
            transDec.guiFolder.add(transientSettings, 'bandToMaster', 0, 1);
            // transDec.guiFolder.add()
            transDec.settings = transientSettings;
            transDec.results = results;


            gui.remember(transientSettings);
            return transDec;
        }
        transDectBands[0] = createTransientDetector("band0", 80, 8);
        transDectBands[1] = createTransientDetector("band1", 350, 4);
        transDectBands[2] = createTransientDetector("band2", 3000, 2.5);
        transDectBands[3] = createTransientDetector("band3", 7000, 2);

        testAudio.connect(delay);    
        delay.connect(songGain);
        songGain.connect(context.destination);
        testAudio.start(0,0);   
        //testAudio.connect(analyser);
      //  analyser.connect(delay);
       // compGlobal.connect(context.destination);
       // gainByTransient.connect(context.destination);

        // Get a canvas defined with ID "oscilloscope"
        // canvas = document.getElementById("oscilloscope");
        // canvasCtx = canvas.getContext("2d");

        // outText = document.getElementById("notes");

        start(bandsCount, fps, timeToFall);
        draw();
    }

   function isNumberEqual(num1, num2) {
       return Math.abs(num1 - num2) <= 1.0;
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

        transDec.results.transientLevel = (transDec.compLocal.reduction - transDec.compGlobal.reduction);
        if(isNumberEqual(transDec.compGlobal.reduction, 0)) {
            transDec.results.transientLevel = -1;
        }
        transDec.debugGain.gain.setValueAtTime(transDec.settings.bandToMaster, context.currentTime);
    }

    function updateGlobalValues(){
        songGain.gain.setValueAtTime(globalSettings.songGain, context.currentTime);

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
        updateGlobalValues();
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

        // bands[0] = bands[1] = bands[2] = bands[3] = transientLevel > 0 ? 1 : 0;
        // bands[0] = transientLevel > 0;
        bands[0] = Number(transDectBands[0].results.transientLevel > 0.0);
        bands[1] = Number(transDectBands[1].results.transientLevel > 0.0);
        bands[2] = Number(transDectBands[2].results.transientLevel > 0.0);
        bands[3] = Number(transDectBands[3].results.transientLevel > 0.0);

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

// src: https://stackoverflow.com/questions/31644060/how-can-i-get-an-audiobuffersourcenodes-current-time
function createSound(buffer, context) {
    var sourceNode = null,
        startedAt = 0,
        pausedAt = 0,
        playing = false;

    sourceNode = context.createBufferSource();
    sourceNode.buffer = buffer;
    var play = function(sound) {
        var offset = pausedAt;
        sourceNode.start(0, offset);
        startedAt = context.currentTime - offset;
        pausedAt = 0;
        playing = true;
    };

    var pause = function() {
        var elapsed = context.currentTime - startedAt;
        stop();
        pausedAt = elapsed;
    };

    var stop = function() {
        if (sourceNode) {          
            sourceNode.stop(0);
        }
        pausedAt = 0;
        startedAt = 0;
        playing = false;
    };

    var getPlaying = function() {
        return playing;
    };

    var getCurrentTime = function() {
        if(pausedAt) {
            return pausedAt;
        }
        if(startedAt) {
            return context.currentTime - startedAt;
        }
        return 0;
    };

    var getDuration = function() {
      return buffer.duration;
    };

    return {
        getCurrentTime: getCurrentTime,
        getDuration: getDuration,
        getPlaying: getPlaying,
        play: play,
        pause: pause,
        stop: stop,
        sourceNode: sourceNode
    };
}