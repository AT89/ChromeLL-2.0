var config = {};
var allPages = {
	error_check : function() {
		var bgImage = document.body.style.backgroundImage;
		if (bgImage.indexOf('errorlinks.png') > -1) {
			// error detected - display dialog box
			var dialog = document.createElement('dialog');
			var redirect = document.createElement('button');
			var close = document.createElement('button');
			var imageURL;
			document.body.style.overflow = "hidden";
			dialog.style.border = '1px solid rgba(0, 0, 0, 0.3)';
			dialog.style.borderRadius = '6px';
			dialog.style.boxShadow = '0 3px 7px rgba(0, 0, 0, 0.3)';
			imageURL = chrome.extension.getURL('/src/images/popup.png');
			dialog.style.backgroundImage = "url('" + imageURL + "')";
			dialog.style.backgroundColor = 'white';
			dialog.style.backgroundRepeat = 'no-repeat';
			dialog.style.backgroundPosition = 'center bottom';
			dialog.innerHTML = 'Error detected... redirect to history.php?' + '<br>' 
					+ '(popup generated by ChromeLL)' + '<br>' + '<br>';
			redirect.innerText = 'Redirect'
			redirect.addEventListener('click', function() {
				if (window.location.protocol == 'https:') {
					window.location.href = 'https://boards.endoftheinter.net/history.php?b';
				} else {
					window.location.href = 'http://boards.endoftheinter.net/history.php?b';
				}
			});			
			close.innerText = 'Close';
			close.addEventListener('click', function() {
				dialog.close();
			});
			dialog.appendChild(redirect);
			dialog.appendChild(close);
			document.body.appendChild(dialog);
			dialog.showModal();
			return;
		}
	},
	userscripts: function() {
		// var location = window.location;
		var head = document.getElementsByTagName('head')[0];
		var config;
		if (typeof (messageList) !== 'undefined') {
			config = messageList.config;
		}
		else if (typeof (topicList) !== 'undefined') {
			config = topicList.conig
		}		

		var data = config.userscript_data;
		for (var script in data) {
			var scriptElement = document.createElement('script');
			var contents = data[script].contents;
			scriptElement.type = 'text/javascript';
			scriptElement.innerHTML = contents;
			head.appendChild(scriptElement);
		}
	},
	notify_pm : function() {
		var userbar_pms = document.getElementById('userbar_pms');
		if (!userbar_pms) {
		}
			return;
		var observer = new MutationObserver(function() {
			// we can assume that all mutations on 
			// userbar_pms element are relevant
			if (userbar_pms.style.display == 'none' && config.pms != 0) {
				// clear unread message count from config
				config.pms = 0;
				chrome.runtime.sendMessage({
						need : "save",
						name : "pms",
						data : config.pms
				});
			}
			else if (userbar_pms.style.display != 'none') {
				var pms_text = userbar_pms.innerText;
				var pm_number = parseInt(pms_text.match(/\((\d+)\)/)[1]);
				var notify_title, notify_msg;
				// compare pm_number to last known value for pm_number
				if (pm_number > config.pms) {
					// you have mail
					if (pm_number == 1) {
						notify_title = 'New PM';
						notify_msg = 'You have 1 unread private message.';
					}
					else {
						notify_title = 'New PMs';
						notify_msg = 'You have ' + pm_number 
								+ ' unread private messages.';
					}
					// notify user and save current pm_number
					chrome.runtime.sendMessage({
							need: "notify",
							title: notify_title,
							message: notify_msg
					}, function(data) {
						console.log(data);
					});
					config.pms = pm_number;
					chrome.runtime.sendMessage({
							need : "save",
							name : "pms",
							data : config.pms
					});	
				}
				else {
					// user has unread PMs, but no new PMs
					return;
				}
			}
		});
		observer.observe(userbar_pms, {
				attributes: true,
				childList: true
		});		
	},
	history_menubar : function() {
		var link = document.createElement('a');
		link.innerHTML = 'Message History';
		if (config.history_menubar_classic)
			link.href = '//boards.endoftheinter.net/history.php';
		else
			link.href = '//boards.endoftheinter.net/topics/Posted';
		if (document.body.className === 'regular') {
			var sep = document.createElement('span');
			var menubar = document.getElementsByClassName('menubar')[0];
			sep.innerHTML = ' | ';
			menubar.insertBefore(link, menubar.getElementsByTagName('br')[0]);
			menubar.insertBefore(sep, link);
		} else if (document.body.className === 'classic') {
			var br = document.createElement('br');
			document.getElementsByClassName('classic3')[0].insertBefore(link,
					null);
			document.getElementsByClassName('classic3')[0].insertBefore(br,
					link);
		}
	},
	float_userbar : function() {
		var id = document.createElement('div');
		var userbar = document.getElementsByClassName('userbar')[0];
		var menubar = document.getElementsByClassName('menubar')[0];
		document.getElementsByClassName('body')[0].removeChild(userbar);
		document.getElementsByClassName('body')[0].removeChild(menubar);
		id.insertBefore(menubar, null);
		id.insertBefore(userbar, null);
		id.style.position = 'fixed';
		id.style.width = '100%';
		id.style.top = '0';
		userbar.style.marginTop = '-2px';
		userbar.style.borderBottomLeftRadius = '5px';
		userbar.style.borderBottomRightRadius = '5px';
		config.remove_links ? document.getElementsByTagName('h1')[0].style.paddingTop = '20px'
				: document.getElementsByTagName('h1')[0].style.paddingTop = '40px';
		document.getElementsByClassName('body')[0].insertBefore(id, null);
	},
	float_userbar_bottom : function() {
		var menubar = document.getElementsByClassName('menubar')[0];
		var userbar = document.getElementsByClassName('userbar')[0];
		menubar.style.position = "fixed";
		menubar.style.width = "99%";
		menubar.style.bottom = "-2px";
		userbar.style.position = "fixed";
		userbar.style.borderTopLeftRadius = '5px';
		userbar.style.borderTopRightRadius = '5px';
		userbar.style.width = "99%";
		userbar.style.bottom = "33px";
		menubar.style.marginRight = "20px";
		menubar.style.zIndex = '2';
		userbar.style.zIndex = '2';
	},
	short_title : function() {
		document.title = document.title.replace(/End of the Internet - /i, '');
	},
	user_info_popup : function() {
		chrome.runtime.sendMessage({
			need : "insertcss",
			file : "src/css/arrowbox.css"
		}, function(r) {
			var links = [ "PM", "GT", "BT", "HIGHLIGHT",
					"UNHIGHLIGHT", "IGNORATE" ];
			var popup = document.createElement('div');
			popup.id = "user-popup-div";
			var info = document.createElement('div');
			info.id = 'popup_info';
			var user = document.createElement('div');
			user.id = 'popup_user';
			var ins;
			for (var i = 0, link; link = links[i]; i++) {
				ins = document.createElement('span');
				ins.className = 'popup_link';
				ins.innerHTML = link;
				ins.addEventListener('click', commonFunctions.popupClick);
				info.insertBefore(ins, null);
			}
			popup.insertBefore(user, null);
			popup.insertBefore(info, null);
			document.body.insertBefore(popup, null);
			commonFunctions.hidePopup();
			/*document.body.addEventListener('dblclick',
					commonFunctions.handlePopup);*/
			document.addEventListener('click', function(e) {
				if (e.target.className != 'popup_link')
					commonFunctions.hidePopup.call(commonFunctions, e);
			});			
		});
	}
};

