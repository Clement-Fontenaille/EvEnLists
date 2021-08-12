var Aggregator_default_max_retry = 5;
var Aggregator_default_retry_delay_ms = 5000;
var Aggregator_default_batch_limit = 20;

/*
   * @param {function} do_batch - callback function. called with a set of requested item when next batch is full or resolveBatch is called directly
   * @param {Number} batch_limit - maximum size of next batch
   */
class Aggregator {
  constructor(do_batch, batch_limit = Aggregator_default_batch_limit) {
    this.batch_limit = batch_limit;
    this.do_batch = do_batch;
    this.nextBatch = new Set();
  }
  resolveBatch(items_set) {
    var tmp = this.nextBatch;
    this.nextBatch = new Set();
    this.do_batch(tmp);
  }
  testSetSizeAndResolveBatch() {
    if (this.nextBatch.size > this.batch_limit) {
      this.resolveBatch();
    }
  }
  append_requested_item(item) {
    this.nextBatch.add(item);
    this.testSetSizeAndResolveBatch();
  }
  clear() {
    this.nextBatch = {};
  }
  toString() {
    var r = "Aggregator : {\n";
    r += "  nextBatch : (" + nextBatch.size() + " items)\n";
    for (item in nextBatch) {
      r += "    " + item + " : " + JSON.stringify(items[item]) + "\n";
    }
  }
}
