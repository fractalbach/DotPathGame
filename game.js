


var getRandomInt = function (min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
};
// =========================================================================
//  Define Global Variables
// -------------------------------------------------------------------------

var svg = document.getElementsByTagName('svg')[0];


var numberOfPointsX = 5;
var numberOfPointsY = 5;

var width = 1000;
var height = 1000;

var factorX = (width) / (numberOfPointsX + 1);
var factorY = (height-50) / (numberOfPointsY + 1);
var dotRadius = (factorX + factorY)/6;

// If victory is true, you do the "victory dance" and display special stuff.
var victory;

// Scoreboard
var swapCounter = 0;
var bridgeCounter = getRandomInt(numberOfPointsX-2, numberOfPointsX+2);

// set of all saved Bridges that are currently on the board.
var savedBridgesForward = new Set();
var savedBridgesBackward = new Set();

// Special Color Definitions, so there is no ambiguity.
var MY_RED = '#F00';
var MY_BLUE = '#07F';

// display debug text information (shows dot and bridge values)
var DEBUG_SHOW_DOT_TEXT = false;
var DEBUG_SHOW_LINE_TEXT = false;




var restartGame = function() {

    // Reset victory value, and stop doing the victory dance.
    if (victory) {undoVictoryDance();}
    victory = false;

    // Reset the Scoreboard
    swapCounter = 0;
    bridgeCounter = getRandomInt(numberOfPointsX-2, numberOfPointsX+2);

    // Update the scoreboard so they display the new values
    updateBridgeCounter();
    updateSwapCounter();

    // Reset the saved bridge sets.
    savedBridgesForward = new Set();
    savedBridgesBackward = new Set();

    // Resets the grid arrays to empty values
    grid           = buildGrid(numberOfPointsX,   numberOfPointsY);
    horizontalGrid = buildGrid(numberOfPointsX-1, numberOfPointsY);
    verticalGrid   = buildGrid(numberOfPointsX,   numberOfPointsY-1);
    forwardDiagonalGrid =  buildGrid(numberOfPointsX-1,   numberOfPointsY-1);
    backwardDiagonalGrid = buildGrid(numberOfPointsX-1,   numberOfPointsY-1);

    // give random values to all of the points
    randomizeAllPointColors();

    // re-initializes the diagonals with values of "false"
    initializeFalseGrid(forwardDiagonalGrid);
    initializeFalseGrid(backwardDiagonalGrid);

    // Colors all of the points and  lines based on their stored grid values.
    colorAllPoints();
    colorAllDiagonals();
    colorAllLines();
};








// +=============+=============================================================
// |    Logic    |  Function - Converting Points into Pure Numbers
// +-------------+-------------------------------------------------------------

// A function that takes a 1-dimensional value and converts it into
// the 2-dimensional grid location.  Requires a grid size to already exist.
// Returns a Point(A,B) object.
// @param {Number} input = the numeric value that will turn into a point.

var valueToPoint = function (input) {
    var B = (input) % (numberOfPointsY);
    var A = (input - B) / numberOfPointsY;
    return ([A, B]);
};

var pointToValue = function (A, B) {
    return (A * numberOfPointsY + B);
};


// interchanging values and bridges uses the same logic, but has different
// numbers, since bridge grid's 1 less column and 1 less row

var valueToBridge = function (input) {
    var B = (input) % (numberOfPointsY-1);
    var A = (input - B) / (numberOfPointsY-1);
    return ([A, B]);
};

var bridgeToValue = function (A, B) {
    return (A * (numberOfPointsY-1) + B);
};









// +=============+=============================================================
// |    Logic    |  Grid  - Initializing Grid Functions
// +-------------+-------------------------------------------------------------

// Returns 2-dimensional Array[][] object.  (A x B matrix.)
// @param {Number} A = 1st dimension. -> Array[A]
// @param {Number} B = 2nd dimension. -> Array[_][B]

var buildGrid = function (A, B) {
    var aGrid = new Array(A);
    for (var i = A - 1; i >= 0; i--) {aGrid[i] = new Array(B);}
    return aGrid;
};

// The values within grid[][] correspond to the coloring of the dots.
// The horizontal, vertical, and slashed grids represent values for lines

var grid           = buildGrid(numberOfPointsX,   numberOfPointsY);
var horizontalGrid = buildGrid(numberOfPointsX-1, numberOfPointsY);
var verticalGrid   = buildGrid(numberOfPointsX,   numberOfPointsY-1);

var forwardDiagonalGrid =  buildGrid(numberOfPointsX-1,   numberOfPointsY-1);
var backwardDiagonalGrid = buildGrid(numberOfPointsX-1,   numberOfPointsY-1);

// Assign Random Booleans to each value in the grid[][]
// These will correspond with color values held by each of the points.
//      true -> BLUE
//      false -> RED

var randomizeAllPointColors = function () {
    for (var i = numberOfPointsX - 1; i >= 0; i--) {
        for (var j = numberOfPointsY - 1; j >= 0; j--) {
            var rand = Math.random();
            if (rand >= 0.5)    {grid[i][j] = true;}  // blue
            if (rand < 0.5)     {grid[i][j] = false;} // red
        }
    }
};


// The Diagonal Grids start with false values, to indicate they aren't used.

