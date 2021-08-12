// *** local cache ***
class LocalItemInfoCache {
  constructor() {
    this.cached_data_expiry = 6 * 60 * 60 * 1000; //6h
    this.cached_values = {};
  }


  get_gcache_key(item_id, hub_name) {
    return "iteminfo" + item_id + hub_name;
  };

  get_cached_values(item_id, hub_name) {
    // try from local
    if (item_id in this.cached_values && hub_name in this.cached_values[item_id]) {
      // delete cached info if too old
      if (this.cached_values[item_id][hub_name].date + this.cached_data_expiry < Date.now())
        delete this.cached_values[item_id][hub_name];
      else
        return this.cached_values[item_id][hub_name];
    }
    // try from gcache
    var gcache_key = this.get_gcache_key(item_id, hub_name);
    var from_gcache = gcache.get(gcache_key);
    if (from_gcache != null) {
      if (from_gcache.date + cached_data_expiry < Date.now()) {
        gcache.remove(gcache_key);
      }
      else {
        return from_gcache;
      }
    }
    return undefined;
  }

  get_cached_value(item_id, hub_name, key) {
    r = this.get_cached_values[item_id][hub_name];
    if (r != undefined)
      return r[key];
    return undefined;
  }

  add(item) {
    /*  {
    *    "type_id":36,
    *    "average20last":59.9775,
    *    "highest20last":61.48599999999999,
    *    "lowest20last":58.46199999999999,
    *    "volume20last":343031924.95,
    *    "order_count20last":1277.7,
    *    "sell":60.88,
    *    "buy":57.7,
    *    "hub":"jita"
    *  }
    */
    if (!item["type_id"] in this.cached_values) {
      this.cached_values[item["type_id"]] = {};
    }
    if (!item["hub"] in this.cached_values[item["type_id"]]) {
      this.cached_values[item["type_id"]][item["hub"]] = item;
      this.cached_values[item["type_id"]][item["hub"]].date = Date.now();
      gcache.put(this.get_gcache_key(item["type_id"], item["hub"]), item, 6 * 60 * 60);
    }
  }

  addList(list) {
    /*  [{
    *     "type_id":36,
    *     "average20last":59.9775,
    *     "highest20last":61.48599999999999,
    *     "lowest20last":58.46199999999999,
    *     "volume20last":343031924.95,
    *     "order_count20last":1277.7,
    *     "sell":60.88,
    *     "buy":57.7,
    *     "hub":"jita"
    *     },...
    *   ]
    */
    var gcache_key_values = {};
    for (var e of list) {
      if (! (e["type_id"] in this.cached_values)) {
        this.cached_values[e["type_id"]] = {};
      }
      if (! (e["hub"] in this.cached_values[e["type_id"]])) {
        this.cached_values[e["type_id"]][e["hub"]] = e;
        this.cached_values[e["type_id"]][e["hub"]].date = Date.now();
        gcache_key_values[this.get_gcache_key(e["type_id"], e["hub"])] = e;
      }
    }
    // add to gcache
    gcache.putAll(gcache_key_values, 6 * 60 * 60); // 6h is the max cache expiry
  }
};


