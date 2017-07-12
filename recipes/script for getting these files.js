var array = [];
for (var recipe of g_listviews.recipes.data) {
  var object = {
    creationId: recipe.creates[0],
    creationQuantity: recipe.creates[1],
    id: recipe.id,
    name: recipe.__tr.children[2].innerText,
    reagents: {},
    orange: recipe.colors[0],
    yellow: recipe.colors[1],
    gray: recipe.colors[3]
  };
  for (var reagent of recipe.reagents) object.reagents[reagent[0]] = reagent[1];
  array.push(object);
}
JSON.stringify(array);