var initializeFalseGrid = function (gridName) {
    for (var i = gridName.length - 1; i >= 0; i--) {
        for (var j = gridName[i].length - 1; j >= 0; j--) {
            gridName[i][j] = false;
        }
    }
};

randomizeAllPointColors();
initializeFalseGrid(forwardDiagonalGrid);
initializeFalseGrid(backwardDiagonalGrid);




// +==============+==========================================================
// |    Logic     |  Lines - Determining Line colors based on grid[][]
// +-------------+-----------------------------------------------------------


// Compares the boolean values of 2 values in the grid.
//  if they are different, then return a default line.
//  If they are the same, look at which color they are, and return that.
//      0 -> Default Line (there is no connection here)
//      1 -> BLUE line.
//      2 -> RED line.
// The Parameters are based on the format "line_(i,j)_(p,q)"
// @param {Number}  i = the x-position of 1st point.
// @param {Number}  j = the y-position of 1st point.
// @param {Number}  p = the x-position of 2nd point.
// @param {Number}  q = the y-position of 2nd point.

var comparePointsForLineValue = function (i,j, p,q) {
    var A = grid[i][j];
    if (A !== grid[p][q])   {return 0;}
    if (A)                  {return 1;}
    else                    {return 2;}
};


// 

// Check a specific range points, and determine the colorings of the lines.
//      Applies to both Horizontal and Vertical Lines.
// @param {Number}  xF = the x-position of 1st point to check.
// @param {Number}  x0 = the x-position of LAST point to check.
// @param {Number}  yF = the y-position of 1st point to check.
// @param {Number}  y0 = the y-position of LAST point to check.

var updateValuesForTheseHorizontalLines = function (xF, x0, yF, y0) {
    for (var i = xF; i >= x0; i--) { for (var j = yF; j >= y0; j--) {
        horizontalGrid[i][j] = comparePointsForLineValue(i,j, i+1,j);
    }}
};
var updateValuesForTheseVerticalLines = function (xF, x0, yF, y0) {
    for (var i = xF; i >= x0; i--) {for (var j = yF; j >= y0; j--) {
        verticalGrid[i][j] = comparePointsForLineValue(i,j, i,j+1);
    }}
};


// Even though the diagonal lines are not always availiable, 
//      their coloring (or potential coloring) is independent of rendering.
// Unlike the horizontal and vertical lines, these diagonal grids can also
//      have a value of "false" when not in use.  If that is the case, then
//      don't color those specific bridges.

var updateValuesForTheseForwardDiagonals = function (xF, x0, yF, y0) {
    for (var i = xF; i >= x0; i--) { for (var j = yF; j >= y0; j--) {
        if (forwardDiagonalGrid[i][j] !== false) {
            forwardDiagonalGrid[i][j] = comparePointsForLineValue
                (i,j+1, i+1,j);
        }
    }}
};

var updateValuesForTheseBackwardDiagonals = function (xF, x0, yF, y0) {
    for (var i = xF; i >= x0; i--) { for (var j = yF; j >= y0; j--) {
        if (backwardDiagonalGrid[i][j] !== false) {
            backwardDiagonalGrid[i][j] = comparePointsForLineValue
                (i,j, i+1,j+1);
        }
    }}
};



// +==============+==========================================================
// |    Logic     |  Functions for Nearby Points
// +--------------+----------------------------------------------------------


// Returns up to 4 points in the main cardinal directions (N, S, E, W).
//      Points are only returned if they exist on the grid itself.
// @param {Number|Array}  input = either a POINT VALUE or a point [A,B]

var getAdjacentPoints = function (input) {
    if (typeof input === 'number') {input = valueToPoint(input);}
    var A = input[0];
    var B = input[1];
    var adj = [];
    if (A < (numberOfPointsX-1)) {adj.push(pointToValue(A+1, B));}
    if (A > 0)                   {adj.push(pointToValue(A-1, B));}
    if (B < (numberOfPointsY-1)) {adj.push(pointToValue(A, B+1));}
    if (B > 0)                   {adj.push(pointToValue(A, B-1));}
    return adj;
};


// Returns up to 4 points in the diagonal directions (NE, NW, SE, SW).
//      Points are only returned if they exist on the grid itself.
// @param {Number|Array}  input = either a POINT VALUE or a point [A,B]

var getDiagonalPoints = function (input) {
    if (typeof input === 'number') {input = valueToPoint(input);}
    var A = input[0]; 
    var B = input[1];
    var dia = [];
    if ((A < (numberOfPointsX-1) ) & (B > 0 )) {                 //North-East
        dia.push(pointToValue(A+1, B-1));
    }
    if ((A > 0 ) & (B > 0 )) {                                   //North-West
        dia.push(pointToValue(A-1, B-1));
    }
    if ((A < (numberOfPointsX-1)) & (B < (numberOfPointsY-1))) { //South-East
        dia.push(pointToValue(A+1, B+1)); 
    }
    if ((A > 0 ) & (B < (numberOfPointsY-1))) {                  //South-West
        dia.push(pointToValue(A-1, B+1));
    }
    return dia;
};


// Returns all 8 points in cardinal and diagonal directions in Value form.
// @param {Number|Array}  input = either a POINT VALUE or a point [A,B]

var getNearbyPoints = function(input) {
    return getAdjacentPoints(input).concat(getDiagonalPoints(input));
};




// +==============+==========================================================
// |    Logic     |  Functions for Nearby BRIDGES
// +--------------+----------------------------------------------------------


