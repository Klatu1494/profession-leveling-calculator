class Profession {
  constructor(name, recipes, addFunction, onSelectHandler) {
    if (typeof name === "string" && typeof addFunction === "function") {
      var self = this;
      var select = document.getElementById("profession");
      var option = document.createElement("option");
      option.innerText = name;
      select.appendChild(option);
      this.name = name;
      this.recipes = new Set();
      this.skill = 1;
      select.addEventListener("change", function() {
        onSelectHandler(self, this);
      });
      for (var recipe of recipes) this.recipes.add(new Recipe(this, recipe, addFunction));
    } else throw new Error();
  }
}