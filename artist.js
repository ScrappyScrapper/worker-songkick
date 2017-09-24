/**
 * Created by MaximeMaillet on 03/06/2017.
 */
'use strict';

var debug = require('debug')('custom.worker.event');

//var db = require('../../lib/database');
var model = require('./models/artist');

module.exports.start = (json) => {
	return new Promise((resolve, reject) => {
		model.saveMongo(json)
			.then((artist) => {
				resolve(artist);
			})
			.catch((error) => {
				reject(error);
			});
	});
};