// retrieving the values of diagonal bridges depends on its relationship to
// the highlighted point.  There will be 2 forward diagonals, and 2 backward.
//      Returns BRIDGE VALUES. 
//      in the form of:  [[forward diagonals], [backwards diagonals]]
//      forward diagonals are: South-west and North-east.
//      backwards diagonals: North-west and South-east.


var getDiagonalBridges = function (input) {
    if (typeof input === 'number') {input = valueToPoint(input);}
    var A = input[0];
    var B = input[1];
    var forward = []; var backward = [];

    if ((A > 0 ) & (B < (numberOfPointsY-1))) {                  //South-West
        forward.push(bridgeToValue(A-1, B));
    } else {forward.push(false);}

    if ((A < (numberOfPointsX-1) ) & (B > 0 )) {                 //North-East
        forward.push(bridgeToValue(A, B-1));
    } else {forward.push(false);}

    if ((A > 0 ) & (B > 0 )) {                                   //North-West
        backward.push(bridgeToValue(A-1, B-1));
    } else {backward.push(false);}

    if ((A < (numberOfPointsX-1)) & (B < (numberOfPointsY-1))) { //South-East
        backward.push(bridgeToValue(A, B)); 
    } else {backward.push(false);}

    return [forward, backward];
};


// Slash is either 'forward' or 'backward'

var toggleBridge = function (slash, point) {
    if (typeof point === 'number') {point = valueToPoint(point);}
    if (slash === 'foward') {
        if (forwardDiagonalGrid[(point[0])][(point[1])] === false) {
            forwardDiagonalGrid[(point[0])][(point[1])] = 0;
        } else {
            forwardDiagonalGrid[(point[0])][(point[1])] = false;
        }       
    }
    if (slash === 'backward') {
        if (backwardDiagonalGrid[(point[0])][(point[1])] === false) {
            backwardDiagonalGrid[(point[0])][(point[1])] = 0;
        } else {
            backwardDiagonalGrid[(point[0])][(point[1])] = false;
        }        
    }
};









// +==============+==========================================================
// |    Logic     |  Check for VICTORY !
// +--------------+----------------------------------------------------------

// 1. Do a sweep to look for solo points -> end if you find any
// 2. Do Chain search
// 3.

var doPreliminarySearch = function () {
    for (var i = 0; i < (numberOfPointsX * numberOfPointsX); i++) {
    }  
};

// The string is either F or B, which correspond to forward or backward.
// Returns the 2 points that are connected by the bridge.
var get2LinkedPoints = function (string, bridgeValue) {
    var L = valueToBridge(bridgeValue);
    if (string === 'F') {
        return [pointToValue(L[0], L[1]+1), pointToValue(L[0]+1, L[1])];
    }
    if (string === 'B') {
        return [pointToValue(L[0], L[1]), pointToValue(L[0]+1, L[1]+1)];
    }
};
var checkThisLink = function (nodelist, index) {
    if (typeof index !== 'number') {return false;}
    var classval = nodelist[index].getAttribute('class');
    if ( (classval === 'redLine') || (classval === 'blueLine') ) {
        return true;
    } else {
        return false;
    }
};
var checkPointForDiagonalLinks = function (A,B) {
    var P = pointToValue(A,B);
    var Q;
    var Z = getDiagonalBridges([A,B]);
    var linked = [];
    var maybe;

    Q = svg.getElementById('ForwardCrossedLines').childNodes;
    if (checkThisLink(Q, Z[0][0])) {
        maybe = get2LinkedPoints('F', Z[0][0]);
        if (maybe[0] !== P) {linked.push(maybe[0]);}
        if (maybe[1] !== P) {linked.push(maybe[1]);}
    }
    if (checkThisLink(Q, Z[0][1])) {
        maybe = get2LinkedPoints('F', Z[0][1]);
        if (maybe[0] !== P) {linked.push(maybe[0]);}
        if (maybe[1] !== P) {linked.push(maybe[1]);}
    }
    Q = svg.getElementById('BackwardCrossedLines').childNodes;
    if (checkThisLink(Q, Z[1][0])) {
        maybe = get2LinkedPoints('B', Z[1][0]);
        if (maybe[0] !== P) {linked.push(maybe[0]);}
        if (maybe[1] !== P) {linked.push(maybe[1]);}
    }
    if (checkThisLink(Q, Z[1][1])) {
        maybe = get2LinkedPoints('B', Z[1][1]);
        if (maybe[0] !== P) {linked.push(maybe[0]);}
        if (maybe[1] !== P) {linked.push(maybe[1]);}
    }
    return linked;
};



areTheseSetsEqual = function (set1, set2) {
    // To prove that two set are equal to each other, 
    // every element of each set must be in the other set.
    ar1 = Array.from(set1);
    ar2 = Array.from(set2);
    if (ar1.length !== ar2.length) {
        return false;
    }
    for (var i = ar2.length - 1; i >= 0; i--) {
        if (!(ar1.includes(ar2[i]))) {
            return false;
        }
    }
    for (var k = ar2.length - 1; k >= 0; k--) {
        if (!(ar2.includes(ar1[k]))) {
            return false;
        }   
    }
    return true;
};



// remember that chain colors BLUE= true..... and RED = false.. in the grid.
var Chain = function (chainColor) {
    this.knownLinks = new Set();
    this.discoveredLinks = new Set();
    this.nextToCheck = [];
    this.chainColor = chainColor;
};

