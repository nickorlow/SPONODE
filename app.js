var sqlite3 = require('sqlite3').verbose();
var fs = require("fs");
var dir = process.env.HOME + '/Library/Messages/';
var file = process.env.HOME + '/Library/Messages/chat.db';
var applescript = require("./applescript/lib/applescript.js");
var exec = require('exec');
var google = require('google');
var weather = require('weather-js');
var glob = require('glob');
var Twitter = null;require('twitter');
var querystring = require('querystring');
var urban = require('urban');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var request = require('request');
var request = request.defaults({jar: true});
var imessagemodule = require('iMessageModule');
var sys = require('sys')
var exec = require('child_process').exec;
var rtoken = "";
var allowExplicit = false;

var saAccount = {
	username: " ",
	password: ""
};

var main_chat_title = '';

var exists = fs.existsSync(file);
if (!exists) {
	return;
}

// discover if we are running and old version of OS X or not
var OLD_OSX = false;
var os = require('os');
if (os.release().split('.')[0] === "12") { // 12 is 10.8 Mountain Lion, which does not have named group chats
	OLD_OSX = true;
}

// discover whether the keyboard setting "Full Keyboard Access" is set to
// "Text boxes and lists only" -- error or 1 or less
// "All controls" (takes 2 tabs instead of one switching between elements in Messages.app) -- 2 or more
var FULL_KEYBOARD_ACCESS = false; // false for text boxes and lists, true for all controls
exec('defaults read NSGlobalDomain AppleKeyboardUIMode', function(err, out, code) {
	if (err instanceof Error) {
		// return because we already have false set and error means text boxes and lists only
		return;
	}

	if (parseInt(out) > 1) {
		FULL_KEYBOARD_ACCESS = true;
	}
});

// read the Messages.app sqlite db
var db = new sqlite3.Database(file);

// internally used variables
var LAST_SEEN_ID = 0;
var ENABLE_OTHER_SERVICES = false;
var sending = false;



// login to SA
if (saAccount.username !== "" && saAccount.password !== "") {
	request.jar();

	var post_data = {
		action: "login",
		username: saAccount.username,
		password: saAccount.password,
		next: "%2F"
	};

	request.post({ url: "http://forums.somethingawful.com/account.php", form: post_data }, function(error, response, body) {
		if (!error && response.statusCode === 200) {
			//console.log(body);
		} else {
			//console.log(response);
			//console.log(body);
			//console.log(error);
		}
	});
}

function getPostKeys(threadId, callback) {
	var formKey = "";
	var formCookie = "";
	var formKeyRegex = /\"formkey\"\ value=\"[a-z0-9]+\"/;
	var formCookieRegex = /\"form_cookie\"\ value=\"[a-z0-9]+\"/;
	var valueRegex = /=\"[a-z0-9]+/;

	request({
		url: "http://forums.somethingawful.com/newreply.php?action=newreply&threadid=" + threadId
	}, function(error, response, body) {
		formKey = formKeyRegex.exec(body);
		formCookie = formCookieRegex.exec(body);

		console.log(formKey);
		console.log(formCookie);

		formKey = formKey[0];
		formKey = valueRegex.exec(formKey)[0].split('"')[1];
		formCookie = formCookie[0];
		formCookie = valueRegex.exec(formCookie)[0].split('"')[1];

		callback({
			key: formKey,
			cookie: formCookie
		});
	});
}

function getThreadKeys(callback) {
	var formKey = "";
	var formCookie = "";
	var formKeyRegex = /\"formkey\"\ value=\"[a-z0-9]+\"/;
	var formCookieRegex = /\"form_cookie\"\ value=\"[a-z0-9]+\"/;
	var valueRegex = /=\"[a-z0-9]+/;

	request({
		url: "http://forums.somethingawful.com/newthread.php?action=newthread&forumid=219"
	}, function(error, response, body) {
		formKey = formKeyRegex.exec(body);
		formCookie = formCookieRegex.exec(body);

		formKey = formKey[0];
		formKey = valueRegex.exec(formKey)[0].split('"')[1];
		formCookie = formCookie[0];
		formCookie = valueRegex.exec(formCookie)[0].split('"')[1];

		callback({
			key: formKey,
			cookie: formCookie
		});
	});
}

