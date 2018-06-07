let crawler = require('crawler');
let baseLinks = require('./baseLink');
let _ = require('lodash');
let jsonfile = require('jsonfile');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

var crawledLinks = [];

var childParser = function (error, res, done) {
    if (error) {
        console.log(error);
    } else {
        var $ = res.$;
        var selector = $('#layer24 a');

        // filter out the links that ends in audio, video and book formats
        var temp = _.filter(selector, selected => {
            let regex = /(mp3|pdf|wmv|mp4)/g;
            try {
                var href = selected.attribs.href;
                var temp = href.match(regex);
                return temp
            } catch (e) {
                return false;
            }
        })

        // get the href out of html element
        var towrite = _.map(temp, selected => {
            var language = res
                .options
                .uri
                .match(/english/i)
                ? 'english'
                : 'myanmar';
            var type = res
                .options
                .uri
                .match(/book/i)
                ? 'book'
                : res
                    .options
                    .uri
                    .match(/video/i)
                    ? 'video'
                    : 'audio';
            return {
                author: res
                    .options
                    .uri
                    .substr(res.options.uri.lastIndexOf('/') + 1)
                    .split('.')[0],
                link: `${selected.attribs.href}`,
                language: language,
                type: type
            }
        })
        const csvWriter = createCsvWriter({
            path: 'data.csv',
            header: [
                {
                    id: 'author',
                    title: 'author'
                }, {
                    id: 'link',
                    title: 'link'
                }, {
                    id: 'language',
                    title: 'language'
                }, {
                    id: 'type',
                    title: 'type'
                }
            ],
            append: true
        });
        csvWriter.writeRecords(towrite) // returns a promise
            .then(() => {
            console.log('...Done');
        });
    }
}
/**
 * for each link crawled from the sidebar, save book and video and audio files
 */
var childCrawler = new crawler({maxConnections: 10000, callback: childParser})

/**
 *  Homepage parser to parse the page
 */

var mainParser = function (error, res, done) {
    if (error) {
        console.log(error);
    } else {
        var $ = res.$;
        var selector = $('table td a');
        _.forEach(selector, selected => {
            crawledLinks.push(`http://dhammadownload.com/${selected.attribs.href}`)
        })
    }
    done();
}
/**
 * crawl through the main link from the side bar
 */
var mainCrawler = new crawler({maxConnections: 100, callback: mainParser});

/**
 * even when main crawler is finished
 */
mainCrawler.on('drain', function () {
    // console.log('crawledLinks', crawledLinks);
    childCrawler.queue(crawledLinks)
})
mainCrawler.queue(baseLinks);