Chain.prototype.findFirstLink = function () {
    // Looks through the grid until it finds a Point of the specified color.
    // if found, return that Point, otherwise return false.

    for (var i = grid.length - 1; i >= 0; i--) {
        for (var j = grid[i].length - 1; j >= 0; j--) {
            if (grid[i][j] === this.chainColor) {
                // println("First link = " + grid[i][j]);
                this.knownLinks.add(pointToValue(i,j));
                return pointToValue(i,j);
            } 
        }
    }
    // println("There are no points of this color AT ALL.");
    return false;
};

Chain.prototype.findPotentialLinks = function () { 
    // findPotentialLinks takes Points out of the nextToCheck array,
    // for each nextToCheck Point,
    //  1. Checks if that Point is of the same color as the Chain's Color.
    //  2. Add the adjacent Points to the set of discoveredLinks.

    for (var i = this.nextToCheck.length - 1; i >= 0; i--) {

        var nextPoint = this.nextToCheck.pop();
        // println('checking... ('+ nextPoint.A + ',' + nextPoint.B + ')');

        var adjPoints = getAdjacentPoints(nextPoint);
        
        for (var k = adjPoints.length - 1; k >= 0; k--) {
            var P = valueToPoint(adjPoints[k]);
            var A = P[0]; var B = P[1];
            if (grid[A][B] === this.chainColor) {
                this.discoveredLinks.add(adjPoints[k]);
            }
        }
        var p = valueToPoint(nextPoint);
        var Z = checkPointForDiagonalLinks(p[0], p[1]);
        for (var j = Z.length - 1; j >= 0; j--) {
               this.discoveredLinks.add(Z[j]);
        }
    }
};

Chain.prototype.checkDiscoveredLinks = function() {
    // checkDiscoveredLinks basically just moves data around.
    //  1. Adds points we HAVE NOT SEEN BEFORE into list we WILL check later.
    //  2. Adds set of discovered points into the main set of KnownLinks.
    var Q =  Array.from(this.discoveredLinks);
    var Z = Array.from(this.knownLinks);
    for (var i = Q.length - 1; i >= 0; i--) {
        var nextElement = Q[i];
        if (!(Z.includes(nextElement))) {
            this.nextToCheck.push(nextElement);
        }
    }
    for (var j = Q.length - 1; j >= 0; j--) {
        this.knownLinks.add(Q[j]);
    }
    this.discoveredLinks.clear();
};

Chain.prototype.formChain = function () {
    // formChain ties everything together to form SET of connected Points.
    //   LOOP:  1. Find some new Links.
    //          2. check to see if we've already found those links.
    //          3. Leave if there are no more unique links to find.

    var tracerCount = 0;
    var firstPoint = this.findFirstLink();
    this.nextToCheck.push(firstPoint);

    while (this.nextToCheck.length !== 0) {
        this.findPotentialLinks();
        this.checkDiscoveredLinks();
        tracerCount++;
    }

    // console.log('Iterations: ' + tracerCount);
   
    return this.knownLinks;
};


var findAllPointsOfColor = function(myColor) {
    // Looks through the whole grid and finds all points of choosen color.
    // @param myColor is the choosen color we want to check.
    // returns ARRAY

    var stuff = new Set();
    for (var i = grid.length - 1; i >= 0; i--) {
        for (var j = grid[i].length - 1; j >= 0; j--) {
            if (myColor === grid[i][j]) {
                stuff.add( pointToValue(i, j) );
            }
        }
    }
    return stuff;
};


var areAllChainsCompleted = function(AllReds, AllBlues) {
    //areAllChainsCompleted() returns true if all same-color points are linked

    AllReds = findAllPointsOfColor(false);
    var RedChain = new Chain(false);
    RedChain.formChain();

  
    // if the Red chain doesn't have every red point, then stop here.  
    // There's no need to check blue.  We know the game isn't finished yet. 
    if (areTheseSetsEqual(RedChain.knownLinks, AllReds) !== true) 
        { return false; }
    // We know the red points are linked together; what about blue ones?     
    
    AllBlues = findAllPointsOfColor(true);
    var BlueChain = new Chain(true);
    BlueChain.formChain();
    if (!areTheseSetsEqual(BlueChain.knownLinks, AllBlues)) { return false; }
    // If you've managed to make it this far, you win!
    return true;
};


var victoryDance = function () {
    changeText('text_title', "You Win!!");
    svg.getElementById('text_title').setAttribute('style',
        'text-anchor:middle; fill: #AFA;');
    svg.getElementById('backgroundRectangle').setAttribute('class','victory');
};

var undoVictoryDance = function () {
    changeText('text_title', "The Dot Path Game");
    svg.getElementById('text_title').setAttribute('style',
        'text-anchor:middle; fill: #FFF;');
    svg.getElementById('backgroundRectangle').setAttribute('class','none');
};



var checkForVictory = function() {
    // checkForVictory calls upon external definitions of victory.
    // if the game is victorious, then do a victory Dance!

    victory = areAllChainsCompleted();
    if (victory) { victoryDance(); }
    return victory;
};














// +=========+=============+=================================================
// |   SVG   |  Functions  |    Interactions with the SVG element.
// +---------+-------------+--------------------------------------------------
   


