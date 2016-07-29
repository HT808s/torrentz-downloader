"use strict";

const Promise = require('bluebird');
const parseTorrent = require('parse-torrent');
const WebTorrent = require('webtorrent');
const client = new WebTorrent();

module.exports = (outputdir) => {

    if (!outputdir) outputdir = '/tmp';
    const _parseTorrentRemoteAsync = Promise.promisify(parseTorrent.remote);
    
    const download_torrent = (magnet) => {
	return new Promise(function (fulfill, reject) {
	    _parseTorrentRemoteAsync(magnet).then((result) => {
		client.add(result, {path: outputdir}, (torrent) => {
		    torrent.on('done', () => {
			fulfill(torrent);
		    });
		});
	    }).catch(reject);
	});
    };
    
    return {
	download_torrent:download_torrent
    };
};
