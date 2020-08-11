
var inventory_dump_table_name = "inventory dump"
var inventory_dump_table = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(inventory_dump_table_name);

// names of the sheets (tabs) in which we want to write numbers
var operations_types = {};
operations_types["site"] = "Sites";
operations_types["ore"] = "ORE";
operations_types["gas"] = "Gas";
operations_types["projets"] = "Materials Listings";

var operations_sheets = {};
operations_sheets["site"] = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(operations_types["site"]);
operations_sheets["ore"] = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(operations_types["site"]);
operations_sheets["gas"] = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(operations_types["gas"]);
operations_sheets["projets"] = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(operations_types["projets"]);
operations_sheets["prix"] = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Prix");

// names of named ranges in sheets we will be looking for the names of items tracked by the script
var items_range_names = {}
items_range_names["site"] = "items_sites";
items_range_names["ore"] = "items_ore";
items_range_names["gas"] = "items_gas";
items_range_names["projets"] = "items_projets";

var expand_item_list = {}
expand_item_list["site"] = false;
expand_item_list["ore"] = false;
expand_item_list["gas"] = false;
expand_item_list["projets"] = false;

// init range (actual collections of cells) based on named range names
// edit the corresponding named range in the sheet to update what items are tracked
var items_ranges = {};
for (var operation_type in operations_types){
  items_ranges[operation_type] = SpreadsheetApp.getActiveSpreadsheet().getRangeByName(items_range_names[operation_type]);
  Logger.log("getRangeByName : operation_type = " + operation_type + " : " + items_ranges[operation_type].getA1Notation());
}


// from https://stackoverflow.com/questions/20169217/how-to-write-isnumber-in-javascript
var isNumber = function isNumber(value) {
   return typeof value === 'number' && isFinite(value);
}

function get_submitted_items_collection(dump_range, op_id){
  var cnames = [ "Item Name", op_id ];
  var values_array = dump_range.getValues();
  for (var i in values_array){
    qty_input = values_array[i][1];
    if (isNumber(qty_input) || qty_input == "") { continue; }
    values_array[i][1] = Number(qty_input.replace(/\s|,/g,''));
  }
  return new ItemCollection_from_values_array( values_array, cnames );
}

function set_submitted_items_collection(dump_range, item_collection, op_id){
  Logger.log("set_submitted_items_collection : ");
  Logger.log("dump_range = " + dump_range.getA1Notation());
  Logger.log("item_collection = ");
  var cnames = [ "Item Name", op_id ];
  item_collection.log(cnames, "  ");
  dump_range.setValues(item_collection.asValues(cnames, dump_range.getNumRows(), dump_range.getNumColumns()));
}









function print_known_items(operation_type){
  Logger.log("   " + operation_type + " : ")
  Logger.log("Known items : ");
  var range = items_ranges[operation_type];
  for (var i = 1; i <= range.getHeight() ; i++){
    Logger.log(range.getCell(i,1).getDisplayValue());
  }
}

//for (var k in items_ranges){
//  print_known_items(k);
//}

function find_item_cell_in_range_first_row(item_name, range){
  for (var i = 1; i <= range.getHeight() ; i++){
    var cell = range.getCell(i,1);
    if (cell.getDisplayValue() == item_name)
      return cell;
  }
  return null;
}

function range_to_str(range){
  return "["+range.getColumn()+":"+range.getLastColumn()+"]["+range.getRow()+":"+range.getLastRow()+"]";
}




function add_tracked_item(item_name, items_range, tracked_itemslist){
  Logger.log("add_tracked_item : " + item_name + " in " + items_range.getA1Notation())
// find corresponding cell in tracked items list
  var new_item_cell = undefined;
  for (i = 0 ; i < tracked_itemslist.length ; i++){
    if ( tracked_itemslist[i] == "" || tracked_itemslist[i] == item_name){
      new_item_cell = items_range.offset(i, 0, 1);
      new_item_cell.setValue(item_name); // write in items list
      items_range.offset(i, 0, 1).setValue(item_name); // write in projects
      return new_item_cell;
    }
  }
  if ( new_item_cell == undefined ) {
    var n_new_rows = 10;
    items_ranges["projets"].getSheet().insertRowsBefore( items_ranges["projets"].getRow() + tracked_itemslist.length - 1, n_new_rows );
    tracked_itemslist = items_ranges[operation_type].getDisplayValues(); // refresh items_list, just to make sure
    return add_tracked_item(item_name, items_range, tracked_itemslist);
  }
  new_item_cell.setValue(item_name);
  
  // update price reference
}

