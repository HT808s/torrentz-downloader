"use strict";

const Promise = require('bluebird');
const Inotify = require('inotify').Inotify;
const inotify = new Inotify(); //persistent by default, new Inotify(false) //no persistent
const fs = Promise.promisifyAll(require('fs'));
const parseTorrent = require('parse-torrent');
const WebTorrent = require('webtorrent');
const client = new WebTorrent();

module.exports = (outputdir) => {

    if (!outputdir) outputdir = '/tmp';
    const _parseTorrentRemoteAsync = Promise.promisify(parseTorrent.remote);
    
    const download_magnet = (magnet) => {
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
    
    const download_torrent = (link) => {
	return new Promise(function (fulfill, reject) {
	    _parseTorrentRemoteAsync(link).then((parsedTorrent) => {
		client.add(parsedTorrent, {path: outputdir}, (torrent) => {
		    torrent.on('done', () => {
			fulfill(torrent);
		    });
		});
	    }).catch(reject);
	});
    };

    // Watch the given directory for new json files containing torrent links
    // const watch_directory = (directory) => {	
    //     const callback = (event) => {
    // 	    const mask = event.mask;
    // 	    const type = mask & Inotify.IN_ISDIR ? 'directory ' : 'file ';
	    
    // 	    if (mask & Inotify.IN_CLOSE_WRITE) {
    //             console.log(type + ' opened for writing was closed ');
    //             if (event.name) {
    // 		    fs.readFile(directory + event.name, 'utf8').map((err, data) => {
    //                     if (err) throw err;			
    //                     const obj = JSON.parse(data);
    // 			download_torrent(obj['download_link'], {path: outputdir}, (err, torrent) => {
    // 			    if (err) throw err;
    // 			});
    // 		    });
    // 		}
    //         };
    // 	};
	
    //     return inotify.addWatch({
    // 	    path: directory,
    // 	    watch_for: Inotify.IN_OPEN | Inotify.IN_CLOSE,
    // 	    callback: callback
    //     });
    // };

    // Rethink object needs connection info: [{host:'www.exemple.com', port:28015}]
    const rethink = (rethinkDBServers) => {
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
    
    return {
	rethink: rethink,
	//watch_directory:watch_directory,
	download_magnet:download_magnet,
	download_torrent:download_torrent
    };
};
