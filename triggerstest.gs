
var testlog_passed = false;
function testlog(){ Logger.log("test"); testlog_passed = true;}

function clear_triggers(){
  Logger.log("clearing all triggers")
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const triggers = ScriptApp.getUserTriggers(ss);
  Logger.log("found triggers : ")
  Logger.log(triggers)
  for (i in triggers){
    Logger.log("triggers[" + i + "]\n  " +
      "eventType : " + triggers[i].getEventType() + "\n  " +
      "handlerFunction : " + triggers[i].getHandlerFunction() + "\n  " +
      "triggerSource : " + triggers[i].getTriggerSource() + "\n  " +
      "getTriggerSourceId : " + triggers[i].getTriggerSourceId() + "\n  " +
      "getUniqueId : " + triggers[i].getUniqueId()
    );
    ScriptApp.deleteTrigger(triggers[i]);
  }
}

function TriggerTester(trigger_delay = 1000){
  this.values = [];
  this.trigger_delay = trigger_delay;
  this.target = function(){
    this.values.append(now);
    Logger.log("TriggerTester(" + trigger_delay + ") : target called");
    ScriptApp.newTrigger("TTester.target").timeBased().after(trigger_delay);
  }
  this.start_trigger = function(){
    Logger.log("TriggerTester(" + trigger_delay + ") : start_trigger called");
    ScriptApp.newTrigger("TTester.target").timeBased().after(trigger_delay);
  }
  this.start_trigger();
}
var TTester = new TriggerTester();
function get_trigger_tester_values(){ return TTester.values; }
function get_trigger_tester_last_value(){ return get_trigger_tester_values()[get_trigger_tester_values().length - 1]; }

