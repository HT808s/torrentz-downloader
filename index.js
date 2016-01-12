var fs = require('fs');
var Inotify = require('inotify').Inotify;
var WebTorrent = require('webtorrent');
var inotify = new Inotify(); //persistent by default, new Inotify(false) //no persistent
var client = new WebTorrent();
var r = require('rethinkdb');
var parseTorrent = require('parse-torrent');
var bunyan = require('bunyan');

function extract_links(json) {
    var links = [];
    for (var i = 0; i < json.length; i++) {
        links.push(json[i]['download_link']);
    }
    return links;
}

function download_done() {
    module.log.info('torrent finished downloading', {
        infoHash: torrent.infoHash
    });
}

module.exports = function(log) {
    if (log)
        this.log = log;
    else
        this.log = bunyan.createLogger({
            name: 'torrent-downloader',
            src: true,
            streams: [{
                level: 'error',
                stream: process.stdout
            }]
        });
    var module = this;

    this.download_torrents = function(torrents_links, opts) {
        for (var i = 0; i < torrents_links.length; i++) {
            download(torrents_links[i], opts);
        }
    };

    this.download_magnet = function(magnet, opts, done) {
        var parsed = null;
        try {
            parsed = parseTorrent(magnet);
        } catch (err) {
            module.log.error(err.message);
            done(err);
        }
        client.add(parsed, opts, function(torrent) {
            module.log.info('Downloading: ', {
                infoHash: torrent.infoHash
            });
            torrent.on('done', function() {
                done(null, torrent);
            });
        });
    };

    this.download_torrent = function(link, opts, done) {
        parseTorrent.remote(link, function(err, parsedTorrent) {
            if (err) {
                module.log.error(err.message);
                done(err);
            } else {
                client.add(parsedTorrent, opts, function(torrent) {
                    module.log.info('Downloading: ', {
                        infoHash: torrent.infoHash
                    });
                    torrent.on('done', function() {
                        done(null, torrent);
                    });
                });
            }
        });
    };

    this.watch_directory = function(directory, outputdir) {

        this.log.info('Watching ' + directory);
        var callback = function(event) {
            var mask = event.mask;
            var type = mask & Inotify.IN_ISDIR ? 'directory ' : 'file ';

            if (mask & Inotify.IN_CLOSE_WRITE) {
                console.log(type + ' opened for writing was closed ');
                if (event.name) {
                    var obj;
                    fs.readFile(directory + event.name, 'utf8', function(err, data) {
                        if (err) throw err;
                        obj = JSON.parse(data);
                        var links = extract_links(obj);
                        module.download_torrents(links, {
                            path: outputdir
                        });
                    });
                }
            }
        };

        var home_dir = {
            path: directory,
            watch_for: Inotify.IN_OPEN | Inotify.IN_CLOSE,
            callback: callback
        };

        var home_watch_descriptor = inotify.addWatch(home_dir);
    };

    this.watch_rethinkDB = function(host, port, database, table, outputdir) {

        this.log.info('Watching rethinkDB ' + host + ':' + port + ':' + database + ':' + table);
        r.connect(host, port).then(function(conn) {
            r.db(database).table(table).changes().run(conn, function(err, cursor) {
                if (err) throw err;
                cursor.eachAsync(function(row) {
                    if (row.new_val.magnet_link) {
                        module.download_magnet(row.new_val.magnet_link, {
                            path: outputdir
                        }, function(err, torrent) {
                            if (err) module.log.error(err.message);
                            module.log.info('download complete', {
                                infoHash: torrent.infoHash
                            });
                        });
                    } else if (row.new_val.torrent_link) {
                        module.download_torrent(row.new_val.torrent_link, {
                            path: outputdir
                        }, function(err, torrent) {
                            if (err) module.log.error(err.message);
			    module.log.info('download complete', {
                                infoHash: torrent.infoHash
                            });
                        });
                    }
                    return row;
                }).then(function() {
                    module.log.info('done processing');
                });
            });
        }).error(function(err) {
            if (err) throw err;
        });
    };
};