// Creates a new element placed BEFORE another element
// @param {String}  element - is the tag name. 
// @param {String}  id - the new element will be placed before this one.
// @param {Array}   options - has key-value pairs [[property1, value1], ...] 

var make = function (element, path, options) {
    var newElement = document.createElementNS(
        "http://www.w3.org/2000/svg", element);
    
    for (var i = options.length - 1; i >= 0; i--) { 
        newElement.setAttribute(options[i][0], options[i][1]); 
    }

    return svg.getElementById(path).appendChild(newElement);
};


// Adds or Modifies an attribute of an identified element.
// @param {String} id - unique identifier
// @param {String} property - name of the attribute (example: width)
// @param {String|Number}  value - of the property

var change = function (id, property, value) {
    return document.getElementById(id).setAttribute(property, value);
};


// Special Functions for creating  ID strings
// Used when making or changing elements.

var myDot = function (i,j) {return ('myDot_' + i + "_" + j);};

var forwardDiagonal = function (A,B) {
    var out = "forwardDiagonal("+A+","+B+")"; return out;};

var backwardDiagonal = function (A,B) {
    var out = "backwardDiagonal("+A+","+B+")"; return out;};

var changeDiagonal = function (FB, index, attribute, value) {
    switch(FB) {
        case 'F': svg.getElementById('ForwardCrossedLines').childNodes[index].setAttribute(attribute, value);
            break;

        case 'B': svg.getElementById('BackwardCrossedLines').childNodes[index].setAttribute(attribute, value);
            break;
    }
};

// +============+======+====================================================
// | Functions  |  F2  |    Text Functions and ScoreBoard.
// +------------+------+----------------------------------------------------
   
   
// Changes text between a specific element's tags example: <p>text here!</p>
// @param {String}  id = unique identifier
// @param {String|Number}  text = the text or value that you want to write.

var changeText = function (id, text) {
    svg.getElementById(id).textContent = text;
};

// Creates a new SVG text object with standard fontsize and properties,
//   and Adds the text into the element: <text>text here!</text>,
//   requires already defined GLOBAL VARs, in order to calculate fontsize.
// @param {String}  id = unique identifier.
// @param {Number}  x = number of pixels from left to right.
// @param {Number}  y = number of pixels from top to bottom.
// @param {String}  text = the text you want to write into the element.
// @param {Number}  fontsize (optional) = Default fontsize is factorY/2.5

var makeText = function (id, x, y, text, fontsize) {
    if (typeof fontsize !== 'number') {fontsize = factorY/2.5;}
    make('text', 'textboard', [
        ['x', x],
        ['y', y],
        ['font-size', fontsize],
        ['id', id]
    ]);
    changeText(id, text);
};




// +============+========+====================================================
// | Functions  |  F3.2  |    Lines - Drawings and Colorings
// +------------+--------+----------------------------------------------------



// change Line Color of the actual SVG object.
var changeLineColor = function (i, j, p, q, classValue) {
    var line = 'line_('+i+','+j+')_('+p+','+q+')';
    return change(line, 'class', classValue);
};

var determineLineColor = function (lineValue) {
    switch(lineValue) {
        case 0: return 'defaultLine';
        case 1: return 'blueLine';
        case 2: return 'redLine';
    }
};

// Keep in mind that (xF > x0) and also (yF > y0)

var colorTheseHorizontalLines = function (xF, x0, yF, y0) {
    updateValuesForTheseHorizontalLines(xF, x0, yF, y0);
    for (var i = xF; i >= x0; i--) { for (var j = yF; j >= y0; j--) {
        change(
            ('horizontal_(' + i + ',' + j + ')'), 
            'class', determineLineColor(horizontalGrid[i][j])
        );
    }}
};

var colorTheseVerticalLines = function (xF, x0, yF, y0) {
    updateValuesForTheseVerticalLines(xF, x0, yF, y0);
    for (var i = xF; i >= x0; i--) { for (var j = yF; j >= y0; j--) {
        change(
            ('vertical(' + i + ',' + j + ')'), 
            'class', determineLineColor(verticalGrid[i][j])
        );
    }}
};


var determineLineColorDiagonal = function (input) {
    switch(input) {
        case false: return 'defaultLine';
        case 0: return 'confirmedBridgeLine';
        case 1: return 'blueLine';
        case 2: return 'redLine';
    }
};


// var colorAllDiagonalsF = function () {
//     var bridges = Array.from(savedBridgesForward);
//     for (var i = bridges.length - 1; i >= 0; i--) {
//         var L = valueToBridge(bridges[i]);
//         var color = determineLineColorDiagonal(
//             comparePointsForLineValue(L[0],L[1]+1, L[0]+1, L[1]));
//         changeDiagonal('F', bridges[i], 'class', color);
//     }
// };
// var colorAllDiagonalsB = function () {
//     var bridges = Array.from(savedBridgesBackward);
//     for (var i = bridges.length - 1; i >= 0; i--) {
//         var L = valueToBridge(bridges[i]);
//         var color = determineLineColorDiagonal(
//             comparePointsForLineValue(L[0],L[1], L[0]+1, L[1]+1));
//         changeDiagonal('B', bridges[i], 'class', color);
//     }
// };

