class Item {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.quantity = parseInt(localStorage.getItem(this.id)) || 0;
    this._input = null;
    this._element = null;
  }

  get element() {
    function onChange() {
      localStorage.setItem(self.id, input.value);
      self.updateOwnedItems(self.name);
    }

    if (this._element) return this._element;
    var self = this;
    var element = document.createElement("div");
    var input = document.createElement('input');
    var link = document.createElement('a');
    input.type = 'number';
    input.onchange = onChange;
    link.href = 'http://www.wowhead.com/item=' + this.id;
    link.rel = "item=" + this.id;
    link.innerText = 'Loading...';
    element.appendChild(input);
    element.appendChild(link);
    document.getElementById("owned-items").appendChild(element);
    element.style.display = "none";
    this._element = element;
    this._input = input;
    return element;
  }

  get input() {
    this.element; //creates this item's element if it doesn't exist
    return this._input;
  }
}