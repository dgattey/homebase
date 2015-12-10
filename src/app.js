var mode = 0;
var currLights = [];
var currPointers = [];
var floors = [];
var roomGroups = [];
var activeTexts = [];
var tempTexts = [];
var canvas = new fabric.Canvas('c', {
    selection: false
});
var colors = {
    touch: '#C31F30',
    noTouch: 'rgba(200,200,220, 0.8)'
};

var spotifyApi = new SpotifyWebApi();
var audio = new Audio();
var playlist;
var playListIndex = 0;

spotifyApi.searchTracks('You and I')
  .then(function(data) {
    //console.log('Search by "You and I"', data);
    playlist = data;
  }, function(err) {
    console.error(err);
  });

var Pointer = function() {
    var circle = new fabric.Circle();

    // Move positions on the canvas and shows circle
    this.show = function() {
        if (this.notTouching) return; // Not pointing toward canvas

        // Determine if the finger is touching or not
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

/*
 * LEAP EVENT LOOP - runs on each frame
 */
Leap.loop(function(frame) {
    // Creates a pointer for each finger and positions them
    var isSelecting = false;
    var closedFist = true;

    // Grab index finger of first hand and use as pointer
    for(var f in frame.hands){
        var p = currPointers[f];
        if (p) p.hide();

        // Get data
        var hand = frame.hands[f];
        if (hand.grabStrength <= 0.9) closedFist = false;
        var finger = hand.indexFinger;
        
        // If there's a finger and no closed fist, show it!
        if (finger && !closedFist) {
            if (!p) p = currPointers[f] = new Pointer();
            p.getPositionAndRadius(finger);
            p.setState(finger.touchZone, isSelecting);
            if (!p.isShown) p.show();

            // Set global state variables
            if (!p.notTouching) notTouching = false;
            if (p.isTouching) isSelecting = true;

            // TODO: If we're hovering with one hand, move sliders based on hand position
            if (p.isHovering) {
                var slider = document.getElementById("slider");
                slider.value = scalePercent(p.percentY, slider.min*1.0, slider.max*1.0);
                moveSlider();
            }
        }
    }

    // If no fingers pointing at all, deselect room
    if (closedFist) deselectRoom();

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

// Sets up Leap options
Leap.loopController.setBackground(true);

// For the top left menu
var toggleAppMenu = function(isOpening) {
    var toggleClass = "toggle-app-menu";
    var optionsClasses = document.getElementById("options").classList;
    if (isOpening === undefined){
      isOpening = !optionsClasses.contains(toggleClass);
    }
    if (!isOpening) {
        optionsClasses.remove(toggleClass);
    } else {
        deselectRoom();
        optionsClasses.add(toggleClass);
        canvas.setActiveObject(undefined);
    }
};

// Set slider initially
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

// Define rooms
floors = [
  [new fabric.Rect({
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
    }),
    new fabric.Rect({
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
    }),
    new fabric.Rect({
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
    }),
    new fabric.Rect({
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
    }),
    new fabric.Rect({
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
    })
  ],

  [new fabric.Rect({
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
    }),
    new fabric.Rect({
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
    }),
    new fabric.Rect({
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
    }),
    new fabric.Rect({
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
    }),
    new fabric.Rect({
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
    })
  ],

  [new fabric.Rect({
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
    })
  ]
];

document.changeMode = function(index) {
    mode = index;
    for (var l = 0; l < currLights.length; l++) {
        canvas.remove(currLights[l]);
    }
    for (var i = 0; i < activeTexts.length; i++) { //clear old room labels
      canvas.remove(activeTexts[i]);
    }
    activeTexts = [];
    currLights = [];
    for (var room = 0; room < floors[floor.selectedIndex].length; room++) {
        var r =  floors[floor.selectedIndex][room];
        var activeRoom = r == canvas.getActiveObject();
        canvas.remove(r);
        setColor(r);
        canvas.add(r);
        addRoomText(r);
        if (mode == 1 && r.lights !== undefined) {
            addLights(r);
        }
    }

    deselectRoom();

    var slider = document.getElementById("slider");
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

    toggleAppMenu(false);
};

// Set initial room colors and add current floor
var floor = document.getElementById("floor");
var prevFloor = floor.selectedIndex;
for (var room = 0; room < floors[floor.selectedIndex].length; room++) {
    floors[floor.selectedIndex][room].setControlsVisibility({
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
    setColor(floors[floor.selectedIndex][room]);

    canvas.add(floors[floor.selectedIndex][room]);
    addRoomText(floors[floor.selectedIndex][room]); //draws titles for initial floor plan render
}

// Changing floors
floor.addEventListener("change", function() {
    for (var room = 0; room < floors[prevFloor].length; room++) {
        canvas.remove(floors[prevFloor][room]);
    }
    for (var l = 0; l < currLights.length; l++) {
        canvas.remove(currLights[l]);
    }
    currLights = [];
    for (room = 0; room < floors[floor.selectedIndex].length; room++) {
        floors[floor.selectedIndex][room].setControlsVisibility({
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
        setColor(floors[floor.selectedIndex][room]);
        canvas.add(floors[floor.selectedIndex][room]);
        addRoomText(floors[floor.selectedIndex][room]); //handles drawing title for changing floors
        if (mode == 1 && floors[floor.selectedIndex][room].lights !== undefined) {
            addLights(floors[floor.selectedIndex][room]);
        }
    }
    prevFloor = floor.selectedIndex;
});

var bigRoom;
var gray = rgbToHex(190, 190, 190);

canvas.on('object:selected', function(options){
    selectRoom(options.target);
});
canvas.on('selection:cleared', function(options) {
    deselectRoom();
});

function addRoomText(room) {
  var roomTitle = new fabric.Text(room.name, {fontSize: 18,
                                              fill: '#FFFFFF',
                                              fontFamily: 'Helvetica',
                                              selectable: false});
  roomTitle.set({
    left: room.left + (room.width / 2),
    top: room.top + (room.height / 2),
    originX: 'center',
    originY: 'center'});

  if (room.name == "Bathroom") { //weird special case for orienting text
    roomTitle.set({angle: 90});
  }

  activeTexts.push(roomTitle);
  canvas.add(roomTitle);
}

function selectRoom(targetedRoom) {
    var room;
    if (targetedRoom == bigRoom || targetedRoom.isType("circle")) {
        return;
    }
    if (bigRoom) {
        deselectRoom();
    }

    // Save prior colors & set all current colors to gray
    for (r = 0; r < floors[floor.selectedIndex].length; r++) {
        room = floors[floor.selectedIndex][r];
        if (!room.priorColor) room.priorColor = room.fill;
        room.set('fill', gray);
    }

    var canvasWidthFrac = canvas.width*0.65;
    var canvasHeightFrac = canvas.height*0.65;
    var width;
    var height;
    var widthIfHeightLarger = targetedRoom.width * (canvasHeightFrac / targetedRoom.height);
    var scale;
    if (widthIfHeightLarger < canvasWidthFrac){
        width = widthIfHeightLarger;
        height = canvasHeightFrac;
        scale = canvasHeightFrac/targetedRoom.height;
    } else{
        width = canvasWidthFrac;
        height = targetedRoom.height * (canvasWidthFrac / targetedRoom.width);
        scale = canvasWidthFrac/targetedRoom.width;
    }

    bigRoom = new fabric.Rect({
        name: targetedRoom.name,
        width: width,
        height: height,
        left: canvas.width*0.5-width/2,
        top: canvas.height*0.5-height/2,
        fill: targetedRoom.priorColor,
        originX: 'left',
        originY: 'top',
        lights: (targetedRoom.lights === undefined) ? [] : JSON.parse(JSON.stringify(targetedRoom.lights)),
        lockMovementX: true,
        lockMovementY: true
    });
    bigRoom.targetedRoom = targetedRoom;
    bigRoom.setControlsVisibility({
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
    if (mode == 1) {
        var bigRoomLightIndex = currLights.length;
        for (var l = 0; l < bigRoom.lights.length; l++) {
            bigRoom.lights[l].radius = bigRoom.lights[l].radius*scale;
            bigRoom.lights[l].indices.currLightIndex = bigRoomLightIndex + l;
        }
    }

    canvas.add(bigRoom);

    var roomTitle;
    if (targetedRoom.name == "Bathroom") { //weird special case for orienting text
      roomTitle = new fabric.Text("Bath-\nroom", {fontSize: 18,
                                                  fill: '#FFFFFF',
                                                  fontFamily: 'Helvetica'});
      roomTitle.set({
        left: canvas.width / 2,
        top: 175-height/2 + roomTitle.height / 2,
        // top: canvas.height / 2,
        originX: 'center',
        originY: 'center'});
    } else {
      roomTitle = new fabric.Text(targetedRoom.name, {fontSize: 18,
                                                      fill: '#FFFFFF',
                                                      fontFamily: 'Helvetica'});
      roomTitle.set({
        left: canvas.width / 2,
        top: 175-height/2 + roomTitle.height / 2,
        // top: canvas.height / 2,
        originX: 'center',
        originY: 'center'});
    }

    // var roomTemp = new fabric.Text(room.temp + "F", {fontSize: 20,
    //                                            fill: '#FFFFFF',
    //                                            fontFamily: 'Helvetica',
    //                                            left: canvas.width / 2,
    //                                            top: canvas.height / 2,
    //                                            originX: 'center', 
    //                                            originY: 'center'});

    // if (targetedRoom.name == "Hallway") {
    //   roomTemp.set({top: roomTitle.top + 25});
    // }
    // canvas.add(roomTemp);
    canvas.add(roomTitle);

    activeTexts.push(roomTitle);
    // tempTexts.push(roomTemp);
    bigRoom.bringToFront();
    roomTitle.bringToFront();
    // roomTemp.bringToFront();
    if (mode == 1) {
        addLights(bigRoom);
    }

    if (mode === 0) {
        slider.value = targetedRoom.temp;
    } else if (mode == 2) {
        slider.value = targetedRoom.vol;
    }

    toggleAppMenu(false);
}

function deselectRoom() {
    if (!bigRoom) return;

    for (var r = 0; r < floors[floor.selectedIndex].length; r++) {
        var room = floors[floor.selectedIndex][r];
        room.set('fill', room.priorColor);
        room.priorColor = undefined;
    }
    var numLights = currLights.length - 1 - bigRoom.lights.length;
    if (mode == 1) {
      for (var light = currLights.length - 1; light > numLights; light--) {
        canvas.remove(currLights[light]);
        currLights.splice(currLights[light], -1);
      }
    }

    for (var i = 0; i < tempTexts.length; i++) {
      canvas.remove(tempTexts[i]);
    }

    for (var i = 0; i < activeTexts.length; i++) {
      canvas.remove(activeTexts[i]); //clear all room titles on deselect
    }
    activeTexts = [];
    // canvas.remove(activeTexts[activeTexts.length - 1]);
    canvas.remove(bigRoom);

    for (var r = 0; r < floors[floor.selectedIndex].length; r++) {
      // if (floors[floor.selectedIndex][r].name == bigRoom.name) {
        addRoomText(floors[floor.selectedIndex][r]); //redraw all room titles on deselect
      // }
    }
    bigRoom = undefined;


}

var playing = false;
document.getElementById("playPause").addEventListener("click", function() {
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
});

document.getElementById("next").addEventListener("click", nextSong);
audio.addEventListener("ended", nextSong);

document.getElementById("prev").addEventListener("click", function() {
    playListIndex = Math.max(playListIndex - 1, 0);
    playSong(true);
});

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
            playing = true;
        }
    }
}

function nextSong() {
    if (mode == 2) {
        playListIndex = (playListIndex + 1) % playlist.tracks.items.length;
        playSong(true);
    }
}

// Moving slider (input is not supported in IE10 so need to also do change)
slider.addEventListener("input", moveSlider);
slider.addEventListener("change", moveSlider);

document.getElementById("r").addEventListener("input", moveSlider);
document.getElementById("r").addEventListener("change", moveSlider);
document.getElementById("g").addEventListener("input", moveSlider);
document.getElementById("g").addEventListener("change", moveSlider);
document.getElementById("b").addEventListener("input", moveSlider);
document.getElementById("b").addEventListener("change", moveSlider);

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
            indices: l.indices,
            originX: 'left',
            originY: 'top',
            lockMovementX: true,
            lockMovementY: true
        });
        cir.setControlsVisibility({
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
        canvas.add(cir);
        currLights.push(cir);
    }
}

function moveSlider() {
    var targeted = (bigRoom ? bigRoom.targetedRoom : undefined);
    var object = targeted || canvas.getActiveObject();
    if (mode == 2) {
        audio.volume = slider.value/100;
    }
    if (object) {
        var isRoom = object.isType("rect");
        if (isRoom) {
            if (mode != 1) {
                canvas.remove(object);
            }
            if (mode === 0) {
                object.set({ temp: slider.value });
            } else if (mode == 1 && object.lights !== undefined) {
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
            } else if (mode == 2) {
                object.set({ vol: slider.value });
            }
            if (mode != 1) {
                setColor(object);
                canvas.add(object);
            }
                canvas.setActiveObject(object);
        }
    }
}

function setColor(room) {
    var frac;
    if (mode === 0) {
        if (!room.temp) room.set({
            temp: 72
        });
        frac = (room.temp - 55) / (85 - 55);
        room.set({
            fill: rgbToHex(Math.floor(255 * frac), 0, Math.floor(255 * (1 - frac)))
        });
    } else if (mode == 1) {
        room.set({
            fill: rgbToHex(50, 50, 50)
        });
    } else if (mode == 2) {
        if (!room.vol) room.set({
            vol: 0
        });
        frac = (room.vol) / 100;
        room.set({
            fill: rgbToHex(Math.floor(frac * 129), Math.floor(frac * 183), Math.floor(frac * 26))
        });
    }
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}