function saNewThread(threadTitle, threadText, callback) {
	getThreadKeys(function(keyAndCookie) {
		var post_data = {
			"forumid": "219",
			"action": "postthread",
			"formkey": keyAndCookie.key,
			"form_cookie": keyAndCookie.cookie,
			"subject": threadTitle,
			"iconid": 0,
			"message": threadText,
			"parseurl": "yes",
			"bookmark": "no",
			"disablesmilies": "no",
			"signature": "yes",
			"MAX_FILE_SIZE": "2097152",
			"attachment": "",
			"submit": "Submit New Thread"
		};

		request.post({ url: "http://forums.somethingawful.com/newthread.php", form: post_data }, function(error, response, body) {
			if (!error && response.statusCode === 200) {
				//console.log(body);
			} else {
				//console.log(response);
				//console.log(body);
				//console.log(error);
			}

			callback();
		});
	});
}

function saNewPostInThread(threadUrl, postText, callback) {
	threadUrl = threadUrl.split('threadid=')[1];
	if (threadUrl.indexOf('&') > -1) {
		threadUrl.split('&')[0];
	}

	var https = require('follow-redirects').https;

	getPostKeys(threadUrl, function(keyAndCookie) {
		var post_data = {
			"action": "postreply",
			"threadid": threadUrl,
			"formkey": keyAndCookie.key,
			"form_cookie": keyAndCookie.cookie,
			"message": postText,
			"parseurl": "yes",
			"bookmark": "no",
			"disablesmilies": "no",
			"signature": "yes",
			"MAX_FILE_SIZE": "2097152",
			"attachment": "",
			"submit": "Submit Reply"
		};
		
		request.post({ url: "http://forums.somethingawful.com/newreply.php", form: post_data }, function(error, response, body) {
			if (!error && response.statusCode === 200) {
				//console.log(body);
			} else {
				//console.log(response);
				//console.log(body);
				//console.log(error);
			}

			callback();
		});
	});
}

function googleSearch(rowText, chatter, isGroupChat) {
	google(rowText.substring(3), function(err, next, links) {
		if (!links) {
			return;
		}

		console.log(links[0]);
		console.log(chatter, "g: \"" + rowText.substring(3).substring(0, 8) + "...\": title: " + links[0].title.substring(0, 16) + "... description: " + links[0].description.substring(0, 32) + "... link: " + links[0].link);
		sendMessage(chatter, "g: \"" + rowText.substring(3).substring(0, 8) + "...\": title: " + links[0].title.substring(0, 16) + "... description: " + links[0].description.substring(0, 32) + "... link: " + links[0].link, isGroupChat);
		return;
	});
}

function weatherSearch(rowText, chatter, isGroupChat) {
	console.log('weather for ' + rowText.substring(3));
	weather.find({search: rowText.substring(3), degreeType: 'F'}, function(err, result) {
		if (err || !result) {
			console.log('no weather for ' +  + rowText.substring(3));
			return;
		}

		var wea = {
			high: result[0].forecast[0].high,
			low: result[0].forecast[0].low,
			temp: result[0].current.temperature,
			skytext: result[0].current.skytext
		};

		console.log(chatter, "w: " + rowText.substring(3) + ": current: " + wea.temp + " and " + wea.skytext + " high: " + wea.high + " low: " + wea.low);
		sendMessage(chatter, "w: " + rowText.substring(3) + ": current: " + wea.temp + " and " + wea.skytext + " high: " + wea.high + " low: " + wea.low, isGroupChat);

	});
}

function tweetSearch(rowText, chatter, isGroupChat) {
	console.log('tweet for ' + rowText.substring(3));
	client.get('search/tweets', {q: rowText.substring(3)}, function(error, tweets, response) {
		if (error) {
			return;
		}

		var tweet = tweets.statuses[0];
		console.log(tweets.statuses);
		console.log(tweet);
		if (!tweet) {
			console.log(chatter, "t: " + rowText.substring(3) + ": no tweets found.");
			sendMessage(chatter, "t: " + rowText.substring(3) + ": no tweets found.", isGroupChat);
		} else {
			console.log(tweet.text);
			console.log(chatter, "t: " + rowText.substring(3) + ": tweet: " + tweet.text + " user: " + tweet.user.screen_name);
			sendMessage(chatter, "t: " + rowText.substring(3) + ": tweet: " + tweet.text + " user: " + tweet.user.screen_name, isGroupChat);
		}
		return;
	});
}

