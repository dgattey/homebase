/*
 * HOMEBASE CONTROLLER
 * This is the master file for all JS code for Homebase. The file is
 * organized as follows, with headings for each section
 * 
 * 1. Data
 * 2. LEAP event loop
 * 3. Setup and initialization
 * 4. Floorplan & input functions
 * 5. Room functions
 * 6. Music functions
 * 7. Helper utilities
 */

// State data
var mode = 0;
var currentFloor = 0;
var prevFloor = currentFloor;
var appMenu = {
    open: false,
    changed: false
};
var floorMenu = {
    open: false,
    changed: false
};
var time = {
    curr: undefined,
    lastMusicChange: undefined
};

// Fabric/canvas data
var canvas = new fabric.Canvas('c', {
    selection: false
});
var bigRoom;
var currLights = [];
var currPointers = [];
var floors = [];
var roomGroups = [];
var activeTexts = [];
var playPauseShape;

// Sliders
var slider = document.getElementById("slider");
var rSlide = document.getElementById("r");
var gSlide = document.getElementById("g");
var bSlide = document.getElementById("b");

// Interface data
var colors = {
    touch: '#C31F30',
    noTouch: 'rgba(200,200,220, 0.8)',
    gray: rgbToHex(190, 190, 190)
};

// Music data
var spotifyApi = new SpotifyWebApi();
var audio = new Audio();
var playlist;
var playListIndex = 0;
var songSearch = 'You and I';
var playing = false;
var musicThreshold = 1500;

/*
* Class for drawing a pointer on the canvas. When instantiated, creates a 
* circle. Must be shown to appear on canvas, and it takes LEAP finger data.
*/
var Pointer = function() {
    var circle = new fabric.Circle();

    // Move positions on the canvas and shows circle
    this.show = function() {
        if (this.notTouching) return; // Not pointing toward canvas

        // Determine if the finger is touching or hovering
        var color = this.isTouching ? colors.touch : colors.noTouch;

        // Set all
        circle.set('left', this.x);
        circle.set('top', this.y);
        circle.set('radius', this.r);
        circle.set('fill', color);

        canvas.add(circle);
        this.isShown = true;
    };

    // Sets booleans for state and marks intersections or gets positions as needed
    this.setState = function(touchZone, alreadySelecting) {
        this.isTouching = touchZone == 'touching';
        this.isHovering = touchZone == 'hovering';
        this.notTouching = touchZone == 'none';

        // If the other hand is already selecting, just hover with this one
        if (alreadySelecting && this.isTouching) {
            this.isTouching = false;
            this.isHovering = true;
        }

        // Only allow one finger to do selections
        if (this.isTouching && !alreadySelecting) markIntersections(new fabric.Point(this.x, this.y));
    };

    // Gets position and radius converted to canvas coords for a finger
    this.getPositionAndRadius = function(finger) {
        this.x = canvas.width/2 + finger.stabilizedTipPosition[0];
        this.y = canvas.height - finger.stabilizedTipPosition[1];
        this.z = finger.touchDistance;
        this.r = (finger.touchDistance + 1.5) * 10.0;

        // In relation to canvas
        this.percentX = scaleValue(finger.stabilizedTipPosition[0], -300.0, 300.0);
        this.percentY = scaleValue(finger.stabilizedTipPosition[1], 30.0, 400.0);
        this.percentZ = scalePercent(this.z/0.85, 0.0, 1.0);
    };

    // Remove it from the canvas
    this.hide = function() {
        canvas.remove(circle);
        this.isShown = false;
    };
};

/*
* LEAP EVENT LOOP - runs on each frame
*/
Leap.loop(function(frame) {
    time.curr = new Date().getTime();
    var data = {
        closedFist: true,
        isSelecting: false,
        notTouching: true,
        secondHand: false
    };

    // Handle gestures for each hand
    for(var f in frame.hands){
        if (f > 0) data.secondHand = true; // Keep track that we have a second hand
        var p = currPointers[f] || (currPointers[f] = new Pointer());
        p.hide();
        data.p = p;
        handleHand(frame.hands[f], data);
    }

    // If no fingers pointing at all, deselect room
    if (data.closedFist) deselectRoom();

    // If any room was selected, mark it as such
    var hasSelection = false;
    for (var i = floors.length - 1; i >= 0; i--) {
        for (var j = floors[i].length - 1; j >= 0; j--) {
            var room = floors[i][j];
            if (room.intersects && !hasSelection) {
                selectRoom(room);
                hasSelection = true;
            }
            room.intersects = false;
        }
    }
}).use('screenPosition', {scale: 0.25});

