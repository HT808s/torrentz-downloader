"use strict";

// Rethink object needs connection info: [{host:'www.exemple.com', port:28015}]
module.exports = (rethinkDBServers) => {
   
    // Connection to the database
    const _pool = require('rethinkdbdash')({servers:rethinkDBServers});
    
    const watch_table = (table) => {
	return new Promise(function (fulfill, reject) {
	    _pool.table(table).changes().run().then((result) => {
		fulfill(result);
	    }).catch(reject);
	});
    };
    
    const drain = () => {
	return _pool.getPoolMaster().drain();
    };
    
    return {
	watch_table:watch_table,
	drain:drain
    };
};
