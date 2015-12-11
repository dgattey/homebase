# Homebase
A smart home utility powered by LEAP, offering a gesture-based interface for a future smarthome system.

### Architecture of App
We're using pure Javscript in a Node.js environment, with Gulp for continuous development. Bower is used for package management, and Gulp automatically compiles all our code into the build folder when run. We're also using the Fabric.js library for easier manipulation of canvas objects, and a bower package for integration with Spotify. We wrote SCSS that compiles down into pure CSS.

### Getting Started with Development
1. Make sure you have npm (if you don't, you can install on Mac with Homebrew)
2. Install Bower globally with 'npm install -g bower'
3. Install Gulp globally with 'npm install -g gulp'
4. Install all Node dependencies with 'npm install' from inside the main directory. Will take awhile.
5. Install all Bower dependencies with 'bower install' from inside the main directory.
6. Start gulp for continuous development with 'gulp'

#### Running App
No need to refresh the page! Make a change to any files and Gulp will recompile that file and reload the page for you automatically. Gulp runs a server on port 8888 on localhost. There's a gulpfile.js and build.config.js file that both control how Gulp does its thing. Any changes to those and you'll have to restart Gulp. All code is in src/. We're using SASS for easier CSS rules, and Fabric for easier canvas element manipulation.
