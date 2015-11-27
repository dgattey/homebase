var cats = {};

/*
 * THE EVENT LOOP - runs on each frame
 */
Leap.loop(function(frame) {
    // Creates a cat for each hand and positions them
    for (var i = 1; i >= 0; i--) {
        var hand = frame.hands[i];
        if (!hand && cats[i]) {
            cats[i].delete();
            cats[i] = undefined;
            continue;
        } else if (hand) {
            var cat = cats[i] || (cats[i] = new Cat());
            cat.setTransform(hand.screenPosition(), hand.roll());
        }
    }
}).use('screenPosition', {scale: 0.25});

// Sets up Leap options
Leap.loopController.setBackground(true);

// Constructor for a cat
var Cat = function() {
    var cat = this;
    var img = document.createElement('img');
    img.src = 'assets/cat.png';
    img.style.position = 'absolute';
    img.onload = function () {
        cat.setTransform([window.innerWidth/2,window.innerHeight/2], 0);
        document.body.appendChild(img);
    };

    cat.delete = function() {
        document.body.removeChild(img);
    };

    cat.setTransform = function(position, rotation) {
        img.style.left = position[0] - img.width  / 2 + 'px';
        img.style.top  = position[1] - img.height / 2 + 'px';
        img.style.transform = 'rotate(' + -rotation + 'rad)';
        img.style.webkitTransform = img.style.MozTransform = img.style.msTransform =
        img.style.OTransform = img.style.transform;
    };
};