// operation type shall be one of the keys of items_ranges, i.e : "site", "ore" or "gas"
function add_items_to_operation(items_dump_range, operation_type, operation_column){
  Logger.log("add_items_to_operation : items_dump_range="+range_to_str(items_dump_range)+", operation_type="+operation_type+", operation_column="+operation_column);
  var items_list = items_ranges[operation_type].getDisplayValues();
  var r = {}
  // for each item in dump range (~for each line with a non-blank first cell)
  for (var i = 1 ; i <= items_dump_range.getHeight() ; i++){
    var items_dump_cell = items_dump_range.getCell(i,1);
    // parse item name and quantity
    var item_name = items_dump_cell.getDisplayValue().trim();
    if (item_name == ""){
      continue;
    }
    // parse qty
    var items_dump_qty = items_dump_cell.offset(0,1).getDisplayValue();
    // remove spaces and comma as thoudands separators (item quantity is integer anyway)
    items_dump_qty = items_dump_qty.replace(/\s/g,"").replace(/,/g,"");
    // in eve, no quantity = 1, unless item name ends with x1000 or something
    if (items_dump_qty == ""){
      match = /x[0-9 ]+/.exec(item_name)
      if (match == null) items_dump_qty = 1;
      else {
        item_name = item_name.replace(/ x[0-9 ]+/, "").trim()
        items_dump_qty=parseInt(match[0].replace("x", ""));
      }
    }
    else items_dump_qty = parseInt(items_dump_qty);
    
    // find item in items list.
    var item_cell = undefined;
    Logger.log("looking for an item cell named " + item_name)
    for (var j = 0 ; j < items_list.length - 1 ; j ++){
      if ( items_list[j] == item_name ) item_cell = items_ranges[operation_type].offset(j, 0, 1);
    }
    if (item_cell == undefined){
      item_cell = add_tracked_item(item_name, items_ranges[operation_type], items_list);
      items_ranges[operation_type] = SpreadsheetApp.getActiveSpreadsheet().getRangeByName(items_range_names[operation_type]) // refresh range
      items_list = items_ranges[operation_type].getDisplayValues(); // refresh items_list, just to make sure
    }
    
    // the cell we want to write number into is on the same row as the matching cell, on the column offset by the number of the operation
    var item_qty_cell = item_cell.offset(0,operation_column);
    // get old quantity if it already exists, 0 otherwise
    var item_qty_before = 0;
    if (item_qty_cell.getDisplayValue() != "")item_qty_before = parseInt(item_qty_cell.getDisplayValue());
    // write back old value + dumped quantity
    item_qty_cell.setValue(item_qty_before + items_dump_qty);
    // construct a list of values for each parsed line. true if the item was succesfully matched and the qty was added to the corresponding line of the specified operation.
    // false otherwise (no change to the sheet have been made)
    r[i] = true;
    Logger.log("adding item " + item_name + " to operation done")
  }
  return r;
}

function check_op_is_empty(operation_type, op_column){
  Logger.log("check_op_is_empty : operation_type = " + operation_type)
  op_range = items_ranges[operation_type].offset(0,op_column);
  for (var i = 1 ; i <= op_range.getHeight() ; i++){
    var op_cell = op_range.getCell(i,1);
    if (op_cell.getDisplayValue() != "") return false;
  }
  return true;
}



function get_op_cnames(op_collection_ncolumns){
  var op_cnames = ["Item Name"];
  for (var i = 1 ; i < op_collection_ncolumns ; i ++) op_cnames.push(i);
  return op_cnames;
}
function get_op_collection(operation_type){
  var op_collection_row = items_ranges[operation_type].getRow();
  var op_collection_column = items_ranges[operation_type].getColumn();
  var op_collection_nrows = items_ranges[operation_type].getNumRows();
  var op_collection_ncolumns = operations_sheets[operation_type].getLastColumn() - op_collection_column;
  var op_collection_range = operations_sheets[operation_type].getRange(op_collection_row, op_collection_column, op_collection_nrows, op_collection_ncolumns);
  
  var values_array = op_collection_range.getDisplayValues();
  for (var i = 0 ; i < values_array.length ; i++){
    for (var j = 0 ; j < values_array[i].length ; j++){
      var numval = parseInt(values_array[i][j].replace(/\s|,|x/g, ""));
      if (!isNaN(numval)) values_array[i][j] = numval;
    }
  }

  var cnames = get_op_cnames(op_collection_ncolumns);
  var op_collection = new ItemCollection_from_values_array(values_array, cnames);
  return op_collection;
}
function set_op_collection(operation_type, collection){
  var op_collection_row = items_ranges[operation_type].getRow();
  var op_collection_column = items_ranges[operation_type].getColumn();
  var op_collection_nrows = items_ranges[operation_type].getNumRows();
  var op_collection_ncolumns = operations_sheets[operation_type].getLastColumn() - op_collection_column;
  var op_collection_range = operations_sheets[operation_type].getRange(op_collection_row, op_collection_column, op_collection_nrows, op_collection_ncolumns);
  var cnames = get_op_cnames(op_collection_ncolumns);
  var values_table = collection.asValues(cnames, op_collection_range.getNumRows(), op_collection_range.getNumColumns());
  op_collection_range.setValues(values_table);
}

