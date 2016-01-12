var assert = require('assert');
var should = require('should');

var TorrentDownloader = require('../index.js');
var downloader = new TorrentDownloader();

var test_magnet = 'magnet:?xt=urn:btih:0ca4c8e7fb26a354b1a7aa15baeaf26067c66811&dn=Hacking+Wireless+Networks+For+Dummies&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80&tr=udp%3A%2F%2Fopen.demonii.com%3A1337&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Fexodus.desync.com%3A6969';

var test_torrent = 'https://torcache.net/torrent/166F3D7C7B1BB331CB3A0CA7B59148F79FB44047.torrent?title=[kat.cr]hacking.basic.security.penetration.testing.and.how.to.hack.2015.pdf.mobi.gooner';

describe('TorrentDownloader', function() {

    describe('#download_torrent()', function() {
        // it('should download without error', function(done) {
        //     var self = this;
        //     this.timeout(600);
        //     downloader.download_torrent(test_torrent, null, function(err, result) {
        //         if (err) done(err);
	// 	setTimeout(done, 500);
        //     });
        // });

        it('should catch Invalid torrent identifier', function(done) {
            downloader.download_torrent('dummy test', null, function(err, torrent) {
                if (err) done();
            });
        });
    });

    describe('#download_magnet()', function() {

        // it('should download without error', function(done) {
        //     var self = this;
        //     this.timeout(600);
        //     downloader.download_magnet(test_magnet, null, function(err, result) {
        //         if (err) done(err);
	// 	setTimeout(done, 500);
        //     });
        // });

        it('should catch Invalid torrent identifier', function(done) {
	    downloader.download_magnet('mdr', null, function(err, result) {
		if (err) done();
	    });
	});
    });
});