function tweetStatus(rowText, chatter, isGroupChat) {
	console.log('tweet ' + rowText.split('.tweet ')[1]);
	client.post('statuses/update', {status: rowText.split('.tweet ')[1].substring(0, 140)}, function(error, tweet, response) {
		if (error) {
			console.log(error);
			console.log(response);
			sendMessage(chatter, "error tweeting: " + error, isGroupChat);
			return;
		}

		console.log(tweet);

		console.log(chatter, "tweeted: " + rowText.split('.tweet ')[1].substring(0, 140) + ", url: https://twitter.com/typicalyospos/status/" + tweet.id_str);
		sendMessage(chatter, "tweeted: " + rowText.split('.tweet ')[1].substring(0, 140) + ", url: https://twitter.com/typicalyospos/status/" + tweet.id_str, isGroupChat);
		return;
	});
}

function tweetReply(rowText, chatter, isGroupChat) {
	var replyToStatus = rowText.split('status/')[1].split(' ')[0];
	var reply = rowText.split(replyToStatus)[1];
	console.log('tweet ' + rowText.split('.reply ')[1]);
	client.post('statuses/update', {in_reply_to_status_id: replyToStatus, status: reply }, function(error, tweet, response) {
		if (error) {
			console.log(error);
			console.log(response);
			sendMessage(chatter, "error tweeting: " + error, isGroupChat);
			return;
		}

		console.log(tweet);

		console.log(chatter, "tweeted: " + reply + " in response to " + replyToStatus + ", url: https://twitter.com/typicalyospos/status/" + tweet.id_str);
		sendMessage(chatter, "tweeted: " + reply + " in response to " + replyToStatus + ", url: https://twitter.com/typicalyospos/status/" + tweet.id_str, isGroupChat);
		return;
	});
}

function twitterFollow(rowText, chatter, isGroupChat) {
	console.log('follow ' + rowText.split('.follow ')[1]);
	client.post('friendships/create', {screen_name: rowText.split('.follow ')[1].substring(0, 140), follow: true}, function(error, tweet, response) {
		if (error) {
			console.log(error);
			console.log(response);
			sendMessage(chatter, "error following: " + JSON.stringify(error), isGroupChat);
			return;
		}

		console.log(tweet);

		console.log(chatter, "followed: " + rowText.split('.follow ')[1].substring(0, 140));
		sendMessage(chatter, "followed: " + rowText.split('.follow ')[1].substring(0, 140), isGroupChat);
		return;
	});
}

function favoriteTweet(rowText, chatter, isGroupChat) {
	console.log('fav ' + rowText.split('.fav ')[1]);
	client.post('favorites/create', { id: rowText.split('status/')[1] }, function(error, tweet, response) {
		if (error) {
			console.log(error);
			console.log(response);
			sendMessage(chatter, "error favoriting: " + JSON.stringify(error), isGroupChat);
			return;
		}

		console.log(tweet);

		console.log(chatter, "favorited: " + rowText.split('status/')[1]);
		sendMessage(chatter, "favorited: " + rowText.split('status/')[1], isGroupChat);
		return;
	});
}

function urbandictionarySearch(rowText, chatter, isGroupChat) {
	console.log('urbandictionary for for ' + rowText.substring(3));
	urban(rowText.substring(3)).first(function(data) {
		console.log(data);
		if (!data) {
			console.log(chatter, "no urbandictionary entry for: " + rowText.substring(3));
			sendMessage(chatter, "no urbandictionary entry for: " + rowText.substring(3), isGroupChat);
			return;
		}
		console.log(chatter, "urbandictionary entry for: " + rowText.substring(3) + ": " + data.definition + " url: " + data.permalink);
		sendMessage(chatter, "urbandictionary entry for: " + rowText.substring(3) + ": " + data.definition + " url: " + data.permalink, isGroupChat);
	});
}

function sendiMessage(rowText, chatter, isGroupChat) {
	var text = rowText.substring(3);
	var sendTo = text.split(' ')[0];
	text = rowText.substring(sendTo.length + 4);
	sendMessage(sendTo, chatter + " says: " + text, true);
	setTimeout(function() {
		console.log(chatter, "sent: " + text + " to: " + sendTo);
		sendMessage(chatter, "sent: " + text + " to: " + sendTo, isGroupChat);
	}.bind(this), 3000);
}

