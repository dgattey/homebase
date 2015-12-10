# Homebase
A smart home utility powered by LEAP

Homebase is a unification of smart home appliances.
Languages:
JS, CSS

Libraries:
fabricJS
Bower package for Spotify Web API


### Architecture of App
We're using a Node.js environment, with Google's Polymer as a frontend library and Gulp for continuous development. Bower is used for package management, and Gulp automatically compiles all our code into the build folder when run.

### Getting Started
1. Make sure you have npm (if you don't, you can install on Mac with Homebrew)
2. Install Bower globally with 'npm install -g bower'
3. Install Gulp globally with 'npm install -g gulp'
4. Install all Node dependencies with 'npm install' from inside the main directory. Will take awhile.
5. Install all Bower dependencies with 'bower install' from inside the main directory.
6. Start gulp for continuous development with 'gulp'

### Development
No need to refresh the page! Make a change to any files and Gulp will recompile that file and reload the page for you automatically. Gulp runs a server on port 8888 on localhost. There's a gulpfile.js and build.config.js file that both control how Gulp does its thing. Any changes to those and you'll have to restart Gulp. Shouldn't need to change it too often though. All code is in src/. We're using SASS for easier CSS rules, and Google's Polymer for easier JS/HTML coding.

### Script for Presentation
Colby:

HOMEBASE: A gesture-based smarthome system for AR

We tried to combine a futuristic AR glasses concept like Google Glass with smart home appliances like nest and Phillips Hue.
Our idea is that you would be able to bring up a tranculent floorplan whenever you want and easily adjust appliances in your house
using simple gestures.  Right now, homebase supports changing temperature, modifying lighting, and adjusting music on a per room basis.

Sam:

So our app is based on the hope that in the future we'll all have AR glasses and we'll all have tons of smart home appliances.  In that world,
you shouldn't have to stand up to turn off the lights or be at home to turn off appliances.  There are tons of possibilities for other use
cases.  For example, using future versions of Homebase, you could be able to look at a TV and have floating controls pop up around it that
only you can see.

Wes:

Here's our high fidelity mockup of our application, detailing everything one can achieve using homebase. 

The central part of the interface is the floorplan, which will be built by users on an interactive web interface that sends the final plans to your system.

Take notice of the three modes of use:
climate, lighting, and music.

You can select individual rooms, and modify the temperature, intensity of a light, or volume of the music, depending on mode.


Alex:

We posted this on various subreddits about a week ago, and received pretty nice feedback, mainly from a guy who works at Leap Motion.

This one guy, tapzoid, got pretty upset, and there was a heated conversation in which leapmotion_alex fought for the validity of our app!

We ended up getting rid of the preset lighting options in favor of simply modifying light values.


Dylan:

Demo!
