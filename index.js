let crawler = require('crawler');
let baseLinks = require('./baseLink');
let _ = require('lodash');
let jsonfile = require('jsonfile');

var crawledLinks = [];
var linkCrawler = new crawler({
    maxConnections: 500,
    callback: function(error, res, done) {
        if(error) {
            console.log(error);
        } else {
            var $ = res.$;
            var selector = $('#layer24 a');

            var temp = _.filter(selector, selected => {
                let regex = /(mp3|pdf|wmv|mp4)/g;
                try {
                    var temp = selected.attribs.href.match(regex);
                    return temp
                } catch(e) {
                    return false;
                }
            })
            var temp = _.map(temp, selected => {
                return {link:`${selected.attribs.href}`}
            })
            jsonfile.writeFile('/tmp/data.json', temp, {flag: 'a'},function(err) {
                if(err)
                console.log(err);
            })
        }
    }
})
var mainCrawler = new crawler({
    maxConnections: 10,
    callback: function(error, res, done) {
        if(error) {
            console.log(error);
        }else {
            var $ = res.$;
            var selector = $('table td a');
            _.forEach(selector, selected => {
                crawledLinks.push(`http://dhammadownload.com/${selected.attribs.href}`)
            })
        }
        done();
    }
});
mainCrawler.on('drain', function() {
    console.log('crawledLinks', crawledLinks);
    linkCrawler.queue(crawledLinks)
})
mainCrawler.queue(baseLinks);
