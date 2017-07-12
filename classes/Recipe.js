class Recipe {
  constructor(profession, options, addToProductionList) {
    function isInValidRange(number) {
      return 1 <= number && number <= MAX_SKILL_LEVEL;
    }

    var id = parseInt(options.id);
    var creationId = parseInt(options.creationId);
    var creationQuantity = parseInt(options.creationQuantity);
    var orangeSkill = parseInt(options.orange) || 1;
    var yellowSkill = parseInt(options.yellow) || 1;
    var graySkill = parseInt(options.gray) || 1;
    var reagents = options.reagents;
    var creates = options.creates
    for (var id in reagents)
      if (!isFinite(id) || !isFinite(reagents[id])) throw new Error();
    if (isFinite(id) && isFinite(creationId) && isFinite(creationQuantity) && profession instanceof Profession && isInValidRange(orangeSkill) && isInValidRange(yellowSkill) && isInValidRange(graySkill) && typeof options.name === "string") {
      this.id = id;
      this.creationId = creationId;
      this.creationQuantity = creationQuantity;
      this.profession = profession;
      this.orangeSkill = orangeSkill;
      this.yellowSkill = yellowSkill;
      this.graySkill = graySkill;
      this.reagents = reagents;
      this._element = null;
      this.addToProductionList = addToProductionList.bind(this);
    } else throw new Error();
  }

  craftable(recipes, currentRecipeIndex, getItemFromId) {
    if (this.profession.skill < this.orangeSkill) return false;
    var craftable = true;
    for (var id in this.reagents) {
      var quantity = getItemFromId(parseInt(id)).quantity;
      for (var i = 0; i < currentRecipeIndex; i++) {
        var requiredMats = recipes[i].reagents[id];
        if (requiredMats) quantity -= requiredMats;
      }
      if (quantity < this.reagents[id]) return false;
    }
    return true
  }

  chanceToLevelUp(skill) {
    var numerator = this.graySkill - skill;
    var denominator = this.graySkill - this.yellowSkill;
    if (numerator < 0) return 0;
    if (denominator) return Math.max(0, Math.min(numerator / denominator, 1));
    return 1;
  }

  averageChanceToLevelUp(skillDistribution) {
    var chance = 0;
    for (var pair of skillDistribution) {
      chance += this.chanceToLevelUp(pair[0]) * pair[1];
    }
    chance = toFixed(chance * 100);
    return chance + '%';
  }

  get element() {
    if (this._element) return this._element;
    var row = document.createElement("tr");
    var nameTD = document.createElement("td");
    var link = document.createElement("a");
    var orangeTD = document.createElement("td");
    var yellowTD = document.createElement("td");
    var grayTD = document.createElement("td");
    var avgChanceTD = document.createElement("td");
    var reagentsTD = document.createElement("td");
    var buttonTD = document.createElement("td");
    var button = document.createElement("div");
    link.rel = "item=" + this.creationId;
    link.href = 'http://www.wowhead.com/item=' + this.creationId;
    link.innerText = "Loading...";
    nameTD.appendChild(link);
    orangeTD.className = "orange";
    orangeTD.innerText = this.orangeSkill;
    yellowTD.className = "yellow";
    yellowTD.innerText = this.yellowSkill;
    grayTD.className = "gray";
    grayTD.innerText = this.graySkill;
    avgChanceTD.innerText = this.averageChanceToLevelUp(new Map().set(profession.skill, 1));
    for (var id in this.reagents) {
      var span = document.createElement("span");
      span.innerText = this.reagents[id] + " x ";
      link = document.createElement("a");
      link.href = "item=" + id;
      link.innerText = "Loading...";
      reagentsTD.appendChild(span);
      reagentsTD.appendChild(link);
      reagentsTD.appendChild(document.createElement("br"));
    }
    button.className = "button";
    button.onclick = this.addToProductionList;
    button.innerText = "Add to production list";
    buttonTD.appendChild(button);
    row.appendChild(nameTD);
    row.appendChild(reagentsTD);
    row.appendChild(orangeTD);
    row.appendChild(yellowTD);
    row.appendChild(grayTD);
    row.appendChild(avgChanceTD);
    row.appendChild(buttonTD);
    document.getElementById("recipes").appendChild(row);
    this.avgChanceTD = avgChanceTD;
    this._element = row;
    return row;
  }
}