// ######################################################
// ############### EvEiF Aggregated Prices ##############
// ######################################################

// ####################### getters ######################

function getMarketInfoAverage20last(item_id, trade_hub) {
  return getMarketInfo(item_id, trade_hub, rag.MarketInfo.AVERAGE20LAST);
}
function getMarketInfoHighest20last(item_id, trade_hub) {
  return getMarketInfo(item_id, trade_hub, rag.MarketInfo.HIGHEST20LAST);
}
function getMarketInfoLowest20last(item_id, trade_hub) {
  return getMarketInfo(item_id, trade_hub, rag.MarketInfo.LOWEST20LAST);
}
function getMarketInfoVolume20last(item_id, trade_hub) {
  return getMarketInfo(item_id, trade_hub, rag.MarketInfo.VOLUME20LAST);
}
function getMarketInfoOrder_count20last(item_id, trade_hub) {
  return getMarketInfo(item_id, trade_hub, rag.MarketInfo.ORDERCOUNT20LAST);
}
function getMarketInfoSell(item_id, trade_hub) {
  return getMarketInfo(item_id, trade_hub, rag.MarketInfo.SELL);
}
function getMarketInfoBuy(item_id, trade_hub) {
  return getMarketInfo(item_id, trade_hub, rag.MarketInfo.BUY);
}
function getMarketInfo(item_id, trade_hub, key) {
  return rag.blockingGetInfo(item_id, trade_hub, key);
}