// Initialize full app!
initApp();

/*
 * SETUP
 * Various handlers to initialize different parts of the app 
 * and the LEAP handler code
 */

function initApp() {
    // Setup of various parts
    setupMusic();
    setupEventListeners();
    setupSliders();
    setupRooms();

    // Leap options
    Leap.loopController.setBackground(true);
}

// Fabric and spotify related setup to get music to play
function setupMusic() {
    // Create shape for play/pause notification
    playPauseShape = new fabric.Triangle({
        width: 50,
        height: 50,
        fill: colors.touch,
        strokeWidth: 1,
        stroke: rgbToHex(0, 0, 0),
        left: canvas.width - 10, 
        top: canvas.height - 60,
        selectable: false
    });
    playPauseShape.set('angle', 90);

    // Grab the songs we want for the hardcoded search
    spotifyApi.searchTracks(songSearch)
    .then(function(data) {
        playlist = data;
    }, function(err) {
        console.error(err);
    });
}

// Sets up the event listeners everything the user may manually interact with
function setupEventListeners() {
    // Music related event listeners
    document.getElementById("playPause").addEventListener("click", playPause);
    document.getElementById("next").addEventListener("click", nextSong);
    audio.addEventListener("ended", nextSong);
    document.getElementById("prev").addEventListener("click", prevSong);

    // Sliders
    slider.addEventListener("input", moveSlider);
    slider.addEventListener("change", moveSlider);
    rSlide.addEventListener("input", moveSlider);
    rSlide.addEventListener("change", moveSlider);
    gSlide.addEventListener("input", moveSlider);
    gSlide.addEventListener("change", moveSlider);
    bSlide.addEventListener("input", moveSlider);
    bSlide.addEventListener("change", moveSlider);

    // Canvas
    canvas.on('object:selected', function(options){
        selectRoom(options.target);
    });
    canvas.on('selection:cleared', deselectRoom);
}

// Make sliders range over the correct values according to mode
function setupSliders() {
    if (mode === 0) {
        document.getElementById("mode").innerHTML = "Mode: Temperature";
        slider.min = 55;
        slider.max = 85;
        slider.value = 72;
    } else if (mode == 1) {
        document.getElementById("mode").innerHTML = "Mode: Lights";
        slider.min = 0;
        slider.max = 100;
        slider.value = 0;
    } else if (mode == 2) {
        document.getElementById("mode").innerHTML = "Mode: Music";
        slider.min = 0;
        slider.max = 100;
        slider.value = 0;
    }
}