function SANewThread(rowText, chatter, isGroupChat) {
	var regex = /\[[a-z0-9\s]+\]/;
	console.log(rowText);
	console.log(regex.exec(rowText));
	var threadTitle = regex.exec(rowText);
	console.log(threadTitle);
	var threadText = rowText.substring(parseInt(threadTitle.index) + parseInt(threadTitle[0].length), rowText.length);
	threadTitle = threadTitle[0].substring(1, threadTitle[0].length - 1);

	saNewThread(threadTitle, threadText, function() {
		console.log(chatter, "I did something on the forums! you better go check: http://forums.somethingawful.com/forumdisplay.php?forumid=219");
		sendMessage(chatter, "I did something on the forums! you better go check: http://forums.somethingawful.com/forumdisplay.php?forumid=219", isGroupChat);
	});
}

function SAReplyThread(rowText, chatter, isGroupChat) {
	console.log(rowText);

	var regex = /[a-z]+[:.].*?(?=\s)/;
	var threadUrl = regex.exec(rowText);
	console.log("url: " +threadUrl);
	console.log("url: " +threadUrl.index);
	console.log("url: " +threadUrl.length);
	console.log("url: " +parseInt(threadUrl.index) + parseInt(threadUrl[0].length));
	var postText = rowText.substring(parseInt(threadUrl.index) + parseInt(threadUrl[0].length), rowText.length);
	var threadUrl = threadUrl[0];
	console.log("txt: " +postText);

	saNewPostInThread(threadUrl, postText, function() {
		console.log(chatter, "I did something on the forums! you better go check: http://forums.somethingawful.com/forumdisplay.php?forumid=219");
		sendMessage(chatter, "I did something on the forums! you better go check: http://forums.somethingawful.com/forumdisplay.php?forumid=219", isGroupChat);
	});
}

function getLatestImage(chatter, callback) {
	var sql = 'SELECT attachment.filename as filename FROM message LEFT OUTER JOIN chat ON chat.room_name = message.cache_roomnames LEFT OUTER JOIN handle ON handle.ROWID = message.handle_id LEFT OUTER JOIN message_attachment_join ON message_attachment_join.message_id = message.ROWID LEFT OUTER JOIN attachment ON attachment.ROWID = message_attachment_join.attachment_id WHERE chat.display_name = \'' + chatter + '\' AND attachment.filename IS NOT NULL ORDER BY message.date DESC LIMIT 1';
	db.serialize(function() {
		db.all(sql, function(err, rows) {
			if (rows) {
				console.log(rows);
				callback(rows[0].filename);

			}
		}.bind(this));
	}.bind(this));
}

function tweetLatestImage(rowText, chatter, isGroupChat) {
	console.log('tweet image text ' + rowText.split('.twimg ')[1]);

	getLatestImage(chatter, function(filename) {
		console.log('filename!')
		console.log(filename)
		// Make post request on media endpoint. Pass file data as media parameter
		client.post('media/upload', { media: require('fs').readFileSync(filename.replace('~', process.env.HOME)) }, function(error, media, response) {

			if (error) {
				console.log('error')
				console.log(error)
			}

			// If successful, a media object will be returned.
			console.log(media);

			// Lets tweet it
			var status = {
				status: rowText.split('.twimg ')[1].substring(0, 140),
				media_ids: media.media_id_string // Pass the media id string
			}

			client.post('statuses/update', status, function(error, tweet, response) {
				if (error) {
					console.log(error);
					console.log(response);
					sendMessage(chatter, "error tweeting: " + error, isGroupChat);
					return;
				}

				console.log(tweet);

				console.log(chatter, "tweeted: " + rowText.split('.twimg ')[1].substring(0, 140) + " with image, url: https://twitter.com/typicalyospos/status/" + tweet.id_str);
				sendMessage(chatter, "tweeted: " + rowText.split('.twimg ')[1].substring(0, 140) + " with image, url: https://twitter.com/typicalyospos/status/" + tweet.id_str, isGroupChat);
				return;
			});
		}.bind(this));
	}.bind(this));
}

