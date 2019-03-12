var process = require("process");
var url = require("url");
var request = require("request");
(function () {
  module.exports = function (link_url, callback) {
    var FeedParser, domain, options, rss;
    FeedParser = require('feedparser');
    options = {
      normalize: false,
      addmeta: true,
      feedurl: link_url
    };
    rss = [];
    domain = require('domain').create();
    domain.on('error', function (e) {
      return callback(e, null);
    });
    return domain.run(function () {

      /* Module Initialize */
      var feedParser, req;
      if (process.env["NODE_TLS_REJECT_UNAUTHORIZED"] != '0') {
        process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = '0';
      }
      let parsed_url = url.parse(link_url);
      req = request({
        method: "GET",
        host: parsed_url.hostname == "sukebei.nyaa.si" ? "nyaa.si" : parsed_url.host,
        port: parsed_url.port,
        uri: parsed_url.hostname == "sukebei.nyaa.si" ? link_url.replace("sukebei.nyaa.si", "nyaa.si") : link_url,
        headers: {
          host: parsed_url.host
        }
      })
      feedParser = new FeedParser([options]);

      /* REQUEST */
      req.on('error', function (err) {
        return callback(err, null);
      });
      req.on('response', function (res) {
        var stream;
        stream = this;
        if (res.statusCode !== 200) {
          return this.emit('error', new Error('Bad status code:' + res.statusCode + ":" + res.statusMessage));
        }
        return stream.pipe(feedParser);
      });

      /* FEEDPARSER */
      feedParser.on('error', function (err) {
        return callback(err, null);
      });
      feedParser.on('readable', function () {
        var item, stream;
        stream = this;
        if (item = stream.read()) {
          return rss.push(item);
        }
      });
      return feedParser.on('end', function () {
        if (rss.length === 0) {
          return callback('no articles');
        }
        return callback(null, rss);
      });
    });
  };

}).call(this);