// Really ugly, but creates an array for each floor and adds all rooms to it (hardcoded)
function setupRooms() {
    // Floor 1
    floor1 = [];
    floor1.push(new fabric.Rect({
        name: "Kitchen",
        width: 180,
        height: 100,
        left: 200,
        top: 25,
        fill: rgbToHex(100, 100, 100),
        originX: 'left',
        originY: 'top',
        lights: [{ radius: 20, fracX: 0.80, fracY: 0.5 }],
        lockMovementX: true,
        lockMovementY: true
    }));
    floor1.push(new fabric.Rect({
        name: "Living Room",
        width: 125,
        height: 100,
        left: 70,
        top: 25,
        fill: rgbToHex(100, 100, 100),
        originX: 'left',
        originY: 'top',
        lights: [{ radius: 15, fracX: 0.5, fracY: 0.75 }],
        lockMovementX: true,
        lockMovementY: true
    }));
    floor1.push(new fabric.Rect({
        name: "Hallway",
        width: 250,
        height: 50,
        left: 70,
        top: 130,
        fill: rgbToHex(100, 100, 100),
        originX: 'left',
        originY: 'top',
        lights: [{ radius: 10, fracX: 0.75, fracY: 0.5 }],
        lockMovementX: true,
        lockMovementY: true
    }));
    floor1.push(new fabric.Rect({
        name: "Dining Room",
        width: 250,
        height: 100,
        left: 70,
        top: 185,
        fill: rgbToHex(100, 100, 100),
        originX: 'left',
        originY: 'top',
        lights: [{ radius: 15, fracX: 0.15, fracY: 0.25 }, { radius: 20, fracX: 0.85, fracY: 0.65 }],
        lockMovementX: true,
        lockMovementY: true
    }));
    floor1.push(new fabric.Rect({
        name: "Bathroom",
        width: 55,
        height: 155,
        left: 325,
        top: 130,
        fill: rgbToHex(100, 100, 100),
        originX: 'left',
        originY: 'top',
        lights: [{ radius: 10, fracX: 0.5, fracY: 0.15 }],
        lockMovementX: true,
        lockMovementY: true
    }));

    // Floor 2
    floor2 = [];
    floor2.push(new fabric.Rect({
        name: "Bedroom",
        width: 150,
        height: 100,
        left: 70,
        top: 25,
        fill: rgbToHex(100, 100, 100),
        originX: 'left',
        originY: 'top',
        lights: [{ radius: 10, fracX: 0.5, fracY: 0.25 }],
        lockMovementX: true,
        lockMovementY: true
    }));
    floor2.push(new fabric.Rect({
        name: "Bedroom",
        width: 155,
        height: 100,
        left: 225,
        top: 25,
        fill: rgbToHex(100, 100, 100),
        originX: 'left',
        originY: 'top',
        lights: [{ radius: 10, fracX: 0.5, fracY: 0.75 }],
        lockMovementX: true,
        lockMovementY: true
    }));
    floor2.push(new fabric.Rect({
        name: "Hallway",
        width: 310,
        height: 50,
        left: 70,
        top: 130,
        fill: rgbToHex(100, 100, 100),
        originX: 'left',
        originY: 'top',
        lights: [{ radius: 10, fracX: 0.35, fracY: 0.5 }],
        lockMovementX: true,
        lockMovementY: true
    }));
    floor2.push(new fabric.Rect({
        name: "Master Bedroom",
        width: 250,
        height: 100,
        left: 130,
        top: 185,
        fill: rgbToHex(100, 100, 100),
        originX: 'left',
        originY: 'top',
        lights: [{ radius: 15, fracX: 0.15, fracY: 0.25 }, { radius: 7, fracX: 0.85, fracY: 0.65 }],
        lockMovementX: true,
        lockMovementY: true
    }));
    floor2.push(new fabric.Rect({
        name: "Bathroom",
        width: 55,
        height: 100,
        left: 70,
        top: 185,
        fill: rgbToHex(100, 100, 100),
        originX: 'left',
        originY: 'top',
        lights: [{ radius: 10, fracX: 0.5, fracY: 0.5 }],
        lockMovementX: true,
        lockMovementY: true
    }));

    // Floor 3
    floor3 = [];
    floor3.push(new fabric.Rect({
        name: "Attic",
        width: 310,
        height: 260,
        left: 70,
        top: 25,
        fill: rgbToHex(100, 100, 100),
        originX: 'left',
        originY: 'top',
        lights: [{ radius: 15, fracX: 0.25, fracY: 0.25 },
        { radius: 15, fracX: 0.75, fracY: 0.25 },
        { radius: 15, fracX: 0.25, fracY: 0.75 },
        { radius: 15, fracX: 0.75, fracY: 0.75 }],
        lockMovementX: true,
        lockMovementY: true
    }));

    // Add all floors to main floor plan
    floors = [floor1, floor2, floor3];

    // Set initial room colors and add current floor
    for (var room = 0; room < floors[currentFloor].length; room++) {
        removeControls(floors[currentFloor][room]);
        setColor(floors[currentFloor][room]);
        canvas.add(floors[currentFloor][room]);
        addRoomText(floors[currentFloor][room]); //draws titles for initial floor plan render
    }
}

/*
 * INPUT & FLOORPLAN FUNCTIONS
 * Functions to manipulate the floorplan and respond to input changes like
 * changing floors, modes, or selecting/deselecting rooms
 */

// Open menus if user hovering over them & closed, or hide them if user no longer over but are open
function toggleMenusAsNecessary(overAppMenu, overFloorMenu) {
    if (!appMenu.open && overAppMenu) toggleAppMenu(true);
    else if (!floorMenu.open && overFloorMenu) toggleFloorMenu(true);
    else if (appMenu.open && appMenu.changed && !overAppMenu) toggleAppMenu(false);
    else if (floorMenu.open && floorMenu.changed && !overFloorMenu) toggleFloorMenu(false);
}

