/**
 * Created by MaximeMaillet on 03/06/2017.
 * This worker search events data :
 *  - date
 *  - place
 *  - line up
 */

'use strict';

var model = require('../models/artist');
var debug = require('debug')('custom.worker.event');

module.exports.start = (artist, data) => {
	return new Promise((resolve, reject) => {
		model.addEvent(artist._id, data)
			.then((res) => {
				resolve(res);
			})
			.catch((err) => {
				reject(err);
			})
	});
};