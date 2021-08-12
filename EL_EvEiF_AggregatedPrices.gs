
Set.prototype.toJSON = function toJSON() {
  return [...Set.prototype.values.call(this)];
}


// ###############################################
// ################## PARAMETERS #################
// ###############################################

// default arguments values
default_blocking_get_retry_delay_ms = 10 * 1000;
default_blocking_get_max_retry = 5;
request_aggregator_default_hub = "jita+amarr";




// ###############################################
// ################## INTERNALS ##################
// ###############################################



// from https://stackoverflow.com/questions/1129216/sort-array-of-objects-by-string-property-value
sortArrayBy = function (array, p) {
  return array.slice(0).sort(function (a, b) {
    return (a[p] > b[p]) ? 1 : (a[p] < b[p]) ? -1 : 0;
  });
}


// ##### get_eveif_hub_prices ######

/* 
 * Main external API call
 * requested_items_by_trade_hub is of the form
 * {set(hub_name, ...) : set(item_id, ...)}
 */
function get_eveif_hub_prices(requested_items_by_trade_hub) {
  var res = [];
  for (hubs_list in requested_items_by_trade_hub) {
    var req_url = "https://eveif.fr/api/v1/hub_prices/" + hubs_list + "/" +  [... requested_items_by_trade_hub[hubs_list]].join("+");
    Logger.log("get_eveif_hub_prices : req_url = " + req_url);
    res = res.concat(JSON.parse(fetchUrl(req_url))["result"]);
  }
  return res;
}


// *** gcache ***
var gcache = CacheService.getScriptCache();





liic = new LocalItemInfoCache();


class RequestAggregator {
  constructor(trade_hub = request_aggregator_default_hub, blocking_get_retry_delay_ms = default_blocking_get_retry_delay_ms, blocking_get_max_retry = default_blocking_get_max_retry) {
    this.trade_hub = trade_hub;
    this.blocking_get_max_retry = blocking_get_max_retry;
    this.blocking_get_retry_delay_ms = blocking_get_retry_delay_ms;
    this.aggregator = new Aggregator(this.aggregatorCallback);
    this.MarketInfo = {
      TYPEID: "type_id",
      AVERAGE20LAST: "average20last",
      HIGHEST20LAST: "highest20last",
      LOWEST20LAST: "lowest20last",
      VOLUME20LAST: "volume20last",
      ORDERCOUNT20LAST: "order_count20last",
      SELL: "sell",
      BUY: "buy",
      HUB: "hub"
    };
  }
  tryGet(item_id, trade_hub) {
    //Logger.log("RequestAggregator : tryGet(item_id = " + item_id + ", trade_hub = " + trade_hub + ")");
    if (!item_id)
      return undefined;
    if (!trade_hub)
      return undefined;
    trade_hub = trade_hub.toLowerCase();
    var r = liic.get_cached_values(item_id, trade_hub);
    if (r){
      //Logger.log("RequestAggregator : tryGet(item_id = " + item_id + ", trade_hub = " + trade_hub + ") : found result !");
      return r;
    }
    this.aggregator.append_requested_item([item_id, trade_hub]);
    return undefined;
  };
  tryGetInfo(item_id, trade_hub, market_info) {
    r = this.tryGet();
    if (!r)
      return r;
    return r[market_info];
  };
  /*
  * @summary get high level market info from EvEiF. Does not direcly perform any web API call, stacks requests and resolves them multiple item at once.
  * @param {integer} item_id - the item id
  * @param {string[]} trade_hubs_list - the list of trade hub ids
  * @returns {Object} the item information returned by the EvEiF API
  */
  blockingGet(item_id, trade_hub) {
    for (var i = 0; i < this.blocking_get_max_retry; i++) {
      var r = this.tryGet(item_id, trade_hub);
      if (r)
        return r;
      Utilities.sleep(this.blocking_get_retry_delay_ms);
      //Logger.log("blockingGet(item_id = " + item_id + ", trade_hub = " + trade_hub + ") : retry");
    }
    this.aggregator.resolveBatch();
    return this.tryGet(item_id, trade_hub);
  };
  blockingGetInfo(item_id, trade_hub, market_info) {
    var r = this.blockingGet(item_id, trade_hub);
    if (!r)
      return r;
    return r[market_info];
  };
  /*
  * @summary triggers the request and forward response to item info cache for a {item:hubset, ...} object
  * @param {Object} requestedItemHubSet - an object representing the set of requested hubs for each requested item
  */
  aggregatorCallback(requestedItemHubSet) {
    // an itemhub is a [itemid, hubname]
    // hubs_by_item is a {itemid : Set(hubname, ...), ...}
    // items_by_hubset is a {set(hubname, ...) : set(itemid, ...)}
    // aggregate hubs list by item
    var hubs_by_item = {};
    for (var itemhub of requestedItemHubSet) {
      if (! (itemhub[0] in hubs_by_item) ){
        hubs_by_item[itemhub[0]] = new Set();
      }
      hubs_by_item[itemhub[0]].add(itemhub[1]);
    }
    // aggregate requested items by hub list
    var items_by_hubset = {};
    for (var item in hubs_by_item) {
      var hubs_set = hubs_by_item[item];
      var key = [... hubs_set].join("+");
      if (!  (key in items_by_hubset) )
        items_by_hubset[key] = new Set();
      items_by_hubset[key].add(item);
    }
    var res = get_eveif_hub_prices(items_by_hubset);
    // add to local cache
    liic.addList(res);
  };
}


