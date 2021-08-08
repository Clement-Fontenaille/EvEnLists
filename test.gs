//lastActualisation 
//function onOpenPerso()
//{
//  ActuCell = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Prix").getRange(1,1);
//  ActuCell.setValue(ActuCell.getValue()+1);
//  ActuCell = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Prix").getRange(1,2);
//  ActuCell.setValue("=now()");
//}

function testCREST() {
  // Test PLEX in Dodixie
  var itemId = 44992;
  var regionId = 10000002;
  var stationId = 60003760;

  try {

    var price = getMarketPrice(itemId, regionId, stationId, "SELL");
    Logger.log(price)
    price = getMarketPrice(itemId, regionId, stationId, "BUY");
    Logger.log(price)

  } catch (e) {
    return false;
  }

  return true;
}