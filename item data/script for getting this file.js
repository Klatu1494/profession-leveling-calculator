var array = [];
for (var id in g_items) {
  var item = g_items[id];
  if (item.attainable === 0) array.push({
    id: id,
    name: item.name_enus
  });
}
JSON.stringify(array);