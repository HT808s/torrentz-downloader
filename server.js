"use strict";

const conf = require('dotenv').config();
const TorrentDownloader = require('./downloader.js');
const bunyan = require('bunyan');
const Promise = require('bluebird');

const mkdirp = Promise.promisify(require('mkdirp'));
const log_levels = ['info', 'warn', 'error', 'fatal'];

const log = bunyan.createLogger({
    name: 'torrent-downloader',
    src: 'debug',
    streams: [{
        level: 'info',
        stream: process.stdout
    }]
});

const downloader = TorrentDownloader(process.env.DOWNLOAD_DIRECTORY || '/tmp');

const servers = process.env.RETHINK_SERVERS.split(',').reduce((arr, elm, index, array) => {
    if (index%2) return arr;
    arr.push({host:elm, port:array[index+1]});
    return arr;
}, []);

const rethink = downloader.rethink(servers);

process.on('SIGINT', () => {
    rethink.drain().then(() => {process.exit();});
});

log.info.bind(log, 'Watching the following tables: ')(process.env.RETHINK_TABLES.split(','));
rethink.watch_table.apply(null, process.env.RETHINK_TABLES.split(',')).then((result) => {
    const callback = (torrent) => {	
	log.info('download complete', {infoHash: torrent.infoHash});
    };

    result.each((err, row) => {
	row.new_val.magnet_link &&
	    downloader.download_magnet(row.new_val.magnet_link)
	    .then(callback)
	    .catch((e) => {throw e;});
	row.new_val.torrent_link &&
	    downloader.download_torrent(row.new_val.torrent_link)
	    .then(callback)
	    .catch((e) => {throw e;});
    });
});


// const directories = process.env.DIRECTORIES.split(',');

// directories.length ? directories.map((directory) => {
//     mkdirp(directory).then(() => {
// 	downloader.watch_directory(directory);
//     }).catch((err) => {
// 	log.error(err);
// 	throw err;
//     });
// }) : downloader.watch_directory('/tmp/webtorrent');
