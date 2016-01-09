var fs = require('fs');
var Inotify = require('inotify').Inotify;
var inotify = new Inotify(); //persistent by default, new Inotify(false) //no persistent
var WebTorrent = require('webtorrent');

var directory = '/home/ernewe_j/Downloads/Torrents/ThePirateBay/';
var data = {}; //used to correlate two events

var client = new WebTorrent();


var callback = function(event) {
    var mask = event.mask;
    var type = mask & Inotify.IN_ISDIR ? 'directory ' : 'file ';

    if (mask & Inotify.IN_CLOSE_WRITE) {
        console.log(type + ' opened for writing was closed ');
        if (event.name)
            openFile(event.name);
    }
};

var home_dir = {
    // Change this for a valid directory in your machine.
    path: '/home/ernewe_j/Downloads/Torrents/ThePirateBay',
    watch_for: Inotify.IN_OPEN | Inotify.IN_CLOSE,
    callback: callback
};

var home_watch_descriptor = inotify.addWatch(home_dir);

function openFile(filename) {
    var obj;

    //console.log(directory + filename);
    fs.readFile(directory + filename, 'utf8', function(err, data) {
        if (err) throw err;
        obj = JSON.parse(data);

        for (var i = 0; i < obj.length; i++) {
            client.add(obj[i]['magnet_link'], function(torrent) {
                // Got torrent metadata!
		console.log('Client is downloading:', torrent.infoHash);
                torrent.on('done', function() {
                    console.log('torrent finished downloading');
                });
                // torrent.on('download', function(chunkSize) {
                //     console.log('chunk size: ' + chunkSize);
                //     console.log('total downloaded: ' + torrent.downloaded);
                //     console.log('download speed: ' + torrent.downloadSpeed());
                //     console.log('progress: ' + torrent.progress);
                //     console.log('======');
                // });
            });
        }
    });
}
