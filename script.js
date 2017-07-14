function toFixed(number) {
  number = number.toFixed(Math.min(20, Math.max(Math.floor(-Math.log10(number) + 2), 2)));
  if (number[number.length - 1] === '0') number = number.substring(0, number.length - 1);
  if (number[number.length - 1] === '0') number = number.substring(0, number.length - 1);
  if (number[number.length - 1] === '.') number = number.substring(0, number.length - 1);
  return number;
}

const MAX_SKILL_LEVEL = 1000;
var wowhead_tooltips = {
  "colorlinks": true,
  "iconizelinks": true,
  "renamelinks": true
};
addEventListener('load', () => {
  function updateOwnedItems(name, update = true) {
    for (var object of nameMap.get(name)) {
      object.previousQuantity = object.quantity;
      object.quantity = parseInt(localStorage.getItem(object.id)) || 0;
      if (0 < object.quantity) {
        object.element.style.display = 'block';
        object.input.value = object.quantity;
      } else if (0 < object.previousQuantity) object.element.style.display = 'none';
    }
    if (update && currentProfession) updateRecipes();
  }

  function updateRecipes() {
    var recipesTable = document.getElementById("recipes");
    var recipes = recipesTable.children;
    for (var i = 1; i < recipes.length; i++) recipes[i].remove();
    var i = 0;
    for (var recipe of currentProfession.recipes) {
      if (recipe.craftable(productionList, productionList.length, getItemFromId)) {
        recipesTable.appendChild(recipe.element);
        recipe.avgChanceTD.innerText = recipe.averageChanceToLevelUp(currentSkillDistribution);
        i++;
      }
    }
    $WowheadPower.refreshLinks();
  }

  function getItemFromName(name, id) {
    var objects = nameMap.get(name);
    if (objects.length === 1) return objects[0];
    else {
      ids = objects.map(a => a.id);
      if (id) return objects[ids.indexOf(id)];
      do {
        object = objects[ids.indexOf(prompt('The items with the IDs ' + (ids.join(', ')) + ' have the name you selected. Please enter one of those IDs.'))];
      } while (!object)
    }
  }

  function treeCalc(skillDistribution, currentRecipeIndex, currentChance, currentSkill, initialSkill) {
    if (currentRecipeIndex < productionList.length) {
      var recipe = productionList[currentRecipeIndex];
      if (recipe.craftable(productionList, currentRecipeIndex, getItemFromId)) {
        var learnChance = recipe.chanceToLevelUp(currentSkill);
        currentRecipeIndex++;
        treeCalc(skillDistribution, currentRecipeIndex, currentChance * learnChance, currentSkill + 1, initialSkill);
        treeCalc(skillDistribution, currentRecipeIndex, currentChance * (1 - learnChance), currentSkill, initialSkill);
      } else {
        skillDistribution.set(initialSkill, skillDistribution.get(initialSkill) - currentChance);
        skillDistribution.set(currentSkill, (skillDistribution.get(currentSkill) + currentChance) || currentChance);
        skillDistribution.set(null, (skillDistribution.get(null) + currentChance) || currentChance);
      }
    } else {
      skillDistribution.set(initialSkill, skillDistribution.get(initialSkill) - currentChance);
      skillDistribution.set(currentSkill, (skillDistribution.get(currentSkill) + currentChance) || currentChance);
    }
  }

  function calculateSkillDistribution() {
    var initialSkill = currentProfession.skill;
    var skillDistribution = new Map().set(initialSkill, 1);
    treeCalc(skillDistribution, 0, 1, initialSkill, initialSkill);
    return skillDistribution;
  }

  function getItemFromId(id) {
    return getItemFromName(idMap.get(id), id);
  }

  function addToProductionList() {
    productionList.push(this);
    var oldSkillDistribution = new Map(currentSkillDistribution);
    for (var pair of oldSkillDistribution) treeCalc(currentSkillDistribution, productionList.length - 1, pair[1], pair[0], pair[0]);
    updateRecipes();
    updateProductionListDiv();
    updateOutput();
  }

  function updateProductionListDiv() {
    function deleteFunction() {
      productionList.splice(this, 1);
      currentSkillDistribution = calculateSkillDistribution();
      updateRecipes();
      updateProductionListDiv();
      updateOutput();
    }

    var productionListDiv = document.getElementById("production-list");
    for (var i = productionListDiv.children.length - 1; 0 <= i; i--) productionListDiv.children[i].remove();
    for (var i = 0; i < productionList.length; i++) {
      var recipe = productionList[i];
      var newDiv = document.createElement("div");
      var quantity = document.createElement("span");
      quantity.innerText = recipe.creationQuantity + " × ";
      newDiv.appendChild(quantity);
      var link = document.createElement("a");
      link.rel = "item=" + recipe.creationId;
      link.href = "http://www.wowhead.com/item=" + recipe.creationId;
      link.innerText = "Loading...";
      newDiv.appendChild(link);
      var deleteX = document.createElement("span");
      deleteX.addEventListener("click", deleteFunction.bind(i));
      deleteX.className = "delete";
      newDiv.appendChild(deleteX);
      productionListDiv.appendChild(newDiv);
    }
    $WowheadPower.refreshLinks();
  }

  function updateOutput() {
    var previousTable = document.getElementById("output-table");
    if (previousTable) previousTable.remove()
    var table = document.createElement("table");
    table.id = "output-table"
    table.cellSpacing = "0";
    var header = document.createElement("tr");
    var skillHeader = document.createElement("th");
    skillHeader.innerText = "Skill";
    header.appendChild(skillHeader);
    var chanceHeader = document.createElement("th");
    chanceHeader.innerText = "Chance to be at this skill after production";
    header.appendChild(chanceHeader);
    table.appendChild(header);
    var accumChanceHeader = document.createElement("th");
    accumChanceHeader.innerText = "Chance to be at least at this skill after production";
    header.appendChild(accumChanceHeader);
    table.appendChild(header);
    var accumChance = 0;
    currentSkillDistribution = new Map([...currentSkillDistribution.entries()].sort((a, b) => b[0] - a[0]));
    for (var pair of currentSkillDistribution) {
      var chance = pair[1];
      if (0 < chance) {
        var row = document.createElement("tr");
        var skillTD = document.createElement("td");
        skillTD.innerText = pair[0];
        row.appendChild(skillTD);
        var chanceTD = document.createElement("td");
        chanceTD.innerText = toFixed(pair[1] * 100) + '%';
        row.appendChild(chanceTD);
        var accumChanceTD = document.createElement("td");
        accumChance = accumChance + pair[1];
        accumChanceTD.innerText = toFixed(accumChance * 100) + '%';
        row.appendChild(accumChanceTD);
        table.appendChild(row);
        previousRow = row;
      }
    }
    document.getElementById("output").appendChild(table);
  }

  function onSelectHandler(profession, select) {
    if (select.value === profession.name) {
      selectProfession(profession)
    }
  }

  function selectProfession(profession) {
    currentProfession = profession;
    productionList = [];
    document.getElementById("initial-skill").value = profession.skill;
    currentSkillDistribution = calculateSkillDistribution();
    updateRecipes();
    updateOutput();
  }

  Item.prototype.getItemFromName = getItemFromName;
  Item.prototype.updateOwnedItems = updateOwnedItems;
  var filteredItemsData = itemsData.sort((a, b) => a.id - b.id).filter((a, i, array) => i === 0 || a.id !== array[i - 1].id && isFinite(a.id));
  var itemNames = filteredItemsData.map(a => a.name).sort().filter((a, i, array) => i === 0 || a !== array[i - 1]);
  var idMap = new Map(new Map(filteredItemsData.map(a => [parseInt(a.id), a.name])));
  nameMap = new Map();
  for (var a of filteredItemsData) {
    nameMap.set(a.name, [...(nameMap.get(a.name) || []), new Item(parseInt(a.id), a.name)]);
  }
  var professions = [
    new Profession('Alchemy', alchemy, addToProductionList, onSelectHandler),
    new Profession('Blacksmithing', blacksmithing, addToProductionList, onSelectHandler),
    new Profession('Cooking', cooking, addToProductionList, onSelectHandler),
    new Profession('Enchanting', enchanting, addToProductionList, onSelectHandler),
    new Profession('Engineering', engineering, addToProductionList, onSelectHandler),
    new Profession('First aid', firstAid, addToProductionList, onSelectHandler),
    new Profession('Inscription', inscription, addToProductionList, onSelectHandler),
    new Profession('Jewelcrafting', jewelcrafting, addToProductionList, onSelectHandler),
    new Profession('Leatherworking', leatherworking, addToProductionList, onSelectHandler),
    new Profession('Mining', mining, addToProductionList, onSelectHandler),
    new Profession('Tailoring', tailoring, addToProductionList, onSelectHandler)
  ];
  var recipes = [];
  var currentProfession;
  selectProfession(professions[0]);
  var productionList = [];
  var currentSkillDistribution = calculateSkillDistribution();
  for (var profession of professions) {
    recipes = [...recipes, ...profession.recipes];
  }
  $('#add').autocomplete({
    source: function(request, response) {
      var results = $.ui.autocomplete.filter(itemNames, request.term);
      response(results.slice(0, 20));
    },
    select: (event, ui) => {
      if (ui) {
        var name = ui.item.value;
        var object = getItemFromName(name, false);
        object.quantity++;
        localStorage.setItem(object.id, object.quantity);
        updateOwnedItems(name);
        document.getElementById("add").value = "";
        return false;
      }
    }
  });
  for (var name of itemNames) {
    updateOwnedItems(name, false);
  }
  document.getElementById("initial-skill").addEventListener("change", function() {
    currentProfession.skill = this.valueAsNumber;
    currentSkillDistribution = calculateSkillDistribution();
    updateRecipes();
    updateOutput();
  });
  document.getElementById("produce-button").addEventListener("click", () => {
    do {
      currentProfession.skill = parseInt(prompt("How many skill points do have after producing those items?"));
    } while (!isFinite(currentProfession.skill) && currentSkillDistribution.get(currentProfession.skill));
    document.getElementById("initial-skill").value = currentProfession.skill;
    for (var recipe of productionList) {
      var item = getItemFromId(recipe.creationId);
      localStorage.setItem(item.id, item.quantity + recipe.creationQuantity);
      updateOwnedItems(item.name, false);
      for (var reagentId in recipe.reagents) {
        var item = getItemFromId(parseInt(reagentId));
        localStorage.setItem(item.id, item.quantity - recipe.reagents[reagentId]);
        updateOwnedItems(item.name, false);
      }
    }
    productionList = [];
    currentSkillDistribution = calculateSkillDistribution();
    updateRecipes();
    updateOutput();
  });
  updateRecipes();
  updateOutput();
});