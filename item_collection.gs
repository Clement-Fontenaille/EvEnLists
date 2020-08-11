
function tab_print(tab, prefix = ""){
  if (tab === undefined){
    Logger.log(prefix + "undefined");
    return;
  }
  var str = prefix + "[";
  if (tab.length > 0) str += tab[0];
  for (var i = 1 ; i < tab.length ; i ++)
    str += ", " + tab[i];
  str += "]";
  Logger.log(str);
}

function tab_print_2d(tab, prefix = ""){
  for (var i in tab) tab_print(tab[i], prefix);
}



// ### ItemCollection ###


// Main ItemCollection constructor and definitions
function ItemCollection() {
  this.ItemEntry_array = [];
  this.lookup_table = new Object();

  // add : 
  // merge add operations adds values for items that are already referenced in collection.
  // non-merge add operations appends item at the end of the list (allowing to append an empty line for example)

  this.add_item = function(item_entry){
    ItemEntry_array.push(item_entry.deepcopy())
    this.lookup_table[item_entry.item_name()] = this.ItemEntry_array.length -1;
  }
  this.merge_add_item = function(item_entry){
    if (this.lookup_table[item_entry.item_name()] == undefined){
      this.ItemEntry_array.push(item_entry.deepcopy());
      this.lookup_table[item_entry.item_name()] = this.ItemEntry_array.length -1;
    }
    else {
      this.ItemEntry_array[this.lookup_table[item_entry.item_name()]].merge_add(item_entry);
    }
  }

  // add_array : 
  this.add_array = function(ItemEntry_array){
    for (const i in ItemEntry_array) { this.add_item(ItemEntry_array[i]); };
  }
  this.merge_add_array = function(ItemEntry_array){
    for (const i in ItemEntry_array) { this.merge_add_item(ItemEntry_array[i]); };
  }

  // add_collection : 
  this.add_collection = function(item_collection){
    this.add_array(item_collection.ItemEntry_array); 
  }
  this.merge_add_collection = function(item_collection){
    this.merge_add_array(item_collection.ItemEntry_array); 
  }
  // merge_sub_item : 
  this.merge_sub_item = function(item_entry){
    if (this.lookup_table[item_entry.item_name()] == undefined){
      this.ItemEntry_array.push(item_entry.deepcopy());
      this.lookup_table[item_entry.item_name()] = this.ItemEntry_array.length -1;
    }
    else {
      this.ItemEntry_array[this.lookup_table[item_entry.item_name()]].merge_sub(item_entry);
    }
  }

  // merge_sub_array : 
  this.merge_sub_array = function(ItemEntry_array){
    for (const i in ItemEntry_array) { this.merge_sub_item(ItemEntry_array[i]); };
  }

  // merge_sub_collection : 
  this.merge_sub_collection = function(item_collection){
    this.merge_sub_array(item_collection.ItemEntry_array); 
  }
  
  // asValues : get as 2d array to be used with Range.setValues()
  this.asValues = function(columns_names_array, dimrows, dimcols){
    if (dimrows === undefined) dimrows = this.ItemEntry_array.length;
    if (dimcols === undefined) {
      if (columns_names_array == undefined){
        dimcols = 0;
        
        for (var i = 0 ; i < this.ItemEntry_array.length ; i ++)
          dimcols = Math.max(dimcols, Object.keys(this.ItemEntry_array[i].data).length);
      }
      else dimcols = columns_names_array.length;
    }
    var r = [];
    for (var i = 0 ; i < dimrows ; i ++){
      if (i < this.ItemEntry_array.length){
        
        r.push(this.ItemEntry_array[i].asValues(columns_names_array, dimcols));
      }
      else {
        var row = [];
        for (var j = 0 ; j < dimcols ; j++) row.push("");
        r.push(row);
      }
    }
    return r;
  }
  
  // removes from the list
  this.filter_array = function(ItemEntry_array){
    var i = 0;
    while (i < this.ItemEntry_array.length){
      var remove_flag = true;
      for (j in ItemEntry_array){
        if (this.ItemEntry_array[i].data[key_column_name] == ItemEntry_array[j].data[key_column_name]){
          remove_flag = false;
          break;
        }
      }
      if (remove_flag){
        delete this.lookup_table[this.ItemEntry_array[i].data[key_column_name]];
        this.ItemEntry_array.splice(i,1);
      }
      else i++;
    }
  }
  this.filter_collection = function(item_collection){
    this.filter_array(item_collection.ItemEntry_array);
  }
  
  this.cleanup = function(cnames = undefined){
    var i = 0;
    while (i < this.ItemEntry_array.length){
      if (this.ItemEntry_array[i].isEmpty(cnames)){
        this.ItemEntry_array.splice(i,1);
      }
      else{
        i++;
      }
    }
    this.lookup_table = new Object();
    for (i = 0 ; i < this.ItemEntry_array.length ; i++){
      this.lookup_table[this.ItemEntry_array[i].data[key_column_name]] = i;
    }
  }

  this.deepcopy = function(aObject){
    if (!aObject) {
      return this.deepcopy(this);
    }
    var bObject = Array.isArray(aObject) ? [] : {};
    for (var k in aObject) {
      var v = aObject[k];
      bObject[k] = (typeof v === "object") ? this.deepcopy(v) : v;
    }
    return bObject;
  }
  this.log = function(cnames, prefix=""){
    if (this.ItemEntry_array.length == 0){
      Logger.log(prefix + "empty collection");
      return;
    }
    tab_print(cnames, prefix);
    tab_print_2d(this.asValues(cnames), prefix);
  }
}