// Changes mode or floor depending on type
function changeAppFloorMode(hand, type) {
    var dir = hand.palmNormal;
    var min = 0.4;
    var max = 0.6;
    if (type =='mode') {
        appMenu.changed = true;
        if (dir[0] > max && dir[1] > -min) document.changeMode(2); // Music
        else if (dir[0] < min && dir[1] < -max) document.changeMode(0); // Temp
        else document.changeMode(1); // Lights
    }
    else if (type == 'floor') {
        floorMenu.changed = true;
        if (dir[0] < -max && dir[1] > -min) document.changeFloor(1);
        else if (dir[0] > -min && dir[1] < -max) document.changeFloor(3);
        else document.changeFloor(2);
    }
}

// Handles a hand
function handleHand(hand, data) {
    var fist = hand.grabStrength > 0.8;
    var finger = hand.indexFinger;
    var overAppMenu = hand.palmPosition[0] < -260 && hand.palmPosition[1] > 370;
    var overFloorMenu = hand.palmPosition[0] > 260 && hand.palmPosition[1] > 370;

    // Pause music if pinched (only gesture with pinch)
    if (hand.pinchStrength > 0.8) {
        var musicThresholdPassed = (!time.lastMusicChange || time.curr - time.lastMusicChange > musicThreshold);
        if (mode == 2 && musicThresholdPassed) {
            playPause();
            time.lastMusicChange = time.curr;
        }
        return;
    }

    // Toggle menus as needed (only gestures with fist)
    if (fist) {
        toggleMenusAsNecessary(overAppMenu, overFloorMenu);
        return;
    }
    data.closedFist = false; // Since no fist

    // If app/floor menu open and hovering over menu, use palm normal to change mode/floor
    if (appMenu.open && overAppMenu) changeAppFloorMode(hand, 'mode');
    else if (floorMenu.open && overFloorMenu) changeAppFloorMode(hand, 'floor');

    // If there's a finger and no closed fist or pinched, show it!
    else if (finger) {
        data.p.getPositionAndRadius(finger);
        data.p.setState(finger.touchZone, data.isSelecting);
        if (!data.p.isShown) data.p.show();

        // Set global state variables
        if (!data.p.notTouching) data.notTouching = false;
        if (data.p.isTouching) data.isSelecting = true;

        // If this is the second hand and we're in lights mode, use it for RGB
        if (data.secondHand && mode == 1) {
            rSlide.value = scalePercent(data.p.percentX, rSlide.min*1.0, rSlide.max*1.0);
            gSlide.value = scalePercent(data.p.percentY, gSlide.min*1.0, gSlide.max*1.0);
            bSlide.value = scalePercent(data.p.percentZ, bSlide.min*1.0, bSlide.max*1.0);
            moveSlider();
            return;
        }

        // If we're hovering with one hand, move sliders based on hand position
        if (data.p.isHovering && !data.isSelecting) {
            slider.value = scalePercent(data.p.percentY, slider.min*1.0, slider.max*1.0);
            moveSlider();
        }
    }
}

// Changes between floors (floors range 1-3)
document.changeFloor = function(index) {
    if (currentFloor == index-1) return; // same as before
    currentFloor = index-1; // save for next time

    // Pause music
    audio.pause();
    playing = false;
    document.getElementById("playPause").innerHTML = "Play";

    // Remove old floors and lights
    for (var room = 0; room < floors[prevFloor].length; room++) {
        canvas.remove(floors[prevFloor][room]);
    }
    for (var l = 0; l < currLights.length; l++) {
        canvas.remove(currLights[l]);
    }

    // Add back in new rooms, lights, and text
    currLights = [];
    for (room = 0; room < floors[currentFloor].length; room++) {
        removeControls(floors[currentFloor][room]);
        setColor(floors[currentFloor][room]);
        canvas.add(floors[currentFloor][room]);
        addRoomText(floors[currentFloor][room]); //handles drawing title for changing floors
        if (mode == 1 && floors[currentFloor][room].lights !== undefined) {
            addLights(floors[currentFloor][room], room);
        }
    }
    prevFloor = currentFloor;
};

