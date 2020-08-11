
key_column_name = "Item Name"

function blankifnull(value){
  if (!value) return "";
  return value;
}

// ### ItemEntry ###

// Main ItemEntry constructor and definitions
function ItemEntry(){
  Object.call(this);
  this.data = {};

  this.item_name = function(){
    return this.data[key_column_name]
  }
  
  // merge_add : 
  this.merge_add = function(item_entry){ 
    if (item_entry.item_name() === this.item_name()){
      for (const k in item_entry.data) {
        if (k == key_column_name) continue;
        if (this.data[k] == undefined) {
          this.data[k] = item_entry.data[k];
        }
        else this.data[k] += item_entry.data[k];
      }
    }
  }
  
  // merge_sub : 
  this.merge_sub = function(item_entry){
    if (item_entry.item_name() === this.item_name()){
      for (const k in item_entry.data) {
        if (k == key_column_name) continue;
        if (this.data[k] == undefined) {
          this.data[k] = -item_entry.data[k];
        }
        else this.data[k] -= item_entry.data[k];
      }
    }
  }
  
  // asValues : get as 1d array to be used with Range.setValues()
  this.asValues = function(columns_names_array = undefined, dim = undefined){
    if (columns_names_array === undefined){
      columns_names_array = Object.keys(this.data);
    }
    if (dim === undefined) dim = columns_names_array.length;
    var r = [];
    for (const k in columns_names_array){
    //   r.push(blankifnull(this.data[k]))
      r.push(this.data[k])
    }
    for (var i = 0 ; i < dim - columns_names_array.length ; i++){
      r.push('');
    }
    return r;
  }
  
  this.isEmpty = function(cnames){
    if (! cnames) cnames = Object.keys(this.data);
    for (var k in cnames){
      if (this.data[k]) return false;
    }
    return true;
  }

  this.deepcopy = function(aObject){
    if (!aObject) {
      return this.deepcopy(this);
    }
    var v;
    var bObject = Array.isArray(aObject) ? [] : {};
    for (var k in aObject) {
      v = aObject[k];
      bObject[k] = (typeof v === "object") ? this.deepcopy(v) : v;
    }
    return bObject;
  }

}

// helper ItemEntry constructor : from an array of values as acquired through Range.getValues()[i]
function ItemEntry_from_values(values_array, columns_names_array){
  ItemEntry.call(this);
  for (const i in columns_names_array){
    this.data[columns_names_array[i]] = values_array[i];
  }
}