var commonFunctions = {
	asyncUpload : function(tgt, i) {
		console.log(tgt, i);
		if (!i)
			var i = 0;
		var xh = new XMLHttpRequest();
		xh.onreadystatechange = function() {
			if (this.readyState === 4 && this.status === 200) {
				var tmp = document.createElement('div');
				tmp.innerHTML = this.responseText;
				console.log(tmp);
				var update_ul;
				if (window.location.href.match('postmsg')) {
					update_ul = document.getElementsByTagName('form')[0]
							.getElementsByTagName('b')[2];
				} else {
					update_ul = document
							.getElementsByClassName('quickpost-body')[0]
							.getElementsByTagName('b')[0];
				}
				var current = update_ul.innerHTML
						.match(/Uploading: (\d+)\/(\d+)\)/);
				var tmp_input = tmp.getElementsByClassName('img')[0]
						.getElementsByTagName('input')[0];
				if (tmp_input.value) {
					if (tmp_input.value.substring(0, 4) == '<img') {
						commonFunctions.quickReplyInsert(tmp_input.value);
						if ((i + 1) == current[2]) {
							update_ul.innerHTML = "Your Message";
						} else {
							update_ul.innerHTML = "Your Message (Uploading: "
									+ (i + 2) + "/" + current[2] + ")";
						}
					}
				}
				i++;
				if (i < tgt.length) {
					commonFunctions.asyncUpload(tgt, i);
				}
			}
		};
		var http = 'https';
		if (window.location.href.indexOf('https:') == -1)
			http = 'http';
		xh.open('post', http + '://u.endoftheinter.net/u.php', true);
		var formData = new FormData();
		formData.append('file', tgt[i]);
		xh.withCredentials = "true";
		xh.send(formData);
	},
	handlePopup : function(evt) {
		try {
			var coords = {};
			coords.x = evt.x;
			coords.y = evt.y;
			var user;
			if (evt.target.parentNode.parentNode.parentNode.parentNode.className === "message-container") {		
				user = evt.target.parentNode.parentNode.parentNode.parentNode
						.getElementsByTagName('a')[0];
				commonFunctions.currentPost = evt.target.parentNode.parentNode.parentNode.parentNode.parentNode;
			} else {
				user = evt.target.parentNode.getElementsByTagName('a')[0];
				commonFunctions.currentPost = evt.target.parentNode;			
			}
			commonFunctions.currentUser = user.innerHTML;
			commonFunctions.currentID = user.href.match(/user=(\d+)/)[1];
			var gs = '';
			if (!config.hide_gs) {
				if (commonFunctions.currentID > 22682) {
					gs = ' (gs)\u2076';
				} else if (commonFunctions.currentID > 21289) {
					gs = ' (gs)\u2075';
				} else if (commonFunctions.currentID > 20176) {
					gs = ' (gs)\u2074';
				} else if (commonFunctions.currentID > 15258) {
					gs = ' (gs)\u00B3';
				} else if (commonFunctions.currentID > 13498) {
					gs = ' (gs)\u00B2';
				} else if (commonFunctions.currentID > 10088) {
					gs = ' (gs)';
				}
			}
			// load user profile;
			var xhr = new XMLHttpRequest();
			xhr.open("GET", user, true);
			xhr.onreadystatechange = function() {
				if (xhr.readyState == 4 && xhr.status == 200) {
					var html = document.createElement('html');
					html.innerHTML = xhr.responseText;
					var tds = html.getElementsByTagName('td');
					// scrape information from profile
					for (var i = 0, len = tds.length; i < len; i++) {
						var td = tds[i];
						if (td.innerText.indexOf('Status') > -1) {
							var profileStatus = tds[i + 1].innerText;
						}
						if (td.innerText.indexOf('Formerly') > -1) {
							var oldUsername = tds[i + 1].innerText;
						}
						if (td.innerText.indexOf('Reputation') > -1) {
							var profileRep = tds[i + 1].innerText;
						}					
					}
					// prepare popup menu for updates
					var formerly = document.getElementById("namechange");
					var displayOnline = document.getElementById('online');
					var displayPunish = document.getElementById('punish');
					var displayRep = document.getElementById('rep');					
					// update popup menu elements
					displayRep.innerHTML = '<br>' + profileRep;
					if (config.show_old_name) {
						if (oldUsername) {
							formerly.innerHTML = "<br>Formerly known as: <b>" + oldUsername + '</b>';
						}
					}
					if (html.innerHTML.indexOf('online now') > -1) {
							displayOnline.innerHTML = '(online now)';
					}
					if (profileStatus) {
						if (profileStatus.indexOf('Suspended') > -1) {
								displayPunish.innerHTML = '<b>Suspended until: </b>' + profileStatus.substring(17);
						}
						if (profileStatus.indexOf('Banned') > -1) {
								displayPunish.innerHTML = '<b>Banned</b>';
						}
					}
				}
			}
			xhr.send();
			document.getElementById('popup_user').innerHTML = '<div id="username">' + commonFunctions.currentUser + " " + gs 
					+ ' <span class="popup_uid">' + commonFunctions.currentID + '</div>'
					+ '<span class="popup_uid"><div id="namechange"> </div>'
					+ '<span class="popup_uid"><p><div id="rep"><br>loading...</div></p>' 
					+ '<div id="online"></div><div id="punish"></div><div id="clip"></div></span>';
			var popupDiv = document.getElementById('user-popup-div');
			popupDiv.style.top = (evt.y + 10) + "px";
			popupDiv.style.left = (evt.x - 30) + "px";
			popupDiv.style.display = 'block';			
			setTimeout(function() {
				document.addEventListener('mousemove', commonFunctions.mousemoveHandler);
			}, 1500);
			if (document.selection)
				document.selection.empty();
			else if (window.getSelection)
				window.getSelection().removeAllRanges();
		} catch (e) {
			console.log(e);
		}
	},
	hidePopup: function() {
		document.getElementById('user-popup-div').style.display = 'none';
		document.removeEventListener('mousemove', this.mousemoveHandler);
	},
	mousemoveHandler: function(evt, coords) {
		if (evt.target.className == 'message'
				|| evt.target.className == 'message-container'
				|| evt.target.className == 'message-top'
				|| evt.target.className.match(/bar/)
				|| evt.target.className == 'body') {
			commonFunctions.hidePopup();
		}
	},
	popupClick: function(evt) {
		var user = commonFunctions.currentUser.toLowerCase();
		var list = false;
		var userToCheck;
		if (typeof (messageList) !== 'undefined') {			
			list = true;
			var containers = document.getElementsByClassName('message-container');
			var container;
			var functions = messageList.functions.messagecontainer;
		}
		else {		
			var trs = document.getElementsByTagName('tr');
			var tr;
			var functions = topicList.functions;
		}
		var target = commonFunctions.currentPost;
		var type = evt.target.innerHTML;
		if (config.debug) {
			console.log(type, commonFunctions.currentUser);
		}
		switch (type) {
			case "IGNORATE?":
				if (!config.ignorator_list || config.ignorator_list == '') {
					config.ignorator_list = commonFunctions.currentUser;
				} else {
					config.ignorator_list += ", " + commonFunctions.currentUser;
				}
				chrome.runtime.sendMessage({
					need : "save",
					name : "ignorator_list",
					data : config.ignorator_list
				});
				if (list) {
					messageList.config.ignorator_list = config.ignorator_list;
					for (var i = 0, len = containers.length; i < len; i++) {
						container = containers[i];
						functions.ignorator_messagelist(container);
					}
				}
				else {
					topicList.config.ignorator_list = config.ignorator_list;
					topicList.createArrays();
					for (var i = 1, len = trs.length; i < len; i++) {
						tr = trs[i];
						functions.ignorator_topiclist(tr, i);
					}
				}
				evt.target.innerHTML = "IGNORATE";
				commonFunctions.hidePopup();
				break;
			case "IGNORATE":
				evt.target.innerHTML = "IGNORATE?";
				break;
			case "PM":
				chrome.runtime.sendMessage({
					need : "opentab",
					url : "http://endoftheinter.net/postmsg.php?puser="
							+ commonFunctions.currentID
				});
				commonFunctions.hidePopup();
				break;
			case "GT":
				chrome.runtime.sendMessage({
					need : "opentab",
					url : "http://endoftheinter.net/token.php?type=2&user="
							+ commonFunctions.currentID
				});
				commonFunctions.hidePopup();
				break;
			case "BT":
				chrome.runtime.sendMessage({
					need : "opentab",
					url : "http://endoftheinter.net/token.php?type=1&user="
							+ commonFunctions.currentID
				});
				commonFunctions.hidePopup();
				break;
			case "HIGHLIGHT":
				config.user_highlight_data[user] = {};
				config.user_highlight_data[user].bg = Math.floor(
						Math.random() * 16777215).toString(16);
				config.user_highlight_data[user].color = Math.floor(
						Math.random() * 16777215).toString(16);
				chrome.runtime.sendMessage({
					need : "save",
					name : "user_highlight_data",
					data : config.user_highlight_data
				});
				if (list) {
					// update config object in messageList script
					messageList.config.user_highlight_data = config.user_highlight_data;
					var top;
					for (var i = 0, len = containers.length; i < len; i++) {
						container = containers[i];
						functions.userhl_messagelist(container, i);
						if (config.foxlinks_quotes) {
							 functions.foxlinks_quote(container);
						}
					}
				} else {
					// update config object in topicList script
					topicList.config.user_highlight_data = config.user_highlight_data;
					for (var i = 1, len = trs.length; i < len; i++) {
						tr = trs[i];
						functions.userhl_topiclist(tr);
					}
				}				
				break;
			case "UNHIGHLIGHT":
				delete config.user_highlight_data[commonFunctions.currentUser
						.toLowerCase()];
				chrome.runtime.sendMessage({
					need : "save",
					name : "user_highlight_data",
					data : config.user_highlight_data
				});
				if (list) {
					// update config object in messageList scripts
					messageList.config.user_highlight_data = config.user_highlight_data;
					var message_tops = document
							.getElementsByClassName('message-top');
					var top;
					for (var i = 0, len = message_tops.length; i < len; i++) {
						top = message_tops[i];
						if (top.getElementsByTagName('a')[0]) {
							userToCheck = top.getElementsByTagName('a')[0].innerHTML;
							if (userToCheck === commonFunctions.currentUser) {				
								top.style.background = '';
								top.style.color = '';
								var top_atags = top.getElementsByTagName('a');
								for ( var j = 0; j < top_atags.length; j++) {
									top_atags[j].style.color = '';
								}
							}
						}
					}
				} else {
					// update config object in topicList scripts
					topicList.config.user_highlight_data = config.user_highlight_data;
					var tds, td, tags;
					for (var i = 1, len = trs.length; i < len; i++) {
						tr = trs[i];
						tds = tr.getElementsByTagName('td');
						if (tds[1].getElementsByTagName('a')[0]) {
							userToCheck = tds[1].getElementsByTagName('a')[0].innerHTML;
							if (userToCheck == commonFunctions.currentUser) {
								for (var j = 0, tds_len = tds.length; j < tds_len; j++) {
									td = tds[j];
									td.style.background = '';
									td.style.color = '';
									tags = td.getElementsByTagName('a');
									for (var k = 0, tags_len = tags.length; k < tags_len; k++) {
										tags[k].style.color = '';
									}
								}
							}
						}
					}
						// topicList.zebra_tables();
				}
				commonFunctions.hidePopup();
				break;
		}
	},
	quickReplyInsert : function(text) {
		var quickreply = document.getElementsByTagName('textarea')[0];
		var qrtext = quickreply.value;
		var oldtxt = qrtext.split('---');
		var newtxt = '';
		for ( var i = 0; i < oldtxt.length - 1; i++) {
			newtxt += oldtxt[i];
		}
		newtxt += text + "\n---" + oldtxt[oldtxt.length - 1];
		quickreply.value = newtxt;
	},
	init: function() {
		chrome.runtime.sendMessage({
			need : "config"
		}, function(response) {
			config = response.data;
			try {
				for (var i in allPages) {
					if (config[i]) {
						allPages[i]();
					}
				}				
			} catch (err) {
				console.log("error in " + i + ":", err);
			}		
		});
	}
};

