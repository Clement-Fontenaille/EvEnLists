// ### INTERNALS ###

// from https://stackoverflow.com/questions/1129216/sort-array-of-objects-by-string-property-value
sortArrayBy = function(array,p) {
  return array.slice(0).sort(function(a,b) {
    return (a[p] > b[p]) ? 1 : (a[p] < b[p]) ? -1 : 0;
  });
}

// *** local cache ***

function local_item_info_cache(){
  this.cached_data_expiry = 6 * 60 * 60 * 1000; //6h
  this.cached_values = {};
  
  this.get_key = function(item_id, hub_name, key){
    
    if (item_id in this.cached_values && hub_name in this.cached_values[item_id]){
      if (this.cached_values[item][hub_name].date + cached_data_expiry < now()){
        delete this.cached_values[item][hub_name];
      }
      else return this.cached_values[item][hub_name][key];
    }
    return undefined;
  }
  
  this.add = function(list){
    for (var i in list){
      var e = list[i];
      if (! e["type_id"] in this.cached_values){
        this.cached_values[e["type_id"]] = {}
      }
      if (! e["hub"] in this.cached_values[type_id]){
        this.cached_values[e["type_id"]][e["hub"]] = e
        this.cached_values[e["type_id"]][e["hub"]].date = now()
      }
    }
  }
  
  this.get_average_price = function(item_id, hub_name){
    Logger.log(this)
    return this.get_key(item_id, hub_name, "average20last");
  }.bind(this)
  this.get_buy_order_price = function(item_id, hub_name, is_buy_order = False){
    return this.get_key(item_id, hub_name, "buy");
  }.bind(this)
  this.get_sell_order_price = function(item_id, hub_name, is_buy_order = False){
    return this.get_key(item_id, hub_name, "sell");
  }.bind(this)
  this.get_market_volume = function(item_id, hub_name){
    return this.get_key(item_id, hub_name, "volume20last");
  }.bind(this)
    
    
}

liic = new local_item_info_cache();

// *** gcache ***
var gcache = CacheService.getScriptCache();

// *** request_aggregator ***

// default arguments values
request_aggregator_default_buffering_time = 10*1000; // 10sec in ms
request_aggregator_default_hub = "jita+amarr";

function request_aggregator(trade_hub = request_aggregator_default_hub, buffering_time = request_aggregator_default_buffering_time){
  this.trade_hub = trade_hub
  this.buffering_time = buffering_time
  this.requested = {};
  this.exec_pending = false;
  
  this.append_request = function(item_id, trade_hubs_list)
  {
    if (!this.exec_pending)
    {
      this.exec_pending = true;
      setTimeout( this.execute_request, buffering_time );
    }
    if (item_id in requested){
      requested[item_id].hubs_list = Array(Set( trade_hubs_list.concat(requested[item_id].hubs_list.split("+")) )).sort().join("+");
    }
    else {
      requested[item_id].hubs_list = Array(Set( trade_hubs_list )).sort().join("+");
    }
  }
  
  this.execute_request = function(){
    // create a local copy of requested and reset it
    req = this.requested;
    this.requested = {}
    this.exec_pending = false;
    //https://eveif.fr/api/v1/hub_prices/jita+amarr/36+42
    
    // aggregate requested items by hub list
    var req_by_hubs = {}
    for (item_id in req){
      if (! req[item_id] in req_by_hubs)
        req_by_hubs[req[item_id]] = [];
      req_by_hubs[req[item_id]].append(item_id);
    }
    var res = [];
    for (hubs_list in req_by_hubs){
      var req_url = "https://eveif.fr/api/v1/hub_prices/" + hubs_list + "/" + req_by_hubs[hubs_list].join("+");
      res = res.concat(json.parse(fetchUrl(req_url))["result"]);
    }

    // add to local cache
    liic.add(res);
    // add to gcache
    gcache_key_values = {};
    for (i in res){
      e = res[i];
      gcache_key = "request_aggregator" + e["type_id"].toString() + e["hub"];
      gcache_key_values[gcache_key] = json.stringify(e);
    }
    gcache.putAll(gcache_key_values, 6*60*60); // 6h is the max cache expiry
    
    
/*
    var res_per_req = res.length / requested.length();
    for (var i = 0 ; i < requested.length() ; i ++){
      var cb_arg = [];
      for (var j = 0 ; j < res_per_req ; j ++){
        cb_arg.append(res[i*res_per_req + j]);
      }
    }
*/
  }
}

rag = new request_aggregator();

// ### API ###
// getters

function blocking_get(item_id, trade_hub, local_cache_getter){
  if (! item_id) return undefined;
  if (! trade_hub) return undefined;
  const max_retry = 20;
  for (var i = 0 ; i < max_retry ; i ++){
    console.log("blocking_get : item_id = " + item_id + ", trade_hub = " + trade_hub + ", local_cache_getter = " + local_cache_getter + ", i = " + i)
    r = local_cache_getter(item_id, trade_hub);
    if (r != undefined) return r;
    rag.append_request(item_id, trade_hub)
    sleep(rag.buffering_time);
  }
  return undefined;
}


function get20dHistAvgMarketPrice(item_id, trade_hub){
  return blocking_get(item_id, trade_hub, liic.get_average_price);
}

function getBuyOrderMarketPrice(item_id, trade_hub){
  return blocking_get(item_id, trade_hub, liic.get_buy_order_price);
}

function getSellOrderMarketPrice(item_id, trade_hub){
  return blocking_get(item_id, trade_hub, liic.get_sell_order_price);
}

function get20dHistMarketVolume(item_id, trade_hub){
  return blocking_get(item_id, trade_hub, liic.get_market_volume);
}

// ### TEST ###

function mysettimeout(ms) {
  return new Promise(function(resolve, reject){ console.log("mysettimeout : sleeping for " + ms + " ms"); utilities.sleep(ms); console.log("done sleeping"); resolve(); });
}

function test(){

    Logger.log(getEstimatedPriceFromEFT("[Eos, Simulated Eos Fitting]\nDrone Damage Amplifier II\nDrone Damage Amplifier II\nImperial Navy 1600mm Steel Plates\nDamage Control II\nTrue Sansha Explosive Armor Hardener\nDark Blood Multispectrum Energized Membrane\nMultispectrum Energized Membrane II\n\nPhased Scoped Target Painter\nRemote Sensor Booster II\nOmnidirectional Tracking Link II\n10MN Afterburner II\n\nArmor Command Burst II\nArmor Command Burst II\nCore Probe Launcher I\nDual 150mm Railgun II\nDual 150mm Railgun II\n\nMedium EM Armor Reinforcer II\nMedium Explosive Armor Reinforcer II\n\n\n\nWarrior II x5\nHammerhead II x5\nValkyrie II x5\nPraetor II x5\n\nJavelin M x558\nECCM Script x1\nSpike M x2400\nOptimal Range Script x1\nTracking Speed Script x1\nTargeting Range Script x1\nCaldari Navy Antimatter Charge M x1500\nArmor Reinforcement Charge x600\nScan Resolution Script x1\nWarp Scrambler II x1\nSensor Booster II x1\nStasis Webifier II x1\nWarp Disruptor II x1\nDrone Link Augmentor I x1\n\n"));

  
  console.log("Hello !")
  Utilities.sleep(1000);
  console.log("Sleeping World !")
  
  console.log("request : get20dHistAvgMarketPrice(34317, \"Jita\")")
  console.log(get20dHistAvgMarketPrice(34317, "Jita"))
}
