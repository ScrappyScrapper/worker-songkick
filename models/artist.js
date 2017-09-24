/**
 * Created by MaximeMaillet on 03/06/2017.
 */
"use strict";

var debug = require('debug');
var lDebug = debug('custom.model.artist.debug');
var lError = debug('custom.model.artist.error');

//var db = require('../../lib/database');
var mongoose = require('mongoose');
var md5 = require('md5');

/**
 * Save by MongoDB (mongoose)
 * @param json
 */
module.exports.saveMongo = (json) => {
	return new Promise((resolve, reject) => {
		var Artist = mongoose.model('Artist');
		Artist.findOne({name: json.name}).exec()
			.then((doc) => {
				if(!doc || doc.length == 0) {
					save(json).then((r) => resolve(r)).catch((err) => reject(err));
				}
				else {
					update(doc, json).then((r) => resolve(r)).catch((err) => reject(err));
				}
			})
			.catch((err) => {
				lError(err);
			});
	});
};

module.exports.addEvent = (idArtist, event) => {
	return new Promise((resolve, reject) => {

		var hash = generateHash(event);
		var lat=0, lng=0;
		if(event.location.geo != undefined) {
			lat = event.location.geo.latitude;
			lng = event.location.geo.longitude;
		}

		var Artist = mongoose.model('Artist');
		Artist.findOneAndUpdate(
			{
				_id: idArtist,
				'events.hash': { $ne: hash}
			},
			{$push: {
				events: {
					hash: hash,
					name: event.name,
					namePlace: event.location.name,
					startDate: event.startDate,
					address: event.location.address.streetAddress,
					cp: event.location.address.postalCode,
					city: event.location.address.addressLocality,
					country: event.location.address.addressCountry,
					latitude: lat,
					longitude: lng
				}
			}},
			{new: true}
		).exec()
			.then((doc) => {
				resolve(doc);
			})
			.catch((err) => {
				lError(err);
			});
	});
};

/**
 * Method which save Artist
 * @param data
 */
function save(data) {
	return new Promise((resolve, reject) => {
		var Artist = mongoose.model('Artist');
		var myArtist = new Artist({
			name: data.name,
			logo: data.logo
		});
		myArtist.save()
			.then((doc) => {
				resolve(doc);
			})
			.catch((error) => {
				reject(error);
			});
	});
}

/**
 * Method which update artist
 * @param currentData
 * @param newData
 * @returns {Promise}
 */
function update(currentData, newData) {
	return new Promise((resolve, reject) => {
		var Artist = mongoose.model('Artist');
		Artist.update({_id: currentData._id}, {$set: {logo: newData.logo}}).exec()
			.then((result) => {
				if(result.ok == 1) {
					resolve(newData);
				}
				else {
					reject();
				}
			})
			.catch((err) => {
				reject(err);
			})
	});
}


function generateHash(json) {
	var hash = json.name+json.location.name+json.startDate;
	hash = hash.replace(/'/g, '');
	hash = hash.replace(/\s+/g, '');
	hash = hash.toLowerCase();
	return md5(hash);
}

/**
 * @deprecated
 * @param json
 * @returns {Promise}
 */
module.exports.saveByMysql = (json) => {
	return new Promise((resolve, reject) => {
		db.prepare('SELECT * FROM artist WHERE name = :name', {name: json.name})
			.then((result) => {

				if (result.length == 0) {
					db.prepare('INSERT INTO artist(name, logo) VALUES(:name, :logo)', {name: json.name, logo: json.logo})
						.then((result) => {

							if (result.affectedRows == 1) {
								resolve(result.insertId);
							}
							else {
								reject({code: 2, message: 'Insert failed : ' + url});
							}
						})
						.catch((error) => {
							reject({code: 2, message: error.message});
						});
				}
				else {
					db.prepare('UPDATE artist SET logo=:logo WHERE id = :id', {logo: json.logo, id: result[0].id})
						.then(() => {
							resolve(result[0].id);
						})
						.catch((error) => {
							reject(error);
						});
				}
			})
			.catch((err) => {
				reject(err);
			});
	});
};