function hideOptions() {
	var div = document.getElementById('options_div');
	var bodyClass = document.getElementsByClassName('body')[0];
	bodyClass.style.opacity = 1;
	document.body.removeChild(div);
	bodyClass.removeEventListener('click', hideOptions);
	document.body.removeEventListener('click', hideOptions);
	document.body.removeEventListener('mousewheel', preventScroll);
}

function preventScroll(event) {
	event.preventDefault();
}

chrome.runtime.onMessage.addListener(function(msg) {
	if (msg.action == 'showOptions') {
		var url = chrome.extension.getURL('options.html');
		var div = document.createElement('div');
		var iframe = document.createElement('iframe');
		var width = window.innerWidth;
		var height = window.innerHeight;
		var close = document.createElement('a');
		var bodyClass = document.getElementsByClassName('body')[0];
		var anchorHeight;	
		div.id = "options_div";
		div.style.position = "fixed";
		div.style.width = (width * 0.95) + 'px';
		div.style.height = (height * 0.95) + 'px';	
		div.style.left = (width - (width * 0.975)) + 'px';
		div.style.top = (height - (height * 0.975)) + 'px';
		div.style.boxShadow = "5px 5px 7px black";		
		div.style.borderRadius = '6px';	
		div.style.opacity = 1;
		div.style.backgroundColor = 'white';
		close.style.cssFloat = "right";
		close.style.fontSize = "18px";
		close.href = '#';
		close.style.textDecoration = "none";
		close.id = "close_options";
		close.innerHTML = '&#10006;';			
		iframe.style.width = "inherit";
		iframe.src = url;
		iframe.style.backgroundColor = "white";
		iframe.style.border = "none";
		bodyClass.style.opacity = 0.3;
		div.appendChild(close);
		div.appendChild(iframe);
		document.body.appendChild(div);
		anchorHeight = close.getBoundingClientRect().height * 2;
		iframe.style.height = ((height * 0.95) - anchorHeight) + 'px';
		bodyClass.addEventListener('click', hideOptions);
		document.getElementById('close_options').addEventListener('click', hideOptions);
		document.body.addEventListener('mousewheel', preventScroll);
	}
});

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', commonFunctions.init);
}
else {
	commonFunctions.init();
}