/**
 * Created by MaximeMaillet on 03/06/2017.
 */
require('dotenv').config();
"use strict";

let debug = require('debug');
let lDebug = debug('ScrappyScrapper.worker.debug');
let lError = debug('ScrappyScrapper.worker.error');
let md5 = require('md5');
let mongoose = require('mongoose');
let Url;

initMongo();

module.exports.scrapPattern = [/^\/artists\/.+/];

module.exports.canScrapping = (url) => {
	return new Promise((resolve, reject) => {
		Url.findOne({url: url}, function(err, doc) {
			if (err) {
				lError(err);
				reject();
			}

			if (!doc) {
				let u = new Url({url: url, status: 1, date: Date.now()});
				u.save(function(err) {
					if (err) {
						lError(err);
					}
				});
				resolve('Url is not scrapping');
			} else {
				reject('Url is already scrapped');
			}
		});
	});
};

/**
 *
 * @param url
 * @returns {Promise}
 */
module.exports.isAlreadyScrapped = (url) => {
	return new Promise((resolve, reject) => {
		Url.findOne({url: url}, function(err, doc) {
			if (err) {
				lError(err);
				reject();
			}

			if (!doc) {
				let u = new Url({url: url, status: 1, date: Date.now()});
				u.save(function(err) {
					if (err) {
						lError(err);
					}
				});
				reject('Url is not scrapping');
			} else {
				resolve('Url is already scrapped');
			}
		});
	});
};

module.exports.start = function(url, $) {
	lDebug("Custom start from %s", url);
	let data = {
		"events": []
	};

	let promises = [];

	promises.push(new Promise((resolve, reject) => {
		$('.microformat').each(function() {
			let json = JSON.parse($(this).find('script').html());
			json.forEach(function (value) {
				if (value['@type'] !== undefined) {
					if(value['@type'] === 'MusicGroup') {
						Object.assign(data,checkArtist(value));
					}
					else if(value['@type'] === 'MusicEvent') {
						data['events'].push(checkEvent(value));
					}
				}
			});
		});
		resolve();
	}));

	promises.push(new Promise((resolve, reject) => {
		let Url = mongoose.model('Url');
		Url.findOneAndUpdate({url: url}, {status:2}, {new:true}, function(err, doc) {
			if (err) {
				reject(err);
			}

			if(!doc) {
				reject('Fail');
			} else {
				resolve();
			}
		});
	}));

	Promise.all(promises)
		.then(() => {
			this.out(data);
		})
		.catch((err) => {
			this.err(err);
		});
};

/**
 * Generate MD5 for one event
 * @param json
 */
function generateHash(json) {
	let hash = json.name+json.location.name+json.startDate;
	hash = hash.replace(/'/g, '');
	hash = hash.replace(/\s+/g, '');
	hash = hash.toLowerCase();
	return md5(hash);
}

/**
 * Initialize mongo database
 */
function initMongo() {
	mongoose.connect('mongodb://'+process.env.MONGO_HOST+'/ScrapperEvents', {
		useMongoClient: true
	});
	Url = mongoose.model('Url', {
		url: String,
		status: Number,
		date: Date
	});
}

function checkEvent(value) {
	let hash = generateHash(value);
	return {
		"hash": hash,
		"name": value.location.name,
		"address": value.location.address.streetAddress,
		"cp": value.location.address.postalCode,
		"city": value.location.address.addressLocality,
		"country": value.location.address.addressCountry,
		"location": [
			value.location.geo !== undefined ? value.location.geo.latitude : 0,
			value.location.geo !== undefined ? value.location.geo.longitude : 0
		],
		"startDate": value.startDate,
	};
}

function checkArtist(value) {
	return {
		'name': value.name,
		'logo': value.logo,
	};
}