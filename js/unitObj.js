var unitId = 0;

function Unit(male, female) {
  this.id = unitId++;
  this.type = 'unit';
  this.color = UNIT_COLOR;
  this.createdTick = 0;
  this.maleFounder = male;
  this.femailFounder = female;
  this.lastChildOnTick = 0;
  this.plannedChildren = this.getPlannedChildren();
  this.location = {
    x: null,
    y: null
  };
  this.members = [];
}

Unit.prototype.getPlannedChildren = function() {
  var plan = 1;
  if (PIP_IDX.length <= 1500) {
    plan = getRandomNum(5, getRandomNum(7, 10));
  } else if (PIP_IDX.length > 1500 && PIP_IDX.length <= 3250) {
    plan = getRandomNum(3, getRandomNum(4, 6));
  } else if (PIP_IDX.length > 3250 && PIP_IDX.length <= 5000) {
    plan = getRandomNum(1, getRandomNum(2, 3));
  }
  return plan;
}

Unit.prototype.findLocation = function() {
  var self = this;
  var foundLocation = false;
  var attempts = 0;
  var x = 0;
  var y = 0;
  var totalCells = COLUMNS * ROWS;
  while ( ! foundLocation) {
    if (attempts < 10 && UNIT_IDX.length < (totalCells / 2)) {
      x = getRandomNum(0, COLUMNS);
      y = getRandomNum(0, ROWS);
      if (GRID[x][y].structure == null) {
        GRID[x][y].structure = self;
        self.location = {
          x: x,
          y: y
        };
        foundLocation = true;
      }
    } else {
      y = 0;
      x = 0;
      for (var Xaxis in GRID) {
        for (var Yaxis in GRID[Xaxis]) {
          if (GRID[Xaxis][Yaxis].structure == null) {
            x = Xaxis;
            y = Yaxis;
          }
        }
      }
      if (GRID[x][y].structure == null) {
        GRID[x][y].structure = self;
        self.location = {
          x: x,
          y: y
        };
        foundLocation = true;
      } else {
        foundLocation = true;
        log("No suitable location for a unit.");
      }
    }
  }
}