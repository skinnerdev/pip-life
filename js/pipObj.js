var pipId = 0;

function Pip(conf) {
  this.id = pipId++;
  this.type = 'pip';
  this.startingUnit = conf.startingUnit || 0;
  this.gender = getRandomNum(0, 1);
  this.state = null;
  this.pursuing = null; // deprecated, should be a state now
  this.birthTick = TICK;
  this.age = 0;
  this.color = (this.gender) ? MALE_PIP_COLOR : FEMALE_PIP_COLOR;
  this.unit = null;
  this.partner = null;
  this.location = {
    x: this.startingUnit.location.x,
    y: this.startingUnit.location.y
  };
  this.eco_income = 0;
  this.eco_balance = 0;
  this.died = 0;
  this.deathTick = null;
}


Pip.prototype.think = function() {
  var self = this;

  // Age me
  if (TICK % TICK_PER_YEAR === 0) {
    self.age += 1;
  }

  // Is it my time to die?
  if (self.age > getRandomNum(MIN_DEATH_AGE, MAX_DEATH_AGE)) {
    self.die();
    return;
  }

  // Play if youth
  if (self.age < PIP_ADULT_AGE) {
    self.play();
    return;
  }

  // Find a partner if I don't have one
  if (self.partner === null) {
    self.findPartner();
    return;
  }

  // Check if I have had my planned children
  if (self.unit.members.length < self.unit.plannedChildren) {
    // Either no kid or enough time has passed
    if ((TICK - self.unit.lastChildOnTick) > TICKS_BETWEEN_BIRTHS || self.unit.lastChildOnTick === 0) {
      self.makePip();
      return;
    }
  }

  self.play();
  return;
  // If my income is 0, I need a job
  // If my balance > 1,000,000, randomly make a job or join one if any available
  // If no jobs available, and I've a partner, make a job
  // If no jobs available, and I've not a partner, get a partner

}

Pip.prototype.die = function() {
  var self = this;
  self.died = 1;
  self.deathTick = TICK;

  // Take me out of the index
  for (var idx in PIP_IDX) {
    if (PIP_IDX[idx].id === self.id) {
      PIP_IDX.splice(idx, 1);
      break;
    }
  };

  // Remove me from the grid
  GRID[self.location.x][self.location.y].pips.forEach(function(pip, idx) {
    if (pip.id === self.id) {
      GRID[self.location.x][self.location.y].pips.splice(idx, 1);
    }
  });

  // Remove my unit if I'm the last to go
  if (self.unit !== null && self.unit.maleFounder.died && self.unit.femailFounder.died) {
    GRID[self.unit.location.x][self.unit.location.y].structure = null;
    UNIT_IDX.forEach(function(unit, idx) {
      if (unit.id === self.unit.id) {
        UNIT_IDX.splice(idx, 1);
      }
    });
  }

  // And done
  PIP_DEATHS++;
}

Pip.prototype.goTo = function(x, y) {
  var self = this;
  var moveX = self.location.x;
  var moveY = self.location.y;
  if (self.location.x !== x) {
    if (self.location.x > x) {
      moveX--;
    } else {
      moveX++;
    }
  }
  if (self.location.y !== y) {
    if (self.location.y > y) {
      moveY--;
    } else {
      moveY++;
    }
  }
  if (moveX !== self.location.x || moveY !== self.location.y) {
    self.setPipPosition(moveX, moveY);
  }
}

Pip.prototype.setPipPosition = function(x, y) {
  var self = this;
  if (x > COLUMNS) {
    x = COLUMNS;
  }
  if (y > ROWS) {
    y = ROWS;
  }
  if (x < 0) {
    x = 0;
  }
  if (y < 0) {
    y = 0;
  }
  GRID[self.location.x][self.location.y].pips.forEach(function(p, idx) {
    if (p.id === self.id) {
      GRID[self.location.x][self.location.y].pips.splice(idx, 1);
    }
  });
  GRID[x][y].pips.push(self);
  self.location = {x: x, y: y};
}

Pip.prototype.makePip = function() {
  var self = this;
  if (self.location.x !== self.unit.location.x || self.location.y !== self.unit.location.y) {
    self.goTo(self.unit.location.x, self.unit.location.y);
    return;
  }
  // Partner needs to be here
  if (self.location.x === self.partner.location.x && self.location.y === self.partner.location.y) {
    var baby = new Pip({startingUnit: self.unit});
    GRID[self.location.x][self.location.y].pips.push(baby);
    self.unit.members.push(baby);
    self.unit.lastChildOnTick = TICK;
    PIP_IDX.push(baby);
    PIP_BIRTHS++;
    return;
  }
}

Pip.prototype.play = function() {
  return true;
  
  // wander
  var self = this;
  var moveX = self.location.x;
  var moveY = self.location.y;
  switch (getRandomNum(0, 6)) {
    case 2:
      moveX++;
      break;
    case 5:
      moveX--;
      break;
  }
  switch (getRandomNum(0, 6)) {
    case 1:
      moveY++;
      break;
    case 6:
      moveY--;
      break;
  }
  self.goTo(moveX, moveY);
}