var colorTheseDiagonalsF = function (xF, x0, yF, y0) {
    updateValuesForTheseForwardDiagonals(xF, x0, yF, y0);
    for (var i = xF; i >= x0; i--) { for (var j = yF; j >= y0; j--) {
        changeDiagonal('F', bridgeToValue(i,j), 'class', determineLineColorDiagonal(forwardDiagonalGrid[i][j]));
    }} 
};

var colorTheseDiagonalsB = function (xF, x0, yF, y0) {
    updateValuesForTheseBackwardDiagonals(xF, x0, yF, y0);
    for (var i = xF; i >= x0; i--) { for (var j = yF; j >= y0; j--) {
        changeDiagonal('B', bridgeToValue(i,j), 'class', determineLineColorDiagonal(backwardDiagonalGrid[i][j]));
    }}
};




var colorAllDiagonals = function () {
    colorTheseDiagonalsF(numberOfPointsX - 2, 0, 
        numberOfPointsY - 2, 0);
    colorTheseDiagonalsB(numberOfPointsX - 2, 0, 
        numberOfPointsY - 2, 0);
};

var colorAllLines = function () {
    colorTheseHorizontalLines(numberOfPointsX - 2, 0, numberOfPointsY - 1, 0);
    colorTheseVerticalLines(numberOfPointsX - 1, 0, numberOfPointsY - 2, 0);
    colorAllDiagonals();
};











// +============+========+====================================================
// | Functions  |  F4    |    Highlighting Events
// +------------+--------+----------------------------------------------------



// Global Variable - Highlighted Point

var highlightedPoint = false;

var highlightBridge = function (nodelist, index) {
    if (typeof index !== 'number') {return;}
    if (nodelist[index].getAttribute('class') !== 'defaultLine') {return;}
    return nodelist[index].setAttribute('class','potentialBridgeLine');
};

var highlightDiagonalBridges = function (A,B) {
    var Q;
    var Z = getDiagonalBridges([A,B]);

    Q = svg.getElementById('ForwardCrossedLines').childNodes;
    highlightBridge(Q, Z[0][0]);
    highlightBridge(Q, Z[0][1]);
    Q = svg.getElementById('BackwardCrossedLines').childNodes;
    highlightBridge(Q, Z[1][0]);
    highlightBridge(Q, Z[1][1]);
};

// function for higlighting nearby points and lines.
//   1. Highlight Adjacent Points (the ones you can move to.)
//   2. Highlight Potential Bridge Lines (things you can draw.)

var highlightNearby = function (A, B) {

    // highlightAdjacentPoints(A, B);

    var adj = getAdjacentPoints([A,B]);
    for (var i = adj.length - 1; i >= 0; i--) {
        var P = valueToPoint(adj[i]);
        change(myDot(P[0], P[1]), 'class','adjPoint');
    }

    // The 4 diagonal points
    if (bridgeCounter > 0) {highlightDiagonalBridges(A,B);}
    
    
};

// My Click Event!  The Logic of this goes as follows:
//      1. If you already have a highlighted point, go to highlightEvent
//      2. If you don't, then highlight the piont you clicked on!
var myClickEvent = function (i, j) {

    var clickedPoint = [i,j];

    // If there's already another point highlighted, do something else.
    if (highlightedPoint !== false) {
        myHighlightEvent(clickedPoint);
        return checkForVictory();
    }

    highlightedPoint = [i,j];
    change(myDot(i,j), 'class', 'highlightedPoint');
    highlightNearby(i,j);
};

// My Highlight Event!  The Logic of this goes as follows:
//      1. If you clicked on the highlighted point, Deselect it, and leave.
//      2. Leave If you did NOT click on a Nearby Point (the 8 points nearby)
//      3. Clicked on a diagonal point?  Examine those further for bridges.
//      4. Clicked on an adjacent point?  Do the Swap function!

var myHighlightEvent = function (clickedPoint) {

    // 1. Clicking on the highlighted point
    if ((highlightedPoint[0] === clickedPoint[0]) & (highlightedPoint[1] === clickedPoint[1])) {return deSelect();}

    //  temporary variables for testing different cases.
    var deltaX = Math.abs(highlightedPoint[0] - clickedPoint[0]);
    var deltaY = Math.abs(highlightedPoint[1] - clickedPoint[1]);

    // 2. Did not click on nearby Point.
    if ( (deltaX > 1) || (deltaY > 1) ) {return;}

    // 3. clicked along the diagonals
    if ((deltaX === 1) & (deltaY === 1)) 
        {return myDiagonalEvent(clickedPoint);}

    // 4. Adjacent Points
    if ((deltaX === 1) || (deltaY === 1)) {return swap(clickedPoint);}    
};


// My Diagonal Event!  The Logic of this goes as follows:
//      1. Clicked on a Already-Bridged Diagonal Point?  Delete that bridge!
//      2.  Nothing there?  Build a bridge!

