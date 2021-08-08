var item_db_sheet_name = "item_db"
var item_db_sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(item_db_sheet_name);

var item_id_offset = 1;

var item_db_header_size = 6;

function get_tracked_items_range(range_heigth, range_width) {
  if (range_width == undefined) range_width = 1
  if (range_heigth === undefined) range_heigth = Math.max(1, item_db_sheet.getLastRow())
  var r = item_db_sheet.getRange(1 + item_db_header_size, 1, range_heigth, range_width);
  Logger.log("get_tracked_items_range(" + range_heigth + ", " + range_width + ") : returning " + r + "(" + r.getA1Notation() + ")");
  return r
}

function get_tracked_items_list() {
  var r = get_tracked_items_range().getValues().map(function (a) { return a[0]; });
  Logger.log("get_tracked_items_list : returning r.length = " + r.length + " : " + r);
  return r;
}

function get_tracked_items_id_range(range_size) {
  var r = get_tracked_items_range(range_size).offset(0, item_id_offset);
  Logger.log("get_tracked_items_id_range : returning " + r + "(" + r.getA1Notation() + ")");
  return r;
}

function get_tracked_items_id_list() {
  var r = get_tracked_items_id_range().getValues().map(function (a) { return a[0]; });
  Logger.log("get_tracked_items_id_list : returning r.length = " + r.length + " : " + r);
  return r;
}

/**
 * resize_item_db
 * adds or remove rows in item_db sheet to match requested size + 20
 */

function resize_item_db(target_size) {
  if (target_size == undefined || target_size == 0) target_size = 1;
  target_size += 20;
  var current_size = item_db_sheet.getMaxRows() - item_db_header_size;
  // add or remove rows so that there always is at least 2 empty rows at the end
  var n_rows_diff = target_size - current_size;
  if (n_rows_diff > 0) {
    Logger.log("resize_item_db : resizing from current_size = " + current_size + " to target_size = " + target_size)
    item_db_sheet.insertRowsAfter(current_size - 1, n_rows_diff);
  }
  if (n_rows_diff < 0) {
    Logger.log("resize_item_db : resizing from current_size = " + current_size + " to target_size = " + target_size)
    item_db_sheet.deleteRows(target_size, -n_rows_diff);
  }
}


/**
 * get_item_id_from_name
 * using the esi search endpoint
 * cached 1 week
 */
function get_item_id_from_name(itemName, refresh) {
  if (itemName == "" || itemName.startsWith("-")) return "";
  var dataKey = itemName + 'item_id';
  var cached_item_id = gdoc_cache_instance.get(dataKey);
  if (refresh || cached_item_id == null) {
    var url_name = "https://esi.evetech.net/latest/search/?categories=inventory_type&datasource=tranquility&language=en-us&search=" + encodeURIComponent(itemName) + "&strict=true";
    var item_search_result = JSON.parse(fetchUrl(url_name));
    cached_item_id = item_search_result["inventory_type"];
    var oneWeek = 60 * 60 * 24 * 7; //in seconds
    gdoc_cache_instance.put(dataKey, cached_item_id, oneWeek);
  }
  return cached_item_id
}

/**
 * get_item_volume_from_id
 * using the esi search endpoint
 * cached 1 week
 */
function get_item_volume_from_id(itemId, refresh) {
  if (itemId == undefined || itemId == 0) return undefined;
  var dataKey = itemId + 'item_volume';
  var cached_item_volume = gdoc_cache_instance.get(dataKey);
  if (refresh || cached_item_volume == null) {
    url_name = "https://esi.evetech.net/latest/universe/types/" + itemId + "/?datasource=tranquility&language=en-us"
    var item_search_result = JSON.parse(fetchUrl(url_name));
    cached_item_volume = item_search_result["packaged_volume"]
    var oneWeek = 60 * 60 * 24 * 7; //in seconds
    gdoc_cache_instance.put(dataKey, cached_item_volume, oneWeek);
  }
  return Number(cached_item_volume)
}



// from https://stackoverflow.com/questions/7486085/copy-array-by-value
function array_deepcopy(aObject) {
  if (!aObject) {
    return aObject;
  }
  var v;
  var bObject = Array.isArray(aObject) ? [] : {};
  for (var k in aObject) {
    v = aObject[k];
    bObject[k] = (typeof v === "object") ? copy(v) : v;
  }
  return bObject;
}

/**
 * update_tracked_items
 * merges the list of items in items_db with the supplied list of items and writes it back, expanding sheet as necessary
 * default reads from items_ranges["projets"] from indenvoty_dump script file
 */
function update_tracked_items_list() {
  update_tracked_items_from_range(items_ranges["projets"]);
}
function update_tracked_items_from_range(range) {
  Logger.log("update_tracked_items_from_range(range = " + range.getA1Notation() + ") : ")
  var items_to_add = range.getValues().map(function (a) { return a[0]; });
  return update_tracked_items_from_list(items_to_add);
}
// read the given range and add values
function update_tracked_items_from_list(items_to_add) {
  Logger.log("update_tracked_items_list : items_to_add = " + items_to_add);

  var old_items = get_tracked_items_list();
  Logger.log("old_items = " + old_items)

  var new_item_list = [...new Set(old_items.concat(items_to_add))].sort() // make sorted list of unique items in old_items and items_to_add
  Logger.log("update_tracked_items_list : new_item_list.length = " + new_item_list.length);
  Logger.log("new_item_list = " + new_item_list)

  resize_item_db(new_item_list.length);

  get_tracked_items_range(new_item_list.length).setValues(new_item_list.map(function (a) { return [a]; }))

}

