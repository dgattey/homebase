# Homebase
A smart home utility powered by LEAP, offering a gesture-based interface for a hypothetical smarthome system. See a demo at http://labs.dylangattey.com/homebase.

## Our Vision
In the future, everyone will have smart appliances and homes that are wired together. There will be tons of different ways to interact with information and devices around you, necessitating a new method of consolidating it into a coherent interface. We envision a singular augmented reality wearable system, in the form of always-on glasses/implants/contact lenses, running this interface. We wrote three demo apps for this project, but we envision many different apps for controlling every aspect of your home. You'll walk around your home, interacting with the wearable using your hands in front of you to gesture. Currently, a Leap Motion is a standin for this sort of interaction. The same gestures could certainly be part of any future system. 

### Our App
In Homebase, you see the floorplan of your house on initial load. The background would probably be a view of whatever's around you since the AR would overlay the system on your surroundings, but currently it's white. You can change options in any individual room by selecting it, pulling up a detail view. You can change floors via the top-right menu, and change apps (modes) via the top-left menu. They sit at the corner of the screen to get out of the way of the content, but allow convenient gesture based interaction.

Our main drive was simplicity and learnability. With a gesture based interface, it's hard to show off all the possible gestures to a user, especially when there are many nuanced ways to interact. We gave hints where necessary, like pinching to pause and play the song, but most of it is designed to be understood quickly. The point to select is a natural interaction method, especially with the hovering translucent dot for where your index finger is pointing, and a red dot for when you're selecting something. The dot gets smaller as you push into the screen, a nice usability hint. Moving your hand up and down is a natural way of scaling/changing on a linear scale, so that gesture is also rather learnable. Closing your hand into a fist and pushing into one of the top corners will trigger a menu to appear, and then you turn the inside of your palm toward the option you'd like to select. Once done, putting your hand into a fist and returning from the corner will close the menu.

We had so much fun designing interactions like the menus in a way that was easy to learn. It was difficult to take continuous movement and gestures and turn them into discrete states, without using a mouse. We iterated over many different ways to control the menus, from velocity and palm directions, to strange contortions and ranges of the screen. Testing them out, it was too hard to be accurate with speed and direction both, so we created a gesture to show the menu (fist into corner), an interaction in that state (palm normal to option you want), and a gesture to close the menu (fist away from corner). It was easy to test, but complicated to code a usable, simple interaction.

In Homebase, there are currently three apps, as follows

#### Climate
Control the temperature by selecting a room, then moving your hand up and down in the y-plane to change the temperature. Deep blue is a chilly 55 degrees, whereas the bright red is a sweat-inducing 85. Temp can be controlled on a per-room basis, but by default all rooms are 72 degrees.

#### Music
Currently, you can play just one song throughout the house, controlled by Spotify previews. We didn't go through the hassle of obtaining a developer key and creating an entire application for use with their SDK because of how much of a pain that is, but we show that this integration is entirely possible. You can set volume on a per-room basis, with the same up and down gesture, and hear that feedback. You can also pinch your thumb and forefinger together and poke into the screen to play or pause. In the future, we would add the ability to set songs on a per-room basis, or at least to see what was playing in each room. The Spotify integration shows that we could play music on a real device like Sonos or external speakers in the future, assuming we had a compatible system in our home.

#### Lighting
Each room has some lights in it that can be controlled by utilizing the same up and down gesture to change brightness. You can also move your other hand in 3D space to change the color of the light. In the future, we'd add the ability to change things on a per-light basis, adding functionality to blend the colors in the room for a nice rainbow effect. This kind of lighting is already possible (though expensive) with Phillips Hue or a similar kind of lighting system, but there's not a great app to control that yet.

Overall, the app worked out pretty well. Ran into some snags, but it fulfilled our goals of creating a simple, solid interface that could control many aspects of a smart home with easy gestures. In the future, we would work on an interface to customize floor plans, deeper integration with music and smart lights, and more indications of data (like text for temperature and album art thumbnails for music). 

## Development

### Architecture of App
We're using pure Javscript in a Node.js environment, with Gulp for continuous development. Bower is used for package management, and Gulp automatically compiles all our code into the build folder when run. We're also using the Fabric.js library for easier manipulation of canvas objects, and a bower package for integration with Spotify. We wrote SCSS that compiles down into pure CSS.

### Getting Started
1. Make sure you have npm (if you don't, you can install on Mac with Homebrew)
2. Install Bower globally with 'npm install -g bower'
3. Install Gulp globally with 'npm install -g gulp'
4. Install all Node dependencies with 'npm install' from inside the main directory. Will take awhile.
5. Install all Bower dependencies with 'bower install' from inside the main directory.
6. Start gulp for continuous development with 'gulp'

### Running App
No need to refresh the page! Make a change to any files and Gulp will recompile that file and reload the page for you automatically. Gulp runs a server on port 8888 on localhost. There's a gulpfile.js and build.config.js file that both control how Gulp does its thing. Any changes to those and you'll have to restart Gulp. All code is in src/. We're using SASS for easier CSS rules, and Fabric for easier canvas element manipulation.