function resize_op_items_list(operation_type, new_row_count){
  Logger.log("resize_op_items_list : new_row_count = " + new_row_count);
  var current_row_count = items_ranges[operation_type].getNumRows();
  if (new_row_count > current_row_count)
    operations_sheets[operation_type].insertRowsAfter(items_ranges[operation_type].getRow(), new_row_count - current_row_count);
  else if (new_row_count < current_row_count)
    operations_sheets[operation_type].deleteRows(items_ranges[operation_type].getRow(), current_row_count - new_row_count);
  items_ranges[operation_type] = SpreadsheetApp.getActiveSpreadsheet().getRangeByName(items_range_names[operation_type]);
}


// adds tracked items to operation
// returns the collection of items that have not been added, if expand_tracked_items is false
function add_collection_to_operation(dump_collection, operation_type = 'projets'){
  var op_collection = get_op_collection(operation_type);
  var op_collection_after = op_collection.deepcopy();
  op_collection_after.merge_add_collection(dump_collection);
  
  if (expand_item_list[operation_type] == false){
    op_collection_after.filter_collection(op_collection);
  }
  else {
    // resize if required
    resize_op_items_list(operation_type, op_collection_after.ItemEntry_array.length);
  }
  set_op_collection(operation_type, op_collection_after);
  var item_collection_added_to_op = dump_collection.deepcopy();
  item_collection_added_to_op.filter_collection(op_collection_after);
  var r = dump_collection.deepcopy();
  r.merge_sub_collection(item_collection_added_to_op);
  r.cleanup();
  return r;
}



function Submit_inventory_dump(){
  // INIT
  var max_items = inventory_dump_table.getRange(3,1).getDisplayValue();
  if (max_items == "") max_items = 200;
  else max_items = parseInt(max_items);

  var op_type = inventory_dump_table.getRange(3,2).getDisplayValue();

  var op_column = inventory_dump_table.getRange(3,3).getDisplayValue();
  if (op_column == ""){
    inventory_dump_table.getRange(3,3).setValue("1");
    op_column = 1;
  }
  else op_column = parseInt(op_column);
  
  var dump_range = inventory_dump_table.getRange(5,1,max_items,5);
  var submitted_item_collection = get_submitted_items_collection(dump_range, op_column);
  submitted_item_collection.cleanup();
  
  var ui = SpreadsheetApp.getUi();
  // check that op is clear and prompt user if not
  if (check_op_is_empty(op_type, op_column) == false){
    var msg = "mmmhh...\nlooks like operation " + op_column + " from the " + op_type + " operation table is not empty.\n Are you sure you want to add these items to the operation " + op_column + " ?";
    var response = ui.alert("This action requires confirmation :", msg, ui.ButtonSet.YES_NO);
    if (response == ui.Button.NO){
      return;
    }
  }

  // add items
  var result = add_collection_to_operation(submitted_item_collection, op_type);
  // old
  // var result = add_items_to_operation(dump_range, op_type, op_column);
  
  
  
  // delete and collapse lines for matched items.
  set_submitted_items_collection(dump_range, result, op_column);

  
  Logger.log("submitted_item_collection : ");
  submitted_item_collection.log(["Item Name", op_column], "  - ");
  Logger.log("result : ");
  result.log(["Item Name", op_column], "  - ");
  
  // report to user
  var nitems = submitted_item_collection.ItemEntry_array.length;
  var result_size = result.ItemEntry_array.length;
  var msg = "found " + submitted_item_collection.ItemEntry_array.length + " items.\n";
  if (result_size == 0) msg = msg + "all items were added to operation #" + op_column;
  else msg = msg + (nitems - result_size) + " items were added to operation #" + op_column + ", " + result_size + " items left.";
  var ui = SpreadsheetApp.getUi();
  ui.alert("inventory dump submited", msg, ui.ButtonSet.OK);
  
}


/**
 * Copies the list of items in projects to the price sheet
 */
function update_projects_items_prices(){
  var items_projet = items_ranges["projets"].getValues();
  Logger.log("update_projects_items_prices() : items_projet = " + items_projet);
  var new_item_list = update_tracked_items_list(items_projet);
}
  


function test(){
  // Submit_inventory_dump()
  update_projects_items_prices();
}


