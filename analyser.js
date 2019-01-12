// global settings
const songName = "MGMT - Little Dark Age (Official Video).mp3"

const bandsCount = 4; //TODO: remove, as its hardwired anyway
var fps = 60;
const timeToFall = 3;
var bands = [4];

const 
    comp_global_release = 0.01; 
    comp_global_thresshold = -40, 
    comp_global_ratio = 12;
const comp_local_attack = 0.00,
    comp_local_release = 0.0, 
    comp_local_thresshold = -40, 
    comp_local_ratio = 12;
var gui = new dat.GUI();

// global variables
var context = new AudioContext();
var songAudioSource;
var globalSettings = {
    songGain: 1.0,
};

// entry point for front-end
function Start(){

    //initalization of the song
    let request = new XMLHttpRequest();
    request.open('GET', "sounds/" + songName, true);
    request.responseType = 'arraybuffer';

    request.onload = function () {
        var undecodedAudio = request.response;
        context.decodeAudioData(undecodedAudio, function (buffer) {
            songAudioSource = context.createBufferSource();
            songAudioSource.buffer = buffer;        
            OnLoadFinished();
        });
    };

    // gain controller for song, only used for debugging purpose
    var songGain = context.createGain();
  
    var gain = context.createGain();
    gain.gain.value = 0;
    gain.connect(context.destination);
    request.send();

    // wire gainnode to datGUI
    gui.add(globalSettings, "songGain",0.0, 1.0);
    
    // setup delay node. This is neccessary, so than the player has time to react to a falling note block.
    var delay = context.createDelay(timeToFall);
    delay.delayTime.value = timeToFall;

    var transDectBands = [];
    // create the transient detectors for all four bands, after the song was loaded
    function OnLoadFinished(){
        
        // creates a single TransientDetectorObject
        function createTransientDetector(name, attack, areaStartHz, areaEndHz, areaQ){
            
            var transDec = [];
            // setup the WebAudio nodes
            transDec.compMicro = context.createDynamicsCompressor();
            transDec.compMacro = context.createDynamicsCompressor();
            transDec.filterLowPass = context.createBiquadFilter();
            transDec.filterLowPass.type = "lowpass";
            transDec.filterHighPass = context.createBiquadFilter();
            transDec.filterHighPass.type = "highpass";
            transDec.debugGain = context.createGain();

            songAudioSource.connect(transDec.filterHighPass);
            transDec.filterHighPass.connect(transDec.filterLowPass);
            transDec.filterLowPass.connect(transDec.compMacro);
            transDec.filterLowPass.connect(transDec.compMicro);
            transDec.filterLowPass.connect(transDec.debugGain);
            transDec.debugGain.connect(context.destination);

            transDec.guiFolder = gui.addFolder(name);

            // optional debug code below
            {
                // settings dictonary for DatGUI
                var transientSettings = { 
                
                    attack: attack, // the attack of the local/fast compressor
                    transientLength: 0.7, 
                    threshold: 4, 
                    localRelease: 0.0006, 
                    areaStartHz: areaStartHz, 
                    areaEndHz: areaEndHz, 
                    areaQ: areaQ,
                    bandToMaster: 0.0
                };
    
                // output dictionary for DatGUI
                var results = {
                    transientLevel: 0,
                };
    
                // link settings to DatGUI
                transDec.guiFolder.add(results, 'transientLevel', -2, 2).listen();
                transDec.guiFolder.add(transientSettings, 'bandToMaster', 0, 1);
                transDec.guiFolder.add(transientSettings, 'attack').min(0.001).max(0.2);
                transDec.guiFolder.add(transientSettings, 'areaStartHz').min(20).max(5500);
                transDec.guiFolder.add(transientSettings, 'areaEndHz').min(50).max(5500);
                transDec.guiFolder.add(transientSettings, 'areaQ').min(0).max(20);
                transDec.guiFolder.add(transientSettings, 'transientLength').min(0.001).max(1.5);
                transDec.guiFolder.add(transientSettings, 'localRelease').min(0.000).max(0.001);
            
                transDec.settings = transientSettings;
                transDec.results = results;
            }
            return transDec;
        }

        // setup transient detectors
        transDectBands[0] = createTransientDetector("band0", 0.072, 20, 80, 14.0);
        transDectBands[1] = createTransientDetector("band1", 0.08, 140, 250, 7.4);
        transDectBands[2] = createTransientDetector("band2", 0.08, 1000, 1400, 1.9);
        transDectBands[3] = createTransientDetector("band3", 0.76, 3600, 4100, 7);

        // wire nodes together
        songAudioSource.connect(delay);    
        delay.connect(songGain);
        songGain.connect(context.destination);

        // start playing song
        songAudioSource.start(0,0);   

        // notify front-end over finished initalization
        start(bandsCount, fps, timeToFall);
        draw();
    }

    // cessy float/double approximation function (i'm too scared to change the 1.0 :/ )
   function isNumberEqual(num1, num2) {
       return Math.abs(num1 - num2) <= 1.0;
   }

    // applys the values manged by DatGUI to the webaudio nodes.
    // normaly this would be done by DatGUI, but since the raw values (gain, freq,...) 
    // are wrapped inside some abstraction class, we need to manually apply them.
    function updateTransientDetectorSettings(transDec) {
    
        transDec.compMacro.attack.setValueAtTime(transDec.settings.attack, context.currentTime);
        transDec.compMacro.release.setValueAtTime(transDec.settings.transientLength, context.currentTime);
        transDec.compMacro.threshold.setValueAtTime(comp_global_thresshold, context.currentTime);
        transDec.compMacro.ratio.setValueAtTime(comp_global_ratio, context.currentTime);

        transDec.compMicro.attack.setValueAtTime(comp_local_attack, context.currentTime);
        transDec.compMicro.release.setValueAtTime(transDec.settings.localRelease, context.currentTime);
        transDec.compMicro.threshold.setValueAtTime(comp_local_thresshold, context.currentTime);
        transDec.compMicro.ratio.setValueAtTime(comp_local_ratio, context.currentTime);

        transDec.filterLowPass.frequency.setValueAtTime(transDec.settings.areaEndHz, context.currentTime);
        transDec.filterHighPass.frequency.setValueAtTime(transDec.settings.areaStartHz, context.currentTime);
        transDec.filterLowPass.Q.setValueAtTime(transDec.settings.areaQ, context.currentTime);
        transDec.filterHighPass.Q.setValueAtTime(transDec.settings.areaQ, context.currentTime);

        transDec.results.transientLevel = (transDec.compMicro.reduction - transDec.compMacro.reduction);
        // prevents a few pseudo notes that are emitted when the song ends
        if(isNumberEqual(transDec.compMacro.reduction, 0)) {
            transDec.results.transientLevel = -1;
        }
        transDec.debugGain.gain.setValueAtTime(transDec.settings.bandToMaster, context.currentTime);
    }

    function updateGlobalValues(){
        songGain.gain.setValueAtTime(globalSettings.songGain, context.currentTime);
    }

    // regular update function
    function draw() {
        requestAnimationFrame(draw);
        updateGlobalValues();
        updateTransientDetectorSettings(transDectBands[0]);
        updateTransientDetectorSettings(transDectBands[1]);
        updateTransientDetectorSettings(transDectBands[2]);
        updateTransientDetectorSettings(transDectBands[3]);

        // there can be either transient (1) or no transient (0)...
        bands[0] = Number(transDectBands[0].results.transientLevel > 0.0);
        bands[1] = Number(transDectBands[1].results.transientLevel > 0.0);
        bands[2] = Number(transDectBands[2].results.transientLevel > 0.0);
        bands[3] = Number(transDectBands[3].results.transientLevel > 0.0);

        // pass values to front-end
        step(bands);
    }      
}