var myDiagonalEvent = function(clickedPoint) {
    var H0 = (highlightedPoint[0]); var H1 = (highlightedPoint[1]);
    var C0 = (clickedPoint[0]);     var C1 = (clickedPoint[1]);

    var A; var B;
    // You clicked to the LEFT, so use C0 as bridge x-value.
    if (C0 < H0) {A = C0;}

    // You clicked to the RIGHT, so use H0 as bridge x-value
    if (C0 > H0) {A = H0;}

    // You clicked ABOVE, so use C1 as the value.
    if (C1 < H1) {B = C1;}

    // you clicked BELOW, so use H1 as the value.
    if (C1 > H1) {B = H1;}
    
    // convert the bridge location to a numeric value, so it's easy to save.
    var val = bridgeToValue(A, B);

    // Check to see if we already have that bridge, if we do... then 
    //      0. CHECK IF WE HAVE ENOUGH "Bridges Remaining".
    //      1. Add the bridge to the "saved Bridges",
    //      2. Change the color so we know we have it. (purple or something)
    //      3. Count down on your bridge's remaining.

    // Forward Diagonal
    if ((((C0-H0) === 1) & ((C1-H1) === -1)) || (((C0-H0) === -1) & ((C1-H1) === 1))) {

        // Check to see if we already have that bridge.  Remove it if we do.
        if (savedBridgesForward.has(val)) {
            // change(forwardDiagonal(A,B),'class','defaultLine'); 
            forwardDiagonalGrid[A][B] = false;
            savedBridgesForward.delete(val);
            bridgeCounter++;
        } else {
            if (bridgeCounter <= 0) {return;}
            forwardDiagonalGrid[A][B] = 0;
            // change(forwardDiagonal(A,B),'class','confirmedBridgeLine');   
            savedBridgesForward.add(val); 
            bridgeCounter--;
        }
        updateBridgeCounter();
        // toggleBridge('forward', val);
        colorAllDiagonals();
        return deSelect();
    }

    // Backward Diagonal
    if ((((C0-H0) === 1) & ((C1-H1) === 1)) || (((C0-H0) === -1) & ((C1-H1) === -1))) {

        // Check to see if we already have that bridge.  Remove it if we do.
        if (savedBridgesBackward.has(val)) {
            backwardDiagonalGrid[A][B] = false;
            // change(backwardDiagonal(A,B),'class','defaultLine');
            savedBridgesBackward.delete(val);
            bridgeCounter++;
        } else {
            if (bridgeCounter <= 0) {return;}
            // change(backwardDiagonal(A,B),'class','confirmedBridgeLine');
            backwardDiagonalGrid[A][B] = 0;
            savedBridgesBackward.add(val); 
            bridgeCounter--;
        }
        updateBridgeCounter();
        // toggleBridge('backward', val);
        colorAllDiagonals();
        return deSelect();
    }

};

// My Swap Event! The Logic of this goes as follows:
//      1. Same Color?  Don't do a swap, just move the highlight to it.
//      2. Remove highlight from currently selected point
//      3. Swap colors between both of the points
//      4. 
var swap = function(clickedPoint) {

    var H0 = (highlightedPoint[0]); var H1 = (highlightedPoint[1]);
    var C0 = (clickedPoint[0]);     var C1 = (clickedPoint[1]);

    var H = grid[H0][H1];
    var C = grid[C0][C1];

    deSelect();

    // When they are the same color
    if (H === C) {  return; }

    // When they are different (swap the colors here)
    if (H !== C) {

        // Swap the actual values within the Grid Array.

        grid[H0][H1] = C;   
        grid[C0][C1] = H;

        // ReDraw the HIGHLIGHTED dot.

        if (C) {color = MY_BLUE;}   
        else   {color = MY_RED;}
        id = myDot(H0, H1);
        change(id, 'fill', color); change(id, 'stroke', color);

        // ReDraw the dot you just clicked on.

        if (H) {color = MY_BLUE;}
        else   {color = MY_RED;}
        id = myDot(C0, C1); 
        change(id, 'fill', color); change(id, 'stroke', color);


        highlightedPoint = false;

        swapCounter++;
        updateSwapCounter();

        // Since things have probably moved due to swapping points,
        //   check and color all of thelines
        colorAllDiagonals();
        return colorAllLines();
    }

};

var deSelect = function () {
    var id = ('myDot_' + highlightedPoint[0] + "_" + highlightedPoint[1]);
    change(id, 'class', 'regularDot');

    var adj = document.querySelectorAll(".adjPoint");
    for (var i = adj.length - 1; i >= 0; i--) {
        adj[i].setAttribute('class', "regularDot");
    }
    
    var pots = document.querySelectorAll(".potentialBridgeLine");
    for (var j = pots.length - 1; j >= 0; j--) {
        pots[j].setAttribute('class', "defaultLine");
    }
    

    highlightedPoint = false;
};



















// ==========================================================================
// ##########################################################################
// ==========================================================================











// +==================+=====+=================================================
// | Initial Drawing  |  0  |    Main Title and The Score Board.
// +------------------+-----+-------------------------------------------------


// Main Title!  Positioned above the dots.  Top of the SVG.

makeText('text_title',width/2,factorY/2.5, "The Dot Path Game");

makeText('score_swaps', width/4, factorY*3/4,"Swaps Used", factorY/4);
makeText('score_swaps_counter', width/4, factorY+20, 0, factorY/3 + 10);

makeText('score_bridges_counter', 700, factorY+20, 10, factorY/3 + 10);
makeText('score_bridges',700,factorY*3/4,"Bridges Remaining", factorY/4);


var updateSwapCounter = function () {
    changeText('score_swaps_counter', String(swapCounter));
};

var updateBridgeCounter = function() {
    changeText('score_bridges_counter', String(bridgeCounter));
};

// +==================+=====+=================================================
// | Initial Drawing  |  1  |    The Lines - AKA Bridges
// +------------------+-----+-------------------------------------------------