// Changes between apps (modes, ranging from 0-2)
document.changeMode = function(index) {
    if (mode == index) return; // same as last time
    mode = index; // new value save

    // Stop music
    audio.pause();
    playing = false;
    document.getElementById("playPause").innerHTML = "Play";

    // Remove all lights and text
    for (var l = 0; l < currLights.length; l++) {
        canvas.remove(currLights[l]);
    }
    for (var i = 0; i < activeTexts.length; i++) { //clear old room labels
        canvas.remove(activeTexts[i]);
    }
    activeTexts = [];
    currLights = [];

    // For each room, reset color, lights, and text
    for (var room = 0; room < floors[currentFloor].length; room++) {
        var r =  floors[currentFloor][room];
        var activeRoom = r == canvas.getActiveObject();
        canvas.remove(r);
        setColor(r);
        canvas.add(r);
        addRoomText(r);
        if (mode == 1 && r.lights !== undefined) {
            addLights(r);
        }
    }

    deselectRoom(); // Make sure no rooms selected
    setupSliders(); // Reset slider values
};

// Selects a given room
function selectRoom(targetedRoom) {
    var room;
    if (targetedRoom == bigRoom || targetedRoom.isType("circle")) return; // No selection change
    if (bigRoom) deselectRoom(); // Different bigroom before

    // Save prior colors & set all current colors to gray
    for (r = 0; r < floors[currentFloor].length; r++) {
        room = floors[currentFloor][r];
        if (!room.priorColor) room.priorColor = room.fill;
        room.set('fill', colors.gray);
    }

    // Determine size
    var size = determineRoomSize(targetedRoom);

    // Add room text and bigroom, bringing those to front
    addRoomText(targetedRoom);
    addBigroom(targetedRoom, size);
    var roomTitle = createRoomTitle(targetedRoom, size);
    bigRoom.bringToFront();
    roomTitle.bringToFront();

    // Based on mode, change slider values to the room's data
    if (mode == 1) addLights(bigRoom);
    else if (mode === 0) slider.value = targetedRoom.temp;
    else if (mode == 2) slider.value = targetedRoom.vol;

    // Toggle menus
    toggleAppMenu(false);
    toggleFloorMenu(false);
}

// Deselects the current bigroom
function deselectRoom() {
    if (!bigRoom) return;

    // Reset room colors to prior colors
    var r, i;
    for (r = 0; r < floors[currentFloor].length; r++) {
        var room = floors[currentFloor][r];
        room.set('fill', room.priorColor);
        room.priorColor = undefined;
    }

    // Deal with lights
    var numLights = currLights.length - 1 - bigRoom.lights.length;
    if (mode == 1) for (var light = currLights.length - 1; light > numLights; light--) {
        canvas.remove(currLights[light]);
        currLights.splice(currLights[light], -1);
    }

    // Deal with texts
    for (var i2 = 0; i2 < activeTexts.length; i2++) {
        canvas.remove(activeTexts[i2]); //clear all room titles on deselect
    }
    activeTexts = [];
    for (var r2 = 0; r2 < floors[currentFloor].length; r2++) {
        addRoomText(floors[currentFloor][r2]); //redraw all room titles on deselect
    }

    // Get rid of bigroom
    canvas.remove(bigRoom);
    bigRoom = undefined;
}

// Reacts to moving the slider by adding/removing objects and changing global variables
function moveSlider() {
    var targeted = (bigRoom ? bigRoom.targetedRoom : undefined);
    var object = targeted || canvas.getActiveObject();

    // Make sure to set volume if on type 2
    if (mode == 2) {
        audio.volume = slider.value/100;
    }

    if (object && object.isType("rect")) {
        if (mode != 1) {
            canvas.remove(object);
        }
        // Set temp
        if (mode === 0) {
            object.set({ temp: slider.value });
        } 

        // Set lights up
        else if (mode == 1 && object.lights !== undefined) {
            for (var l = 0; l < object.lights.length; l++) {
                object.lights[l].brightness = slider.value;
                var frac = slider.value/100;
                object.lights[l].color = rgbToHex(parseInt(Math.floor(document.getElementById("r").value*frac), 10),
                    parseInt(Math.floor(document.getElementById("g").value*frac), 10),
                    parseInt(Math.floor(document.getElementById("b").value*frac), 10));
                canvas.remove(currLights[object.lights[l].indices.currLightIndex]);
                currLights[object.lights[l].indices.currLightIndex].set({
                    fill: object.lights[l].color
                });
                canvas.add(currLights[object.lights[l].indices.currLightIndex]);
            }
        }
        // Set volume
        else if (mode == 2) {
            object.set({ vol: slider.value });
        }

        if (mode != 1) {
            setColor(object);
            canvas.add(object);
        }

        // Make sure to update the active object
        canvas.setActiveObject(object);
    }
}

