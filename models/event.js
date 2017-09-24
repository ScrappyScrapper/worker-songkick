/**
 * Created by MaximeMaillet on 03/06/2017.
 */
"use strict";

var debug = require('debug');
var lDebug = debug('custom.model.place.debug');

var db = require('../../lib/database');
var md5 = require('md5');
var artistModel = require('./artist');
var placeModel = require('./place');

module.exports.save = (json) => {
	return new Promise((resolve, reject) => {
		var promises = [];
		promises.push(artistModel.save(json));
		promises.push(placeModel.save(json.location));

		Promise.all(promises)
			.then((result) => {

				saveEvent(json, result[0], result[1])
					.then((id) => {
						resolve(id);
					})
					.catch((error) => reject(error));
			})
			.catch((error) => {
				console.log(error);
			});
	});
};

function saveEvent(json, idArtist, idPlace) {
	return new Promise((resolve, reject) => {
		var hash = generateHash(json);

		db.prepare('SELECT * FROM event WHERE hash = :hash', {hash: hash})
			.then((result) => {
				if (result.length == 0) {
					db.prepare('INSERT INTO event(artist_id, place_id, startDate, hash) VALUES(:artist_id, :place_id, :startDate, :hash)',
						{
							artist_id: idArtist,
							place_id: idPlace,
							startDate: json.startDate,
							hash: hash
						})
						.then((result) => {
							if (result.affectedRows == 1) {
								resolve(result.insertId);
							}
							else {
								reject({code: 2, message: 'Insert failed : ' + url});
							}
						})
						.catch((error) => {
							console.log(error);
							reject({code: 2, message: error.message});
						});
				}
				else {
					db.prepare('UPDATE event SET startDate = :startDate WHERE id = :id',
						{
							startDate: json.startDate,
							id: result[0].id
						})
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
}

function generateHash(json) {
	var hash = json.name+json.location.name+json.startDate;
	hash = hash.replace(/'/g, '');
	hash = hash.replace(/\s+/g, '');
	hash = hash.toLowerCase();
	return md5(hash);
}