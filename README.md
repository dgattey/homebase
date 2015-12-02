# Homebase
A smart home utility powered by LEAP

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

### TODO
FOR END OF DAY WEDNESDAY:
  Have JSFiddle version completed (at least visually) for use in slides
  Dylan: menu interface and menu page creation 
  Sam: Lighting interface
  Colby: Zoom into room
  Wes: Putting Buttons on Canvas - mood buttons and song icon
  Alex: Start slides/Reddit/Presentation

Coding Stuff
- menu interface creation
- menu creation for each page
- room zoom with click
- intensity dial
- detail page for each app
- temperature timeline
- Spotify integration
- song change
- pause/play
- mood scroll selection
- individual light selection
- intensity/color sliders for lights
- gesture based commands

Finishing Stuff
- Make slides
- Make and practice a presentation (150 seconds exactly)
- Link to comments about work after Reddit post
- host (Dylan)

Maybe Later
- multiple room selection
