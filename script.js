function toFixed(number) {
  number = number.toFixed(Math.max(Math.floor(-Math.log10(number) + 2), 2));
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
    for (var i = 1; i < recipes.length; i++) {
      recipes[i].style.display = "none";
    }
    var i = 0;
    for (var recipe of currentProfession.recipes) {
      if (recipe.craftable(productionList, productionList.length, getItemFromId)) {
        var element = recipe.element;
        element.style.display = "";
        recipe.avgChanceTD.innerText = recipe.averageChanceToLevelUp(currentSkillDistribution);
        if (i % 2) element.className = "even-row";
        else element.className = "";
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
    var productionList = document.getElementById("production-list");
    var newDiv = document.createElement("div");
    var link;
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
    var even = false;
    for (var pair of currentSkillDistribution) {
      var chance = pair[1];
      if (chance) {
        var row = document.createElement("tr");
        var skillTD = document.createElement("td");
        skillTD.innerText = pair[0];
        row.appendChild(skillTD);
        var chanceTD = document.createElement("td");
        chanceTD.innerText = toFixed(pair[1] * 100) + '%';
        row.appendChild(chanceTD);
        if (even) row.className = "even-row";
        even = !even;
        table.appendChild(row);
      }
    }
    document.getElementById("output").appendChild(table);
  }

  function selectProfession(profession, select) {
    if (select.value === profession.name) {
      currentProfession = profession;
      productionList = [];
      currentSkillDistribution = calculateSkillDistribution();
      updateRecipes();
      updateOutput();
    }
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
    new Profession('Alchemy', alchemy, addToProductionList, selectProfession),
    new Profession('Cooking', cooking, addToProductionList, selectProfession)
  ];
  var recipes = [];
  var currentProfession = professions[0];
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
        localStorage.setItem(object.id, object.quantity)
        updateOwnedItems(name);
        document.getElementById("add").value = "";
        return false;
      }
    }
  });
  for (var name of itemNames) {
    updateOwnedItems(name, false);
  }
  updateRecipes();
  updateOutput();
});