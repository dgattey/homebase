/*
* THE EVENT LOOP - runs on each frame
*/
// Leap.loop(function(frame) {
//     // Creates a cat for each hand and positions them
//     for (var i = 1; i >= 0; i--) {
//         var hand = frame.hands[i];
//         if (!hand && cats[i]) {
//             cats[i].delete();
//             cats[i] = undefined;
//             continue;
//         } else if (hand) {
//             var cat = cats[i] || (cats[i] = new Cat());
//             cat.setTransform(hand.screenPosition(), hand.roll());
//         }
//     }
// }).use('screenPosition', {scale: 0.25});

// // Sets up Leap options
// Leap.loopController.setBackground(true);


var mode = 0;
var currLights = [];

// For the top left menu
document.toggleAppMenu = function() {
    var toggleClass = "toggle-app-menu";
    var optionsClasses = document.getElementById("options").classList;
    if (optionsClasses.contains(toggleClass)) {
        optionsClasses.remove(toggleClass);
    } else {
        optionsClasses.add(toggleClass);
    }
};

var canvas = new fabric.Canvas('c', {
    selection: false
});

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
var floors = [
[new fabric.Rect({
    width: 180,
    height: 100,
    left: 200,
    top: 25,
    fill: rgbToHex(100, 100, 100),
    originX: 'left',
    originY: 'top',
    lights: [{ radius: 10, fracX: 0.5, fracY: 0.5 }],
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
    lights: [{ radius: 10, fracX: 0.5, fracY: 0.5 }],
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
    lights: [{ radius: 10, fracX: 0.5, fracY: 0.5 }],
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
    originY: 'top'
}),
new fabric.Rect({
    width: 125,
    height: 100,
    left: 275,
    top: 75,
    fill: rgbToHex(100, 100, 100),
    originX: 'left',
    originY: 'top',
    lights: [{ radius: 10, fracX: 0.5, fracY: 0.5 }]
}),
new fabric.Rect({
    width: 250,
    height: 50,
    left: 150,
    top: 180,
    fill: rgbToHex(100, 100, 100),
    originX: 'left',
    originY: 'top'
}),
new fabric.Rect({
    width: 250,
    height: 100,
    left: 175,
    top: 235,
    fill: rgbToHex(100, 100, 100),
    originX: 'left',
    originY: 'top'
})
]
];

document.changeMode = function(index) {
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
            addLights(r);
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
            addLights(floors[floor.selectedIndex][room]);
        }
    }
    prevFloor = floor.selectedIndex;
});

var bigRoom;
var color = rgbToHex(108, 108, 108);
var roomColors = [color, color, color, color, color];

canvas.on('object:selected', function(options) {
    var currColor;
    var room;
    if (options.target == bigRoom){
        return;
    }
    if (bigRoom !== null){
        for (room = 0; room < floors[floor.selectedIndex].length; room++) {
            floors[floor.selectedIndex][room].set({
                fill: roomColors[room]
            });
        }
        canvas.remove(bigRoom);
        bigRoom = null;
    }

    for (room = 0; room < floors[floor.selectedIndex].length; room++) {
        roomColors[room] = floors[floor.selectedIndex][room].fill;
        if (floors[floor.selectedIndex][room] == options.target){
            currColor = roomColors[room];
        }
        floors[floor.selectedIndex][room].set({
            fill: rgbToHex(108, 108, 108)
        });
    }
    var width;
    var height;
    var widthIfHeightLarger = options.target.getWidth() * (175 / options.target.getHeight());
    if (widthIfHeightLarger < 250){
        width = widthIfHeightLarger;
        height = 175;
    }else{
        width = 250;
        height = options.target.height * (250 / options.target.width);
    }

    bigRoom = new fabric.Rect({
        width: width,
        height: height,
        left: 250-width/2,
        top: 175-height/2,
        fill: currColor,
        originX: 'left',
        originY: 'top',
        lights: [{ radius: 10, fracX: 0.5, fracY: 0.5 }],
        lockMovementX: true,
        lockMovementY: true
    });

    canvas.add(bigRoom);
    bigRoom.bringToFront();
});

canvas.on('selection:cleared', function(options) {
    for (var room = 0; room < floors[floor.selectedIndex].length; room++) {
        floors[floor.selectedIndex][room].set({
            fill: roomColors[room]
        });
    }
    canvas.remove(bigRoom);
    bigRoom = null;
});

// Moving slider (input is not supported in IE10 so need to also do change)
slider.addEventListener("input", moveSlider);
slider.addEventListener("change", moveSlider);

function addLights(r) {
    for (var light = 0; light < r.lights.length; light++) {
        var l = r.lights[light];
        if (!l.brightness) l.brightness = 0;
        if (!l.color) l.color = rgbToHex(255, 255, 255);
        var cir = new fabric.Circle({
            radius: l.radius,
            left: r.left + r.width*l.fracX - l.radius,
            top: r.top + r.height*l.fracY - l.radius,
            fill: rgbToHex(100, 100, 100),
            strokeWidth: l.brightness/100*l.radius,
            stroke: l.color,
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
        var isRoom = object.strokeWidth !== 0;
        console.log(isRoom);
        canvas.remove(object);
        if (isRoom) {
            if (mode === 0) {
                object.set({ temp: slider.value });
            } else if (mode == 2) {
                object.set({ vol: slider.value });
            }
            setColor(object);
        } else {
            if (mode == 1) {
// need to update light in actual room
// object.set({ strokeWidth: l.brightness/100*l.radius });
}
}
canvas.add(object);
canvas.setActiveObject(object);
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
