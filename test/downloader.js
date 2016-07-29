let chai = require('chai'),
    path = require('path');

chai.should();

/* *** torrentDownloader *** */

function downloaderConf() {

    const torrentDownloader = require(path.join(__dirname, '..', 'downloader.js'))();
    const test_magnet = 'magnet:?xt=urn:btih:8803dbbb3c5c39472ef3b818a6c18fc491cd9788&dn=The+Art+of+People+-+11+Simple+People+Skills+That+Will+Get+You+Everything+You+Want+%282016%29.epub+Gooner&tr=http%3A%2F%2Ftracker.trackerfix.com%3A80%2Fannounce&tr=udp%3A%2F%2F9.rarbg.me%3A2710&tr=udp%3A%2F%2F9.rarbg.to%3A2710';
    const test_torrent = 'http://extratorrent.cc/download/5060425/Investing+For+Dummies+7th+Edition+%28Eric+Tyson%29+-+%7BCHB+Books%7D.torrent';
    const downloadTimeout = 10000;
    
    return {
	downloadTimeout: downloadTimeout,
	test_torrent:test_torrent,
	test_magnet, test_magnet,
	torrentDownloader: torrentDownloader
    };
}

describe('torrentDownloader', () => {    
    describe('#download_torrent', () => {
        it('should download the torrent without error', function(done) {
	    const conf = downloaderConf();
            this.timeout(conf.downloadTimeout);
            conf.torrentDownloader.download_torrent(conf.test_torrent).then((result) => {
		done();
            }).catch((e) => done(e));
        });

	it('should download the magnet without error', function(done) {
	    const conf = downloaderConf();
            this.timeout(conf.downloadTimeout);
            conf.torrentDownloader.download_torrent(conf.test_magnet).then((result) => {
		done();
            }).catch((e) => done(e));
        });

        it('should catch Invalid torrent identifier', (done) => {
	    const conf = downloaderConf();
            conf.torrentDownloader.download_torrent('foo').catch((e) => {
		done();
	    });
        });
    });
});