function URLLookup(rowText, chatter, isGroupChat) {
	var protocol = "http";
	var index = rowText.indexOf('http://');
	if (index === -1) {
		index = rowText.indexOf('https://');
		protocol = "https";
	}

	var url = rowText.split(protocol + '://')[1]; // get everything after the protocol
	console.log(url);

	var htp = {};
	if (protocol === 'http') {
		htp = require('follow-redirects').http;
	} else {
		htp = require('follow-redirects').https;
	}

	var path = "";
	for (var i = 1; i < url.split('/').length; i++) {
		var temp = url.split('/')[i]
		if (temp.indexOf(' ') > -1) {
			temp = temp.split(' ')[0];
		}

		path += '/' + temp;
	}

	var options = {
		host: ((url.indexOf('/') > -1) ? url.split('/')[0] : url.split(' ')[0]), // host is everything before first /
		path: path, // path is everything after, plus opening /
	};

	console.log(options);

	var callback = function(response) {
		var documentText = ''
		response.on('data', function (chunk) {
			documentText += chunk;
		});

		response.on('end', function () {
			var regex = /<title>(.+?)<\/title>/igm;
			var title = regex.exec(documentText);
			if (!title) {
				title = [];
				title[1] = "no title";
			}

			console.log(chatter, "url: " + protocol + '://' + url.split('/')[0] + path + " title: " + title[1]);
			sendMessage(chatter, "url: " + protocol + '://' + url.split('/')[0] + path + " title: " + title[1], isGroupChat);
		});
	}

	var request = htp.request(options, callback);

	request.on('error', function (error) {
		console.log(chatter, "url: " + protocol + '://' + url.split('/')[0] + path + " error");
		sendMessage(chatter, "url: " + protocol + '://' + url.split('/')[0] + path + " error", isGroupChat);
	});

	request.end();
}

function checkMessageText(messageId) {

	var SQL = "SELECT DISTINCT message.ROWID, handle.id, message.text, message.is_from_me, message.date, message.date_delivered, message.date_read, chat.chat_identifier, chat.display_name FROM message LEFT OUTER JOIN chat ON chat.room_name = message.cache_roomnames LEFT OUTER JOIN handle ON handle.ROWID = message.handle_id WHERE message.service = 'iMessage' AND message.ROWID = " + messageId + " ORDER BY message.date DESC LIMIT 500";
	if (OLD_OSX) {
		SQL = "SELECT DISTINCT message.ROWID, handle.id, message.text, message.is_from_me, message.date, message.date_delivered, message.date_read FROM message LEFT OUTER JOIN chat LEFT OUTER JOIN handle ON handle.ROWID = message.handle_id WHERE message.service = 'iMessage' AND message.ROWID = " + messageId + " ORDER BY message.date DESC LIMIT 500";
	}

	db.serialize(function() {
		var arr = [];
		db.all(SQL, function(err, rows) {
			if (err) throw err;

			// should only be one result since we are selecting by id but I am looping anyways
			for (var i = 0; i < rows.length; i++) {
				var row = rows[i];
			
				
				if (row.is_from_me || !row || !row.text || row.text.substring(0,7) == "SPONODE") {
					return;
				}

				var chatter;
				var isGroupChat = false;
				if (row.chat_identifier === null) {
					chatter = row.id;
				} else if (arr.indexOf(row.chat_identifier) < 0 && arr.indexOf(row.display_name+'-'+row.chat_identifier) < 0) {
					if (row.chat_identifier.indexOf('chat') > -1) {
						if (row.display_name && row.display_name !== "" && typeof(row.display_name) !== "undefined" || OLD_OSX) {
							chatter = row.display_name;
							isGroupChat = true;
						}
					} else {
						if (row.chat_identifier && row.chat_identifier !== "" && typeof(row.chat_identifier) !== "undefined") {
							chatter = row.chat_identifier;
							isGroupChat = true;
						}
					}
				}

				if(row.text == "explon")
				{
					allowExplicit = !allowExplicit;
					console.log(chatter+" has set allowExplicit to: "+allowExplicit);
					console.log();
					sendiMessageNew(chatter, "AllowExplicit has been set to: "+allowExplicit);
					return;
				}

				getSpotifyUserKey(row, function(row, token){
					console.log("Incoming Message Text: "+row.text);
					if(row.text.substring(0,31) == "https://open.spotify.com/track/")
					{
						getSpotifySongInf(row.text, token, function(songinf){
							
							if(songinf.explicit && !allowExplicit)
							{
								console.log("Not Adding(Explicit): "+songinf.name +" By: "+songinf.artists[0].name);
								console.log();
								sendiMessageNew(chatter, "Didn't Add Song: "+songinf.name+" By: "+songinf.artists[0].name+" REASON: Song is Explicit")
							}
							else
							{
								console.log("Adding: "+songinf.name +" By:"+songinf.artists[0].name);
								sendiMessageNew(chatter, "Added Song: "+songinf.name+" By: "+songinf.artists[0].name);
								addTrackToQueue(row.text, chatter, token);
							}
						});
					}
					else 
					{
						console.log("Not a Spotify Link");
						console.log();
					}

				
				});
				
				var rowText = row.text;
				// rowText = rowText.toLowerCase();
				if (rowText.split(' ').length < 2 && rowText.indexOf('.') === 0) {
					console.log('dropping: ' + rowText);
					return;
				}
			}
		});
	});
}