// Sets bigroom equal to a new fabric object and adds it to canvas
function addBigroom(targetedRoom, size) {
    bigRoom = new fabric.Rect({
        name: targetedRoom.name,
        width: size.width,
        height: size.height,
        left: canvas.width*0.5-size.width/2,
        top: canvas.height*0.5-size.height/2,
        fill: targetedRoom.priorColor,
        originX: 'left',
        originY: 'top',
        lights: (targetedRoom.lights === undefined) ? [] : JSON.parse(JSON.stringify(targetedRoom.lights)),
        lockMovementX: true,
        lockMovementY: true
    });
    bigRoom.targetedRoom = targetedRoom;
    removeControls(bigRoom);

    // Make sure lights are good
    if (mode == 1) {
        var bigRoomLightIndex = currLights.length;
        for (var l = 0; l < bigRoom.lights.length; l++) {
            bigRoom.lights[l].radius = bigRoom.lights[l].radius * size.scale;
            bigRoom.lights[l].indices.currLightIndex = bigRoomLightIndex + l;
        }
    }
    canvas.add(bigRoom);
}

/*
 * ROOM FUNCTIONS
 * A collection of functions that affect a certain room
 */

// Adds the text name for a given room to canvas
function addRoomText(room) {
    var roomTitle = new fabric.Text(room.name, {fontSize: 18,
        fill: '#FFFFFF',
        fontFamily: 'Helvetica',
        selectable: false});
    roomTitle.set({
        left: room.left + (room.width / 2),
        top: room.top + (room.height / 2),
        originX: 'center',
        originY: 'center'
    });

    if (room.name == "Bathroom") { //weird special case for orienting text
        roomTitle.set({angle: 90});
    }

    activeTexts.push(roomTitle);
    canvas.add(roomTitle);
}

// Sets the color of a given room
function setColor(room) {
    var frac;

    // Temperature
    if (mode === 0) {
        if (!room.temp) room.set({
            temp: 72
        });
        frac = (room.temp - 55) / (85 - 55);
        room.set({
            fill: rgbToHex(Math.floor(255 * frac), 0, Math.floor(255 * (1 - frac)))
        });
    }

    // Lights
    else if (mode == 1) {
        room.set({
            fill: rgbToHex(50, 50, 50)
        });
    }

    // Music
    else if (mode == 2) {
        if (!room.vol) room.set({
            vol: 0
        });
        frac = (room.vol) / 100;
        room.set({
            fill: rgbToHex(Math.floor(frac * 129), Math.floor(frac * 183), Math.floor(frac * 26))
        });
    }
}

// Creates a new circle for each light for a given room
function addLights(r) {
    for (var light = 0; light < r.lights.length; light++) {
        var l = r.lights[light];
        if (!l.brightness) l.brightness = 0;
        if (!l.color) l.color = rgbToHex(0, 0, 0);
        if (!l.indices) l.indices = { currLightIndex: currLights.length };
        var cir = new fabric.Circle({
            radius: l.radius,
            left: r.left + r.width*l.fracX - l.radius,
            top: r.top + r.height*l.fracY - l.radius,
            fill: l.color,
            strokeWidth: 1,
            stroke: '#C31F30',
            indices: l.indices,
            originX: 'left',
            originY: 'top',
            lockMovementX: true,
            lockMovementY: true
        });
        removeControls(cir);
        canvas.add(cir);
        currLights.push(cir);
    }
}

// Returns width/height/scale object for size of scaled up version of this room
function determineRoomSize(room) {
    var cWFraction = canvas.width*0.65;
    var cHFraction = canvas.height*0.65;
    var data = {};
    var possibleW = room.width * (cHFraction / room.height);
    if (possibleW < cWFraction)
        data = {
            width: possibleW,
            height: cHFraction,
            scale: cHFraction/room.height
        };
    else 
        data = {
            width: cWFraction,
            height: room.height * (cWFraction / room.width),
            scale: cWFraction/room.width
        };
    return data;
}

