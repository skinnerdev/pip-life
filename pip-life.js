/*
TODO:
* Grid Config Object and New-able, it knows about the vars grid, columns, rows
* Click on cell shows it's contents, structure and pips (done)...but next step is show in the UI
* Show structures on map
* Show heat-map style of pip density
* Pips can have thought bubbles?
* Show output on main screen (events of pips, etc);
* Controls: Start, Pause, Reset
*/
'use strict';

// CONFIG
var UNIT_COLOR = '#008800';
var MALE_PIP_COLOR = '';
var FEMALE_PIP_COLOR = '';
var COLUMNS = 100;
var ROWS = 80;
var MIN_DEATH_AGE = 87;
var MAX_DEATH_AGE = 94;
var PIP_ADULT_AGE = 18;
var TICKS_BETWEEN_BIRTHS = 4;
var LIST_SEARCH_POPULATION_MAX = 2000;
var SPIRAL_SEARCH_MAX_DISTANCE = 30;
var INNER_UNIT_PROSPECT_POPULATION_MAX = 100;
var TICK_PER_YEAR = 4;
var MAX_TICKS = 10000;

// STATS
var PIP_BIRTHS = 0;
var PIP_DEATHS = 0;
var YEARS = 0;

// GRAPH
var dataLength = 2500;
var dps1 = [];
var dps2 = [];
var chart = new CanvasJS.Chart("chartContainer",{
  title :{
    text: "PIP Population"
  },      
  data: [
    {
      showInLegend: true,
      legendText: 'Pip Population',
      type: "line",
      dataPoints: dps1
    },
    {
      showInLegend: true,
      legendText: 'Structure Count',
      type: "line",
      dataPoints: dps2
    },
  ]
});

// PRIVATE
var TICK = 0;
var PIP_IDX = [];
var UNIT_IDX = [];
var GRID = [];
var RUNNING = false;

function getRandomNum(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

var logSpot = document.getElementById("output");
function log(str) {
  var span = document.createElement('li');
  var text = document.createTextNode(str);
  span.appendChild(text);
  logSpot.appendChild(span);
}

function drawGrid() {
  var container = document.getElementById('game');
  var gridHtml = '<table>';
  var r = 0;
  var c = 0;
  for (r; r <= ROWS; r+=1) {
    gridHtml += '<tr>';
    for (c = 0; c <= COLUMNS; c+=1) {
      if (GRID[c] === undefined) {
        GRID[c] = [];
      }
      GRID[c][r] = {
        element: null,
        structure: null,
        pips: []
      };
      gridHtml += '<td id="' + c + '.' + r + '"></td>';
    }
    gridHtml += '</tr>';
  }
  gridHtml += '</table>';
  container.innerHTML = gridHtml;

  GRID.forEach(function(val, x){
    val.forEach(function(obj, y) {
      obj.element = document.getElementById(x + '.' + y);
      obj.element.addEventListener("click", function() {
        cellDetails(x, y);
      });
    });
  });
}

function cellDetails(x, y) {
  console.log(GRID[x][y]);
}

function setStartingPips() {
  var pip1 = new Pip({gender: 0, startingUnit: {location: {x: 10, y: 10}}});
  pip1.gender = 1;
  var pip2 = new Pip({gender: 1, startingUnit: {location: {x: 20, y: 20}}});
  pip2.gender = 0;
  PIP_IDX.push(pip1);
  GRID[pip1.location.x][pip1.location.y].pips.push(pip1);
  PIP_IDX.push(pip2);
  GRID[pip2.location.x][pip2.location.y].pips.push(pip2);
}

(function() {
  drawGrid();
  setStartingPips();
  drawItems();

  var btn = document.getElementById("toggleBtn");
  btn.addEventListener("click", function() {
    var button = document.getElementById("toggleBtn");
    if (RUNNING) {
      pause();
      button.innerHTML = "Run";
    }
    else {
      run();
      button.innerHTML = "Pause";
    }
  });
})();

function run() {
  RUNNING = true;
  log( "Game Started");
  cycle();
}

function pause() {
  RUNNING = false;
  log( "Game Paused");
}

var statCount = document.getElementById('pipCount');
var statBirths = document.getElementById('pipBirths');
var statDeaths = document.getElementById('pipDeaths');
var statStructs = document.getElementById('structureCount');
var statTicks = document.getElementById('ticks');
var statYears = document.getElementById('years');
function cycle() {
  if (RUNNING) {
    TICK++;
    if (TICK >= MAX_TICKS || PIP_IDX.length === 0) {
      RUNNING = false;
    }
    PIP_IDX.forEach(function(pip, idx) {
      pip.think();
    });
    drawItems();
    if (TICK % TICK_PER_YEAR === 0) {
      YEARS += 1;
    }
    statCount.innerHTML = PIP_IDX.length;
    statBirths.innerHTML = PIP_BIRTHS;
    statDeaths.innerHTML = PIP_DEATHS;
    statStructs.innerHTML = UNIT_IDX.length + '/' + (ROWS * COLUMNS);
    statTicks.innerHTML = TICK + '/' + MAX_TICKS;
    statYears.innerHTML = YEARS;
    dps1.push({x: YEARS, y: PIP_IDX.length});
    dps2.push({x: YEARS, y: UNIT_IDX.length});
    if (dps1.length > dataLength) {
      dps1.shift();
      dps2.shift();        
    }
    chart.render();
    window.requestAnimationFrame(cycle);
  }
}

function drawItems() {
  GRID.forEach(function(val, x) {
    val.forEach(function(obj, y) {
      obj.element.style.backgroundColor = null;
      if (obj.structure === null) {
        if (obj.pips.length) {
          // obj.element.style.backgroundColor = 'rgba(' + obj.pips[0].color + ',' + ((100 - obj.pips[0].age) / 100) + ')';
          if (obj.pips[0].gender) {
            obj.element.style.backgroundColor = 'rgb(255,0,128)';
          } else {
            obj.element.style.backgroundColor = 'rgb(102,204,255)';
          }
        }
      } else {
        obj.element.style.backgroundColor = obj.structure.color;
      }
    });
  });
}