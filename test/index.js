var assert = require('assert');
var should = require('should');
var r = require('rethinkdb');

var index = require('../index.js');

// describe('Array', function() {
//     describe('#indexOf()', function() {
// 	it('should return -1 when the value is not present', function() {
// 	    [1,2,3].indexOf(5).should.equal(-1);
// 	    [1,2,3].indexOf(0).should.equal(-1);
// 	});
//     });
// });

// describe('User', function() {
//     describe('#save()', function() {
// 	it('should save without error', function(done) {
// 	    var user = new User('Luna');
// 	    user.save(function(err) {
// 		if (err) throw err;
// 		done();
// 	    });
// 	});
//     });
// });

// describe('User', function() {
//     describe('#save()', function() {
// 	it('should save without error', function(done) {
// 	    var user = new User('Luna');
// 	    user.save(done);
// 	});
//     });
// });

// S'execute avant chaque fonctions, pratique pour la connexion a une DB
// beforeEach(function() {
//     return db.clear()
//         .then(function() {
// 	    return db.save([tobi, loki, jane]);
// 	});
// });

// describe('#find()', function() {
//     it('respond with matching records', function() {
//         return db.find({ type: 'User' }).should.eventually.have.length(3);
//     });
// });

describe('#connection()', function(host, port) {
    if ('should connect without error', function(done) {
            index.connection('localhost', 28015).then(function(conn) {
                return conn;
            }).error(function(err) {
                if (err) throw err;
            });

        });
});