// Creates a room title fabric object based off a room and size and puts it on canvas
function createRoomTitle(room, size) {
    var roomTitle;
    if (room.name == "Bathroom") { //weird special case for orienting text
        roomTitle = new fabric.Text("Bath-\nroom", {
            fontSize: 18,
            fill: '#FFFFFF',
            fontFamily: 'Helvetica',
            selectable: false
        });
    } else {
        roomTitle = new fabric.Text(room.name, {
            fontSize: 18,
            fill: '#FFFFFF',
            fontFamily: 'Helvetica',
            selectable: false
        });
    }
    roomTitle.set({
        left: canvas.width / 2,
        top: canvas.height*0.5-size.height/2 + roomTitle.height / 2,
        originX: 'center',
        originY: 'center'
    });
    canvas.add(roomTitle);
    activeTexts.push(roomTitle);
    return roomTitle;
}

/*
 * MUSIC FUNCTIONS
 * A collection of functions that deal with music plays and pauses, etc
 */

// Toggles between play and pause
function playPause() {
    if (mode == 2) {
        if (!playing) {
            playSong(false);
            document.getElementById("playPause").innerHTML = "Pause";
        } else {
            audio.pause();
            playing = false;
            document.getElementById("playPause").innerHTML = "Play";
        }
    }
}

// Plays the song
function playSong(reload) {
    if (mode == 2) {
        audio.volume = slider.value/100;
        if (reload || audio.src === "") {
            console.log(playlist.tracks.items[playListIndex].artists[0].name + ": " +
                playlist.tracks.items[playListIndex].name);
            audio.src = playlist.tracks.items[playListIndex].preview_url;
        }
        if (!reload || playing) {
            audio.play();
            canvas.add(playPauseShape);
            setTimeout(removePlayPauseShape, 1000);
            playing = true;
        }
    }
}

// Removes the play/pause shape from the canvas
function removePlayPauseShape() {
    canvas.remove(playPauseShape);
}

// Switches to previous song
function prevSong() {
    if (mode == 2) {
        playListIndex = Math.max(playListIndex - 1, 0);
        playSong(true);
    }
}

// Switches to next song
function nextSong() {
    if (mode == 2) {
        playListIndex = (playListIndex + 1) % playlist.tracks.items.length;
        playSong(true);
    }
}

/*
 * HELPERS
 * Utilities to help simplify code later
 */

// Scales percent between a min and max and bounds it
function scalePercent(percent, min, max) {
    var value = (max - min) * percent + min;
    return value < min ? min : value > max ? max : value;
}

// Scales value between 0 and 1
function scaleValue(value, min, max) {
    var percent = (value - min) / (max - min);
    return percent < 0 ? 0 : percent > 1 ? 1 : percent;
}

// Loops through all canvas objects and marks if the touch intersects the room
function markIntersections(point) {
    var objs = canvas.getObjects();
    for (var i = objs.length - 1; i >= 0; i--) {
        var shape = objs[i];
        if (shape.isType('rect') && shape.containsPoint(point)) {
            shape.intersects = true;
        }
    }
}

// Toggles top left app menu
function toggleAppMenu(isOpening) {
    appMenu.changed = false;
    appMenu.open = isOpening;
    var toggleClass = "toggle-app-menu";
    var optionsClasses = document.getElementById("options-app").classList;
    if (isOpening === undefined){
        isOpening = !optionsClasses.contains(toggleClass);
    }
    if (!isOpening) {
        optionsClasses.remove(toggleClass);
    } else {
        toggleFloorMenu(false);
        deselectRoom();
        optionsClasses.add(toggleClass);
    }
}

// Toggles top right floor menu
function toggleFloorMenu(isOpening) {
    floorMenu.changed = false;
    floorMenu.open = isOpening;
    var toggleClass = "toggle-floor-menu";
    var optionsClasses = document.getElementById("options-floor").classList;
    if (isOpening === undefined){
        isOpening = !optionsClasses.contains(toggleClass);
    }
    if (!isOpening) {
        optionsClasses.remove(toggleClass);
    } else {
        toggleAppMenu(false);
        deselectRoom();
        optionsClasses.add(toggleClass);
    }
}

// Removes the Fabric controls from a given shape so it can't change size
function removeControls(shape) {
    shape.setControlsVisibility({
        mtr: false,
        bl: false,
        br: false,
        tl: false,
        tr: false,
        mt: false,
        mb: false,
        ml: false,
        mr: false
    });
}

// Converts a color component to hex representation
function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

// Converts an RGB color representation to hex representation
function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}