Pip.prototype.findPartner = function() {
  var self = this;
  // If I'm not pursuing, or the one I'm pursuing all of a sudden is taken or I've been pursuing for 50-150 ticks
  if (self.pursuing === null || self.pursuing.partner !== null) {
    // Spiral out from me to find a partner
    if (PIP_IDX.length > LIST_SEARCH_POPULATION_MAX) {
      self.pursuing = self.spiralSearchForMate();
    } else {
      // Find the one closest to me by parsing the whole list
      self.pursuing = self.listSearchForMate();
    }
  }
  if (self.pursuing === null) {
    return;
  }

  if (self.location.x !== self.pursuing.location.x && self.location.y !== self.pursuing.location.y) {
    self.goTo(self.pursuing.location.x, self.pursuing.location.y);
    return;
  }
  if (self.gender) {
    self.proposeUnion();
  }
}

Pip.prototype.listSearchForMate = function() {
  var self = this;
  var distance = 10000;
  for (var idx in PIP_IDX) {
    if (self.validatePartner(PIP_IDX[idx])) {
      var xd = PIP_IDX[idx].location.x - self.location.x;
      var yd = PIP_IDX[idx].location.y - self.location.y;
      var dist = Math.sqrt(xd * xd + yd * yd);
      if (dist < distance) {
        distance = dist;
        return PIP_IDX[idx];
      }
    }
  };
  return null;
}

Pip.prototype.spiralSearchForMate = function() {
  var self = this;
  var xs = self.location.x;
  var ys = self.location.y;
  if (GRID[xs][ys].pips.length) {
    for (var idx = 0; idx < GRID[xs][ys].pips.length; idx++) {
      var prospect = GRID[xs][ys].pips[idx];
      if (self.validatePartner(prospect)) {
        return prospect;
      }
    }
  }
  var maxDistance = SPIRAL_SEARCH_MAX_DISTANCE;
  for (var d = 0; d < maxDistance; d++) {
    for (var x = xs - d; x < xs + d + 1; x++) {
      // Point to check: (x, ys - d) and (x, ys + d)
      var minusY = (ys - d < 0) ? 0 : ys - d;
      var realX = (x < 0) ? 0 : (x > COLUMNS) ? COLUMNS : x;
      if (GRID[realX][minusY].pips.length) {
        for (var idx = 0; idx < GRID[realX][minusY].pips.length; idx++) {
          var prospect = GRID[realX][minusY].pips[idx];
          if (self.validatePartner(prospect)) {
            return prospect;
          }
        }
      }
      var plusY = (ys + d > ROWS) ? ROWS : ys + d;
      if (GRID[realX][plusY].pips.length) {
        for (var idx = 0; idx < GRID[realX][plusY].pips.length; idx++) {
          var prospect = GRID[realX][plusY].pips[idx];
          if (self.validatePartner(prospect)) {
            return prospect;
          }
        }
      }
    }
    for (var y = ys - d + 1; y < ys + d; y++) {
      // Point to check = (xs - d, y) and (xs + d, y)
      var minusX = (xs - d < 0) ? 0 : xs - d;
      var realY = (y < 0) ? 0 : (y > ROWS) ? ROWS : y;
      if (GRID[minusX][realY].pips.length) {
        for (var idx = 0; idx < GRID[minusX][realY].pips.length; idx++) {
          var prospect = GRID[minusX][realY].pips[idx];
          if (self.validatePartner(prospect)) {
            return prospect;
          }
        }
      }
      var plusX = (xs + d > COLUMNS) ? COLUMNS : xs + d;
      if (GRID[plusX][realY].pips.length) {
        for (var idx = 0; idx < GRID[plusX][realY].pips.length; idx++) {
          var prospect = GRID[plusX][realY].pips[idx];
          if (self.validatePartner(prospect)) {
            return prospect;
          }
        }
      }
    }
  }
  return null;
}

Pip.prototype.validatePartner = function(prospect) {
  var self = this;
  return (
  prospect.id !== self.id && // Not me
  prospect.gender !== self.gender && // Opposite Gender
  prospect.partner === null && // Isn't already taken
  prospect.age > PIP_ADULT_AGE && // Old enough
  (prospect.startingUnit !== self.startingUnit || PIP_IDX.length < INNER_UNIT_PROSPECT_POPULATION_MAX)); // Not in my family unless small population 
}

Pip.prototype.proposeUnion = function() {
  var self = this;
  var unit = new Unit(self, self.pursuing);
  // What if...unit's location uses the spiral method from the males original unit to find one at least two spaces away?
  unit.findLocation();
  self.partner = self.pursuing;
  self.partner.partner = self;
  self.unit = unit;
  self.partner.unit = unit;
  self.pursuing = null;
  unit.createdTick = TICK;
  UNIT_IDX.push(unit);
}