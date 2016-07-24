let chai = require('chai'),
    path = require('path');

chai.should();

/* *** RethinkDB *** */

function rethinkConf() {
    const torrentDownloader = require(path.join(__dirname, '..', 'downloader.js'))();
    const rethink = torrentDownloader.rethink([{host:'localhost', port:28015}]);
    const databaseTimetout = 2600;
    const testTable = 'tests';
    const r = require('rethinkdbdash')();

    return {
	rethink:rethink,
	databaseTimetout:databaseTimetout,
	testTable:testTable,
	r:r
    };
}

function insertData(r, testTable) {
    const test_magnet = 'magnet:?xt=urn:btih:8803dbbb3c5c39472ef3b818a6c18fc491cd9788&dn=The+Art+of+People+-+11+Simple+People+Skills+That+Will+Get+You+Everything+You+Want+%282016%29.epub+Gooner&tr=http%3A%2F%2Ftracker.trackerfix.com%3A80%2Fannounce&tr=udp%3A%2F%2F9.rarbg.me%3A2710&tr=udp%3A%2F%2F9.rarbg.to%3A2710';
    return r.db('test').table(testTable)
	.insert({magnet_link:test_magnet})
	.run();
}

// Create table if does not exist
// Insert a data in the table to trigger the changes
function createTable(r, testTable, exec) {
    r.db('test').tableList().contains(testTable).run().then((result) => {
	if (result) {
	    exec();
	    insertData(r, testTable).then(() => {
		r.getPoolMaster().drain();
	    });
	}
	else {
	    r.db('test').tableCreate(testTable).run().then(() => {
		exec();
		insertData(r, testTable).then(() => {
		    r.getPoolMaster().drain();
		});
	    });
	}
    });
}

describe('rethink', () => {
    describe('#watch_table', () => {
	const conf = rethinkConf();
	it('should return the changes in the database table', function(done) {
	    this.timeout(conf.databaseTimetout);
	    createTable(conf.r, conf.testTable, () => {
		conf.rethink.watch_table(conf.testTable).then((result) => {
		    conf.rethink.drain();
		    done();
		}).catch((e) => {
		    conf.rethink.drain();
		    done(e);
		});
	    });
	});
	
	it('should throw an error', (done) => {
	    const conf = rethinkConf();
	    conf.rethink.watch_table('foo').catch((e) => {
		conf.rethink.drain();
		done();
	    });
	});

	it('should drain the pool', (done) => {
	    const conf = rethinkConf();
	    conf.rethink.drain().then(() => {
		done();
	    });	    
	});
	
    });
});
