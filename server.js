var program = require('commander');
var TorrentDownloader = require('./index.js');
var bunyan = require('bunyan');
var fs = require('fs');

var log_levels = ['info', 'warn', 'error', 'fatal'];

function isDirectory(val) {
    var outputdir = "";

    try {
        if (val) {
            var stats = fs.statSync(val);
            if (!stats.isDirectory()) {
                log.info(val + " is not a directory, downloads will go to " + outputdir);
            } else
                outputdir = program.outputdir;
        }
    } catch (err) {
        log.error(err.message);
        outputdir = "/tmp/webtorrent";
        log.info(val + " is not a directory, downloads will go to " + outputdir);
    }
    return outputdir;
}

function collect(val, memo) {
    memo.push(val);
    return memo;
}

function increaseVerbosity(v, total) {
    if (v > 4) v = 4;
    return total + v;
}

function rethinkDB(val) {
    return val.split(':');
}

program
    .version('0.0.1')
    .usage('[options] <file ...>')
    .option('-s, --seeders <n>', 'An integer argument', parseInt)
    .option('-l, --leechers <n>', 'An integer argument', parseInt)
    .option('-o, --outputdir [value]', 'Specify destination for downloaded files')
    .option('-d, --directory [value]', 'add a directory to watch', collect, [])
    .option('-r, --rethinkdb [value]', 'Set rethinkDB host [HOST:PORT:DATABASE]', rethinkDB)
    .option('-t, --rethinkTable [value]', 'add a rethinkDB table to watch', collect, [])
    .option('-v, --verbose', 'A value that can be increased', increaseVerbosity, -1)
    .option('--debug', 'trigger debug functionality')
    .parse(process.argv);


var log = bunyan.createLogger({
    name: 'torrent-downloader',
    src: program.debug,
    streams: [{
        level: log_levels[program.verbose],
        stream: process.stdout
    }]
});

log.debug(' seeders: %j', program.seeders);
log.debug(' leechers: %j', program.leechers);
log.debug(' directory: %j', program.directory);
log.debug(' rethinkDB: %j', program.rethinkdb);
log.debug(' rethinkTable: %j', program.rethinkTable);
log.debug(' outputdir: %j', program.outputdir);
log.debug(' args: %j', program.args);

var downloader = new TorrentDownloader(log);

if (program.rethinkdb && program.rethinkdb.length == 3) {

    for (var i = 0; i < program.rethinkTable.length; i++) {
        downloader.watch_rethinkDB(program.rethinkdb[0],
            program.rethinkdb[1],
            program.rethinkdb[2],
            program.rethinkTable[i],
            isDirectory(program.outputdir));
    }
    if (program.rethinkTable.length == 0) {
        downloader.watch_rethinkDB(program.rethinkdb[0],
            program.rethinkdb[1],
            program.rethinkdb[2],
            "torrents", isDirectory(program.outputdir));
    }
}

for (var i = 0; i < program.directory.length; i++) {
    downloader.watch_directory(program.directory[i], isDirectory(program.outputdir));
}