rag = new RequestAggregator();


// ###############################################
// #################### TESTS ####################
// ###############################################

function EvEiF_AggregatedPrices_test() {

  //Logger.log(getEstimatedPriceFromEFT("[Eos, Simulated Eos Fitting]\nDrone Damage Amplifier II\nDrone Damage Amplifier II\nImperial Navy 1600mm Steel Plates\nDamage Control II\nTrue Sansha Explosive Armor Hardener\nDark Blood Multispectrum Energized Membrane\nMultispectrum Energized Membrane II\n\nPhased Scoped Target Painter\nRemote Sensor Booster II\nOmnidirectional Tracking Link II\n10MN Afterburner II\n\nArmor Command Burst II\nArmor Command Burst II\nCore Probe Launcher I\nDual 150mm Railgun II\nDual 150mm Railgun II\n\nMedium EM Armor Reinforcer II\nMedium Explosive Armor Reinforcer II\n\n\n\nWarrior II x5\nHammerhead II x5\nValkyrie II x5\nPraetor II x5\n\nJavelin M x558\nECCM Script x1\nSpike M x2400\nOptimal Range Script x1\nTracking Speed Script x1\nTargeting Range Script x1\nCaldari Navy Antimatter Charge M x1500\nArmor Reinforcement Charge x600\nScan Resolution Script x1\nWarp Scrambler II x1\nSensor Booster II x1\nStasis Webifier II x1\nWarp Disruptor II x1\nDrone Link Augmentor I x1\n\n"));



  Logger.log("Hello !")
  Utilities.sleep(1000);
  Logger.log("Sleeping World !")

  Logger.log(rag.tryGet(34317, "Jita", ));
  Logger.log(rag.tryGet(30466, "Jita"));
  Logger.log(rag.tryGet(30002, "Jita"));
  Logger.log(rag.tryGet(30466, "Amarr"));
  Logger.log(rag.tryGet(30002, "Amarr"));
  Logger.log(getMarketInfo(34317, "Jita", "sell"));
  Logger.log(getMarketInfo(30466, "Jita", "sell"));
  Logger.log(getMarketInfo(30002, "Jita", "sell"));
  Logger.log(getMarketInfo(30466, "Amarr", "sell"));
  Logger.log(getMarketInfo(30002, "Amarr", "sell"));

  //console.log("request : get20dHistAvgMarketPrice(34317, \"Jita\")")
  //console.log(get20dHistAvgMarketPrice(34317, "Jita"))
}
