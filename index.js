/**
 * Created by MaximeMaillet on 03/06/2017.
 */
"use strict";

var debug = require('debug');
var lDebug = debug('custom.debug');
var lError = debug('custom.error');

//var db = require('../../lib/database');
var wEvent = require('./event');
var wArtist = require('./artist');

var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/ScrapperEvents');
mongoose.Promise = require('bluebird');
var Artist = mongoose.model('Artist', {
	name: String,
	logo: String,
	events: []
});
var Url = mongoose.model('Url', {
	url: String,
	status: Number,
	date: Date
});

module.exports.scrapPattern = [/^\/artists\/.+/];

module.exports.isAlreadyScrapped = (url) => {
	return new Promise((resolve, reject) => {
		var Url = mongoose.model('Url');
		Url.findOne({url: url}).exec()
			.then((doc) => {
				if(doc.status == 2) {
					resolve();
				}
				else {
					reject();
				}
			})
			.catch((err) => {
				var u = new Url({
					url: url,
					status: 1,
					date: Date.now()
				});
				u.save().then().catch((err) => console.log(err));
				reject();
			});
	});
};

module.exports.start = (url, $) => {
	lDebug("Custom start from %s", url);
	$('.microformat').each(function() {
		var json = JSON.parse($(this).find('script').html());

		try {
			json.forEach(function (value) {
				if (value['@type'] != undefined) {
					if (value['@type'] == 'MusicGroup') {
						lDebug("Start scrap Artist : "+value['name']);
						wArtist.start(value)
							.then((Artist) => {
								scrapEvents(Artist, $);
								var Url = mongoose.model('Url');
								Url.findOneAndUpdate({url: url}, {status:2}, {new:true}).then().catch();
							})
							.catch((error) => {
								lError(error);
							});
						throw BreakException;
					}
				}
			});
		}
		catch(e) {}
	});
};

function scrapEvents(artist, $) {
	$('.microformat').each(function() {
		var json = JSON.parse($(this).find('script').html());
		json.forEach(function (value) {
			if(value['@type'] != undefined && value['@type'] == 'MusicEvent') {
				wEvent.start(artist, value);
			}
		});
	});
}

/*
function saveUrl(url) {
	return new Promise((resolve, reject) => {
		db.prepare('SELECT * FROM url WHERE status=1 AND url = :url', {url: url})
			.then((result) => {
				if(result.length == 0) {
					db.prepare('INSERT INTO url(url) VALUES(:url)', {url: url})
						.then((result) => {
							if(result.affectedRows == 1) {
								resolve();
							}
							else {
								reject({code:2, message: 'Insert failed : '+url});
							}
						})
						.catch((error) => {
							reject({code:2, message: error.message});
						});
				}
				else {
					reject({code: 2, message:"Url already scrapped"});
				}
			})
			.catch((err) => {
				console.log(err);
			});
	});
}*/