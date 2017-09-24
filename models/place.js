/**
 * Created by MaximeMaillet on 03/06/2017.
 */

"use strict";

var debug = require('debug');
var lDebug = debug('custom.model.place.debug');

var db = require('../../lib/database');

module.exports.save = (json) => {
	return new Promise((resolve, reject) => {
		db.prepare('SELECT * FROM place WHERE name = :name', {name: json.name})
			.then((result) => {

				if(result.length == 0) {

					if(json.address.streetAddress === undefined) {
						return reject({code: 2, message: "Street address is not defined"});
					}

					if(json.address.addressLocality === undefined) {
						return reject({code: 2, message: "Locality is not defined"});
					}

					if(json.address.addressCountry === undefined) {
						return reject({code: 2, message: "Country is not defined"});
					}

					db.prepare('INSERT INTO place(name, address, cp, city, country, latitude, longitude) ' +
							'VALUES (:name, :address, :cp, :city, :country, :latitude, :longitude)',
						{
							name: json.name,
							address: json.address.streetAddress,
							cp: json.address.postalCode,
							city: json.address.addressLocality,
							country: json.address.addressCountry,
							latitude: json.geo.latitude,
							longitude: json.geo.longitude
						})
						.then((resInserted) => {
							resolve(resInserted.insertId)
						})
						.catch((error) => {
							reject(error);
						});
				}
				else {
					db.prepare('UPDATE place SET address=:address, cp=:cp, city=:city, country=:country, latitude=:latitude, longitude=:longitude WHERE id=:id',
						{
							id: result[0].id,
							address: json.address.streetAddress,
							cp: json.address.postalCode,
							city: json.address.addressLocality,
							country: json.address.addressCountry,
							latitude: json.geo.latitude,
							longitude: json.geo.longitude
						})
						.then((resultUpdate) => {
							resolve(result[0].id);
						})
						.catch((error) => {
							reject(error);
						});
				}
			})
			.catch((error) => {
				reject(error);
			});
	});
};