// helper ItemCollection constructor : from an array of item entries
function ItemCollection_from_items_array(ItemEntry_array = []) {
  ItemCollection.call(this); // call base constructor
  this.merge_add_array(ItemEntry_array);
}

// helper ItemCollection constructor : from an array of values as acquired through Range.getValues()
function ItemCollection_from_values_array(values_2d_array , columns_names_array) {
  var ItemEntry_array = [];
  for (const i in values_2d_array){
    ItemEntry_array.push(new ItemEntry_from_values(values_2d_array[i], columns_names_array));
  }
  ItemCollection_from_items_array.call(this, ItemEntry_array);
}



// ### test ###


function test(){
  Logger.log("test : ");
  
  var cnames = [key_column_name, "1", "2", "3"];
  var vals1 =  ["item1", 1, 2, 3];
  var vals2 =  ["item2", 2, 2, 0];
  var vals3 =  ["item3", 2, 0, -1];
  var vals4 =  ["item2", 2, 100, 0];
  var vals5 =  ["item4", 0, 0, 15];
  
  var i1 = new ItemEntry_from_values(vals1, cnames);
  Logger.log("  - i1 created : ");
  Logger.log("  i1.asValues = " + i1.asValues(cnames));
  Logger.log("  i1 = " + i1);
  for (const k in i1){ Logger.log("    -> " + k + " : " + i1[k]); }
  Logger.log("  i1.data : "}
  for (const k in i1.data){ Logger.log("     -> \"" + k + "\" : " + i1.data[k]); }
  
  var valsa = [vals1, vals2, vals3];
  var c1 = new ItemCollection_from_values_array(valsa, cnames);
  Logger.log("  -- c1 -- (with cnames)");
  c1.log(cnames, "  ");
  Logger.log("  -- c1 -- (without cnames)");
  c1.log(undefined, "  ");
  
  var c2 = new ItemCollection_from_values_array([vals4, vals5], cnames);
  Logger.log("  -- c2 -- ");
  c2.log(cnames, "  ");
  
  var c3 = c1.deepcopy();
  c3.merge_add_collection(c2);
  Logger.log("  -- c3 -- ");
  c3.log(cnames, "  ");

  var c4 = c3.deepcopy();
  c4.merge_sub_collection(c2);
  Logger.log("  -- c4 -- ");
  c4.log(cnames, "  ");
  c4.cleanup();
  Logger.log("  -- c4 -- (cleaned up)");
  c4.log(cnames, "  ");
  c4.cleanup([key_column_name, 3]);
  Logger.log("  -- c4 -- (cleaned up using cnames [key_column_name, 3])");
  c4.log(cnames, "  ");
  
  var c5 = c3.deepcopy();
  c5.filter_collection(c2);
  Logger.log("  -- c5 -- ");
  c5.log(cnames, "  ");
  
}