function sendMessage(to, message, groupChat) {
	imessagemodule.sendMessage(to, message);
}

function sendiMessageNew(to, msg)
{
	exec("osascript sendMessage.applescript "+to+" \"SPONODE "+msg+"\"", function(err, stdout, stderr) {});
}

function addTrackToQueue(url, chatter, token)
{
	var xhr = new XMLHttpRequest();
    xhr.open('POST', "https://api.spotify.com/v1/playlists/62GgGB7DJWUHyDc6G6ar5k/tracks?uris=spotify:track:"+url.substring(31, url.indexOf("?")), true);
	xhr.responseType = 'json';
	xhr.setRequestHeader("Authorization", "Bearer "+token);
    xhr.onload = function() {
      var status = xhr.status;
      if (status === 201) {
	   console.log("Song Added to Playlist");
	   console.log();
      } else {
		console.log("Error Adding Song to Playlist    Error Info:"+status+" <> " + xhr.response);
		console.log();
		sendiMessageNew("Error Adding Song :( Debuginf: "+status+" <> " + xhr.response, chatter);
      }
    };
	xhr.send();
}

function getSpotifyUserKey(row, callback)
{
	var xhr = new XMLHttpRequest();
    xhr.open('POST', "https://accounts.spotify.com/api/token", true);
	xhr.responseType = 'json';
	var params = "grant_type=refresh_token&refresh_token="+encodeURIComponent(rtoken);
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	xhr.setRequestHeader("Authorization", "Basic NDEyNWExMTBiYzcxNDAwOWEyNjExMzQzODVmY2Y4ZDE6OTE2OGI2MzAzNzg1NDcyZTgwMDgzNzJkN2EzMWQwOGI=");
    xhr.onload = function() {
      var status = xhr.status;
      if (status === 201 || status === 200) {
        callback(row, JSON.parse(xhr.responseText).access_token);
      } else {
		callback(row, "error genning my key :(");
      }
    };
    xhr.send(params);
}

function getSpotifySongInf(url, token, callback)
{
	var xhr = new XMLHttpRequest();
    xhr.open('GET', "https://api.spotify.com/v1/tracks/"+url.substring(31, url.indexOf("?")), true);
	xhr.responseType = 'json';
	xhr.setRequestHeader("Authorization", "Bearer "+token);
    xhr.onload = function() {
      var status = xhr.status;
      if (status === 201 || status === 200) {
        callback( JSON.parse(xhr.responseText));
      } else {
		callback( "error getting song :(");
      }
    };
    xhr.send();
}

function getSpotifyAPIKey(url)
{
	var xhr = new XMLHttpRequest();
    xhr.open('POST', "https://accounts.spotify.com/api/token", true);
	xhr.setRequestHeader("grant_type", "client_credentials");
    xhr.onload = function() {
      var status = xhr.status;
      if (status === 201) {

        callback(null, xhr.response);
      } else {
        callback(status, xhr.response);
      }
    };
    xhr.send();
}

db.serialize(function() {
	db.all("SELECT MAX(ROWID) AS max FROM message", function(err, rows) {
		if (rows) {
			var max = rows[0].max;
			if (max > LAST_SEEN_ID) {
				LAST_SEEN_ID = max;
				return;
			}
		}
	}.bind(this));
}.bind(this));

setInterval(function() {
	db.serialize(function() {
		db.all("SELECT MAX(ROWID) AS max FROM message", function(err, rows) {
			if (rows && !sending) {
				var max = rows[0].max;
				if (max > LAST_SEEN_ID) {
					for (LAST_SEEN_ID; LAST_SEEN_ID <= max; LAST_SEEN_ID++) {
						checkMessageText(LAST_SEEN_ID);
					}
				}
			}
		}.bind(this));
	}.bind(this));
}, 3000);


//Get Rid of init but
//sendiMessageNew("+15127311307","SPONODE INIT...");