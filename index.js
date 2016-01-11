var fs = require('fs');
var Inotify = require('inotify').Inotify;
var WebTorrent = require('webtorrent');
var inotify = new Inotify(); //persistent by default, new Inotify(false) //no persistent
var client = new WebTorrent();
var r = require('rethinkdb');
var parseTorrent = require('parse-torrent');


function extract_links(json) {
    var links = [];
    for (var i = 0; i < json.length; i++) {
        links.push(json[i]['download_link']);
    }
    return links;
}

module.exports = function(log) {
    this.log = log;
    var module = this;

    this.download_torrents = function(torrents_links, opts) {
        for (var i = 0; i < torrents_links.length; i++) {
            download(torrents_links[i], opts);
        }
    };

    this.download_torrent = function(link, opts) {
        parseTorrent.remote(link, function(err, parsedTorrent) {
            if (err) {
                module.log.error(err.message);
                return;
            } else {
                client.add(link, opts, function(torrent) {
                    module.log.info('Downloading: ', {
                        infoHash: torrent.infoHash
                    });
                    torrent.on('done', function() {
                        module.log.info('torrent finished downloading', {
                            infoHash: torrent.infoHash
                        });
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
        r.connect({
            host: host,
            port: port
        }, function(err, conn) {
            if (err) throw err;
            r.db(database).table(table).changes().run(conn, function(err, cursor) {
                if (err) throw err;
                cursor.eachAsync(function(row) {
                    module.download_torrent(row.new_val.download_link, {
                        path: outputdir
                    });
                    return row;
                }).then(function() {
                    module.log.info('done processing');
                });
            });
        });
    };
};