var makeLine = function (path, id, x1, y1, x2, y2) { 
    make('line', path, [
        ['x1', x1],
        ['y1', y1],
        ['x2', x2],
        ['y2', y2],
        ['class', 'defaultLine'],
        ['id', id],
    ]);   
};

// Initially, we want to draw all of the lines, using gray as the default
// We only need to create the line elements once.
// Updating colors will happen many times throughout the program.


// make All of the Horizontal Lines

for (var i = 0; i <= horizontalGrid.length - 1; i++) {
    for (var j = 0; j <= horizontalGrid[i].length - 1; j++) {
        makeLine('horizontalLines',
            ('horizontal_(' + i + ',' + j + ')'),
            factorX * (i+1), factorY * (j+1) + factorY*3/4,
            factorX * (i+2), factorY * (j+1) + factorY*3/4
        );
    }
}


// make All of the Vertical Lines

for (var i = 0; i <= verticalGrid.length - 1; i++) {
    for (var j = 0; j <= verticalGrid[i].length - 1; j++) {
        makeLine('verticalLines',
            ('vertical(' + i + ',' + j + ')'),
            factorX * (i+1), factorY * (j+1) + factorY*3/4,
            factorX * (i+1), factorY * (j+2) + factorY*3/4
        );
    }
}

// make All of the Diagonal Lines

for (var i = 0; i <= numberOfPointsX - 2; i++) {
    for (var j = 0; j <= numberOfPointsY - 2; j++) {
        makeLine('ForwardCrossedLines',
            ('forwardDiagonal('+i+','+j+')'),
            factorX * (i+2), factorY * (j+1) + factorY*3/4,
            factorX * (i+1), factorY * (j+2) + factorY*3/4
        );
    }
}


for (var i = 0; i <= numberOfPointsX - 2; i++) {
    for (var j = 0; j <= numberOfPointsY - 2; j++) {
        makeLine('BackwardCrossedLines',
            ('backwardDiagonal('+i+','+j+')'),
            factorX * (i+1), factorY * (j+1) + factorY*3/4,
            factorX * (i+2), factorY * (j+2) + factorY*3/4
        );
    }
}


// make Some information for diagonal lines
// displays the line grid's index on top of the line.  Debugging only.
if (DEBUG_SHOW_LINE_TEXT) {
    (function() {
        for (var i = 0; i <= numberOfPointsX - 2; i++) {
            for (var j = 0; j <= numberOfPointsY - 2; j++) {

                var lineText =
                make('text', 'lineTextZone', [
                    ['x', factorX * (i+1.5)],
                    ['y', factorY * (j+1.5) + factorY*3/4 + dotRadius/4],
                    ['font-size', dotRadius],
                    ['text-anchor',"middle" ],
                    ['fill', '#FFF'],
                    ['class', 'lineText'],
                    ['id', ('myLineText_' + i + '_' + j)]
                ]);

                var textToAdd = String(i) + ',' + j;
                //var textToAdd = String( bridgeToValue(i,j) );
                var textNode = document.createTextNode(textToAdd);
                document.getElementById(('myLineText_' + i + '_' + j)
                    ).appendChild(textNode);
            }
        }
    })();
}
    


// +==================+=====+=================================================
// | Initial Drawing  |  2  |    The Main Dots
// +------------------+-----+-------------------------------------------------

// Make lots of circles
// The ID of each circle will be > id = "myDot_i_j"
// The color will be randomized > fill = 'RED'|'BLUE'

for (var i = 0; i <= numberOfPointsX - 1; i++) {
    for (var j = 0; j <= numberOfPointsY - 1; j++) {
    
        id = ('myDot_' + i + "_" + j);

        var color;
        if (grid[i][j]) {color = MY_BLUE;} 
        else            {color = MY_RED;}

        make('circle', 'dotgrid', [ 
            ['onclick', ("myClickEvent(" + i +','+ j + ");" )],
            ['class', 'regularDot'],
            ['cx', factorX * (i+1)],
            ['cy', factorY * (j+1) + factorY*3/4],
            ['r', dotRadius],
            ['fill', color],
            ['stroke', color],
            ['A', i],
            ['B', j],
            ['id', id]
        ]);

        if (DEBUG_SHOW_DOT_TEXT) {
            make('text', 'dotGridTextZone', [
                ['x', factorX * (i+1)],
                ['y', factorY * (j+1) + factorY*3/4 + dotRadius/4],
                ['font-size', dotRadius],
                ['text-anchor',"middle" ],
                ['fill', '#FFF'],
                ['class', 'dotText'],
                ['id', ('myText_' + i + '_' + j)]
            ]);            
            // var val = pointToValue(i,j);
            var textToAdd = String(i) + ',' + j;
            // var textToAdd = val;
            var textNode = document.createTextNode(textToAdd);
            document.getElementById(
                ('myText_' + i + '_' + j)).appendChild(textNode);
        }



    }
}

var colorAllPoints = function () {
    var color;
    for (var i = 0; i <= numberOfPointsX - 1; i++) {
        for (var j = 0; j <= numberOfPointsY - 1; j++) {
            if (grid[i][j]) {color = MY_BLUE;} 
            else            {color = MY_RED;}
            id = ('myDot_' + i + "_" + j);
            change(id, 'fill', color);
            change(id, 'stroke', color);
        }
    }
    
};


colorAllLines();
colorAllPoints();
updateBridgeCounter();





