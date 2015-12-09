var mode = 0;
var currLights = [];
var currPointers = [];
var floors = [];
var canvas = new fabric.Canvas('c', {
    selection: false
});
var colors = {
    touch: '#C31F30',
    noTouch: 'rgba(200,200,220, 0.8)'
};

var Pointer = function() {
    var circle = new fabric.Circle();

    // Move positions on the canvas and shows circle
    this.show = function(touchZone, data) {
        // Not pointing toward canvas
        if (touchZone == 'none') return;

        // Determine if the finger is touching or not
        var touching = touchZone == 'touching';
        var color = touching ? colors.touch : colors.noTouch;

        // Set all
        circle.set('left', data.x);
        circle.set('top', data.y);
        circle.set('radius', data.r);
        circle.set('fill', color);

        canvas.add(circle);
    };

    // Uses position calculated by getPositionAndRadius and converts to percent of canvas
    this.getPercentPosition = function(data) {
        return {x: data.x/canvas.width, y: data.y/canvas.height};
    };

    // Gets position and radius converted to canvas coords for a finger
    this.getPositionAndRadius = function(finger) {
        var x = canvas.width/2 + finger.stabilizedTipPosition[0];
        var y = canvas.height - finger.stabilizedTipPosition[1];
        var radius = (finger.touchDistance + 1.5) * 10.0;
        return {x: x, y: y, r: radius};
    };

    // Remove it from the canvas
    this.hide = function() {
        canvas.remove(circle);
    };
};

// Loops through all canvas objects and marks if the touch intersects the room
function markIntersections(touchData) {
    var objs = canvas.getObjects();
    for (var i = objs.length - 1; i >= 0; i--) {
        var shape = objs[i];
        if (shape.isType('rect') && shape.containsPoint(new fabric.Point(touchData.x, touchData.y))) {
            shape.intersects = true;
        }
    }
}

/*
 * LEAP EVENT LOOP - runs on each frame
 */
Leap.loop(function(frame) {
    // 10 finger max
    // Creates a pointer for each hand and positions them
    hasPointer = false;
    selecting = false;
    positions = [];
    for (var f = 0; f < 10; f++) {
        var finger = frame.fingers[f];
        var p = currPointers[f];
        if (p) p.hide();
        if (finger) {
            if (!p) p = currPointers[f] = new Pointer();
            var data = p.getPositionAndRadius(finger);
            p.show(finger.touchZone, data);
            if (finger.touchZone != 'none') hasPointer = true;
            if (finger.touchZone == 'touching') {
                selecting = true;
                markIntersections(data);
            }
            if (finger.touchZone == 'hovering') {
                var pos = p.getPercentPosition(data);
                positions.push(pos);
            }
        }
    }
    // If no fingers at all, deselect room
    if (!hasPointer) deselectRoom();

    // If not selecting anything, average positions TODO: and set the slider value 
    if (!selecting && positions.length > 0) {
        var x = 0;
        var y = 0;
        for (i = positions.length - 1; i >= 0; i--) {
            x += positions[i].x;
            y += positions[i].y;
        }
        x /= positions.length;
        y /= positions.length;
        console.log(x, y);
    }

    // If any room intersected, mark it as such
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
    // canvas.renderAll.bind(canvas);
}).use('screenPosition', {scale: 0.25});

// Sets up Leap options
Leap.loopController.setBackground(true);

// For the top left menu
var toggleAppMenu = function() {
    var toggleClass = "toggle-app-menu";
    var optionsClasses = document.getElementById("options").classList;
    if (optionsClasses.contains(toggleClass)) {
        optionsClasses.remove(toggleClass);
    } else {
        optionsClasses.add(toggleClass);
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
      width: 180,
      height: 100,
      left: 200,
      top: 25,
      fill: rgbToHex(100, 100, 100),
      originX: 'left',
      originY: 'top',
      lights: [{ radius: 10, fracX: 0.75, fracY: 0.5 }],
      lockMovementX: true,
      lockMovementY: true
    }),
    new fabric.Rect({
      width: 125,
      height: 100,
      left: 70,
      top: 25,
      fill: rgbToHex(100, 100, 100),
      originX: 'left',
      originY: 'top',
      lights: [{ radius: 10, fracX: 0.5, fracY: 0.75 }],
      lockMovementX: true,
      lockMovementY: true
    }),
    new fabric.Rect({
      width: 250,
      height: 50,
      left: 70,
      top: 130,
      fill: rgbToHex(100, 100, 100),
      originX: 'left',
      originY: 'top',
      lights: [{ radius: 10, fracX: 0.5, fracY: 0.5 }],
      lockMovementX: true,
      lockMovementY: true
    }),
    new fabric.Rect({
      width: 250,
      height: 100,
      left: 70,
      top: 185,
      fill: rgbToHex(100, 100, 100),
      originX: 'left',
      originY: 'top',
      lights: [{ radius: 10, fracX: 0.25, fracY: 0.25 }],
      lockMovementX: true,
      lockMovementY: true
    }),
    new fabric.Rect({
      width: 55,
      height: 155,
      left: 325,
      top: 130,
      fill: rgbToHex(100, 100, 100),
      originX: 'left',
      originY: 'top',
      lights: [{ radius: 10, fracX: 0.5, fracY: 0.5 }],
      lockMovementX: true,
      lockMovementY: true
    })
  ],

  [new fabric.Rect({
      width: 150,
      height: 100,
      left: 115,
      top: 75,
      fill: rgbToHex(100, 100, 100),
      originX: 'left',
      originY: 'top',
      lockMovementX: true,
      lockMovementY: true
    }),
    new fabric.Rect({
      width: 125,
      height: 100,
      left: 275,
      top: 75,
      fill: rgbToHex(100, 100, 100),
      originX: 'left',
      originY: 'top',
      lights: [{ radius: 10, fracX: 0.5, fracY: 0.5 }],
      lockMovementX: true,
      lockMovementY: true
    }),
    new fabric.Rect({
      width: 250,
      height: 50,
      left: 150,
      top: 180,
      fill: rgbToHex(100, 100, 100),
      originX: 'left',
      originY: 'top',
      lockMovementX: true,
      lockMovementY: true
    }),
    new fabric.Rect({
      width: 250,
      height: 100,
      left: 175,
      top: 235,
      fill: rgbToHex(100, 100, 100),
      originX: 'left',
      originY: 'top',
      lockMovementX: true,
      lockMovementY: true
    })
  ]
];

document.changeMode = function(index) {
    deselectRoom();
    mode = index;
    for (var l = 0; l < currLights.length; l++) {
        canvas.remove(currLights[l]);
    }
    currLights = [];
    for (var room = 0; room < floors[floor.selectedIndex].length; room++) {
        var r =  floors[floor.selectedIndex][room];
        var activeRoom = r == canvas.getActiveObject();
        canvas.remove(r);
        setColor(r);
        canvas.add(r);
        if (activeRoom) {
            canvas.setActiveObject(r);
        }
        if (mode == 1 && r.lights !== undefined) {
            addLights(r, room);
        }
    }

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
};

// Set initial room colors and add current floor
var floor = document.getElementById("floor");
var prevFloor = floor.selectedIndex;
for (var room = 0; room < floors[floor.selectedIndex].length; room++) {
    floors[floor.selectedIndex][room].setControlsVisibility({
        mtr: false
    });
    setColor(floors[floor.selectedIndex][room]);
    canvas.add(floors[floor.selectedIndex][room]);
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
            mtr: false
        });
        setColor(floors[floor.selectedIndex][room]);
        canvas.add(floors[floor.selectedIndex][room]);
        if (mode == 1 && floors[floor.selectedIndex][room].lights !== undefined) {
            addLights(floors[floor.selectedIndex][room], room);
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

    var width;
    var height;
    var widthIfHeightLarger = targetedRoom.getWidth() * (175 / targetedRoom.getHeight());
    if (widthIfHeightLarger < 250){
        width = widthIfHeightLarger;
        height = 175;
    } else{
        width = 250;
        height = targetedRoom.height * (250 / targetedRoom.width);
    }

    bigRoom = new fabric.Rect({
        width: width,
        height: height,
        left: 250-width/2,
        top: 175-height/2,
        fill: targetedRoom.priorColor,
        originX: 'left',
        originY: 'top',
        lights: JSON.parse(JSON.stringify(targetedRoom.lights)),
        lockMovementX: true,
        lockMovementY: true
    });

    canvas.add(bigRoom);
    bigRoom.bringToFront();
    if (mode == 1) {
        addLights(bigRoom);
    }
}

function deselectRoom() {
    if (!bigRoom) return;

    for (var r = 0; r < floors[floor.selectedIndex].length; r++) {
        var room = floors[floor.selectedIndex][r];
        room.set('fill', room.priorColor);
        room.priorColor = undefined;
    }
    if (mode == 1) {
      for (var light = currLights.length - 1; light > currLights.length - 1 - bigRoom.lights.length; light--) {
        canvas.remove(currLights[light]);
        currLights.splice(currLights[light], 1);
      }
    }
    canvas.remove(bigRoom);
    bigRoom = null;
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

function addLights(r, roomIndex) {
    for (var light = 0; light < r.lights.length; light++) {
        var l = r.lights[light];
        if (!l.brightness) l.brightness = 0;
        if (!l.color) l.color = rgbToHex(255, 255, 255);
        if (!l.indices) l.indices = { roomIndex: roomIndex, lightIndex: light, currLightIndex: currLights.length };
        var cir = new fabric.Circle({
            radius: l.radius,
            left: r.left + r.width*l.fracX - l.radius,
            top: r.top + r.height*l.fracY - l.radius,
            fill: rgbToHex(100, 100, 100),
            strokeWidth: l.brightness/100*l.radius,
            stroke: l.color,
            indices: l.indices,
            originX: 'left',
            originY: 'top'
        });
        canvas.add(cir);
        currLights.push(cir);
    }
}

function moveSlider() {
    if (canvas.getActiveObject()) {
        var object = canvas.getActiveObject();
        var isRoom = object.isType("rect");
        if (isRoom) {
            if (mode != 1) {
                canvas.remove(object);
            }
            if (mode === 0) {
                object.set({ temp: slider.value });
            } else if (mode == 2) {
                object.set({ vol: slider.value });
            }
            if (mode != 1) {
                setColor(object);
                canvas.add(object);
                canvas.setActiveObject(object);
            }
        } else {
            if (mode == 1) {
                var room = floors[floor.selectedIndex][object.indices.roomIndex];
                var l = room.lights[object.indices.lightIndex];
                l.brightness = slider.value;
                l.color = rgbToHex(parseInt(document.getElementById("r").value, 10),
                                     parseInt(document.getElementById("g").value, 10),
                                     parseInt(document.getElementById("b").value, 10));
                canvas.remove(currLights[object.indices.currLightIndex]);
                currLights[object.indices.currLightIndex].set({
                    strokeWidth: l.brightness/100*l.radius,
                    stroke: l.color
                });
                canvas.add(currLights[object.indices.currLightIndex]);
                canvas.setActiveObject(object);
            }
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