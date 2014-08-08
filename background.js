var text;
var board = Array();
var cfg, currentTab;
var drama = {};
var tabPorts = {};
var ignoratorInfo = {};
var noIgnores;
var scopeInfo = {};
var background;
var textArea;
var defaultConfig = '{"float_userbar":false,"short_title":true,"show_secret_boards":true,"dramalinks":false,"hide_dramalinks":false,"hide_dramalinks_topiclist":false,"user_info_popup":true,"zebra_tables":false,"force_https":false,"sys_notifications":true,"close_notifications":false,"ignorator":false,"enable_user_highlight":false,"ignorator_topiclist":false,"userhl_topiclist":false,"page_jump_buttons":true,"ignore_keyword":false,"enable_keyword_highlight":false,"click_expand_thumbnail":true,"imagemap_new_tab":true,"copy_in_context":false,"imagemap_on_infobar":false,"resize_imgs":false,"user_notes":true,"ignorator_messagelist":false,"userhl_messagelist":false,"no_user_highlight_quotes":false,"notify_userhl_post":false,"notify_quote_post":false,"new_page_notify":false,"number_posts":true,"like_button":true,"loadquotes":true,"post_title_notification":true,"filter_me":false,"expand_spoilers":false,"highlight_tc":false,"label_tc":true,"foxlinks_quotes":false,"quickpost_tag_buttons":false,"quickpost_on_pgbottom":false,"post_before_preview":false,"batch_uploader":false,"drop_batch_uploader":true,"sort_history":false,"history_expand_search":false,"ignorator_topiclist_pm":false,"userhl_topiclist_pm":false,"page_jump_buttons_pm":true,"click_expand_thumbnail_pm":true,"user_notes_pm":false,"userhl_messagelist_pm":false,"pm_title_pm":true,"number_posts_pm":true,"loadquotes_pm":true,"post_title_notification_pm":true,"quickpost_tag_buttons_pm":false,"quickpost_on_pgbottom_pm":false,"post_before_preview_pm":false,"batch_uploader_pm":false,"drop_batch_uploader_pm":true,"debug":false,"zebra_tables_color":"D7DEE8","close_notification_time":"5","ignorator_list":"","ignore_keyword_list":"","":"0","img_max_width":"1440","tc_highlight_color":"ffff00","tc_label_color":"","foxlinks_quotes_color":"","user_highlight_data":{},"keyword_highlight_data":{},"tag_highlight_data":{},"context_menu":true, "tag_admin":[], "bookmark_data":{"Serious":"Serious","Work Safe":"LUE-NWS-NLS","IRL Stuff":"Current Events+News+Politics","Cute Cats Only":"Cute&Cats"}, "user_id":"", "rep_callout":false, "show_old_name":true, "hide_gs":false, "clean_ignorator":false, "ignorator_backup":"", "auto_clean":false, "embed_on_hover":true, "rep_ignorator_filter":{}, "rep_ignorator_token":"", "rep_ignorator_userids":[], "ignorate_by_rep":false, "last_clean":0, "last_saved":0 }';

if(localStorage['ChromeLL-Config'] === undefined){
    localStorage['ChromeLL-Config'] = defaultConfig;
}
// Set config defaults on upgrade
function upgradeConfig(){
    var configJS = JSON.parse(defaultConfig);
    cfg = JSON.parse(localStorage['ChromeLL-Config']);
    for(var i in configJS){
        //if this variable does not exist, set it to the default
        if(cfg[i] === undefined){
            cfg[i] = configJS[i];
            if(cfg.debug) console.log("upgrade diff!", i, cfg[i]);
        }
    }
    
    //beta versions stored TC cache in the global config. Delete if found
    if(cfg.tcs) delete cfg.tcs
    
    //save the config, just in case it was updated
    localStorage['ChromeLL-Config'] = JSON.stringify(cfg);
}
upgradeConfig();

// sync listener - check every 90s for a config diff
function chkSync(){
    setTimeout(chkSync, 90 * 1000);
    cfg = JSON.parse(localStorage['ChromeLL-Config']);
    if(!cfg.sync_cfg) return;
    // "split" these config keys from the default config save, 2048 byte limit per item
    // split object moved to allBg.js so it can be accessed from the options page
    chrome.storage.local.get('cfg', function(data){
        if(data.cfg && data.cfg.last_saved > cfg.last_saved){
            if(cfg.debug) console.log('copy sync to local - local: ', cfg.last_saved, 'sync: ', data.cfg.last_saved);
            for(var j in data.cfg){
                cfg[j] = data.cfg[j];
            }
            localStorage['ChromeLL-Config'] = JSON.stringify(cfg);
            var bSplit = [];
            for(var k in split){
                if(cfg[split[k]]){
                    bSplit.push(k);
                }
            }
            chrome.storage.local.get(bSplit, function(r){
                for(var l in r){
                    if(cfg.debug) console.log('setting local', l, r[l]);
                    cfg[l] = r[l];
                }
                localStorage['ChromeLL-Config'] = JSON.stringify(cfg);
            });
        }else if(!data.cfg || data.cfg.last_saved < cfg.last_saved){
            if(cfg.debug) console.log('copy local to sync - local: ', cfg.last_saved, 'sync: ');
            var xCfg = JSON.parse(localStorage['ChromeLL-Config']);
            var toSet = {}
            for(var i in split){
                if(cfg[split[i]]){
                    toSet[i] = xCfg[i];
                }
                delete xCfg[i];
            }
            toSet.cfg = xCfg;
            if(cfg.debug) console.log('setting sync objects', toSet);
            chrome.storage.local.set(toSet);
            for(var i in toSet){
                var f = function(v){
                    chrome.storage.local.getBytesInUse(v, function(use){
                        console.log('%s using %d bytes', v, use);
                        if(use > 2048){
                            var sp = Math.ceil(use / 2048);
                            console.log('%s is too big, splitting into %d parts', v, sp);
                            var c = 0;
                            for(var j in toSet[v]){
                                if(!toSet[v + (c % sp)]) toSet[v + (c % sp)] = {};
                                toSet[v + (c % sp)][j] = toSet[v][j];
                                c++;
                            }
                            delete toSet[v];
                            console.log(toSet);
                        }
                    });
                }
                f(i);
            }
            
        }else{
            if(cfg.debug) console.log('skipping sync actions - local: ', cfg.last_saved, 'sync: ', data.cfg.last_saved);
        }
    });
}
//setTimeout(chkSync, 30 * 1000);

if(localStorage['ChromeLL-TCs'] == undefined) localStorage['ChromeLL-TCs'] = "{}";

var app = chrome.app.getDetails();
if(localStorage['ChromeLL-Version'] != app.version && localStorage['ChromeLL-Version'] != undefined && cfg.sys_notifications){
    console.log('ChromeLL updated! Old v: ' + localStorage['ChromeLL-Version'] + " New v: " + app.version);
		chrome.notifications.create(
		    'popup', {
		        type: "basic",
		        title: "ChromeLL has been updated",
		        message: "Old v: " + localStorage['ChromeLL-Version'] + " New v: " + app.version,
		        iconUrl: "src/images/lueshi_48.png"
		    },
		    function () {}
		);
		 // todo - setTimeout needs user configurable option
		setTimeout(function () {
		    chrome.notifications.clear('popup', function () {});
		}, 6000);
    localStorage['ChromeLL-Version'] = app.version;
}
if(localStorage['ChromeLL-Version'] == undefined){
    localStorage['ChromeLL-Version'] = app.version;
}
if(cfg.history_menubar_classic){
    if(cfg.sort_history){
        boards['Misc.']['Message History'] = 'http://boards.endoftheinter.net/history.php?b';
    }else{
        boards['Misc.']['Message History'] = 'http://boards.endoftheinter.net/history.php';
    }
}

if(cfg.saved_tags){
    boards['Tags'] = cfg.saved_tags;
}

function clipboardTextArea() {
background = chrome.extension.getBackgroundPage();
textArea = background.document.createElement("textarea");
textArea.id = "clipboard";
background.document.body.appendChild(textArea);
}
clipboardTextArea();

function buildContextMenu(){
    board = null;
    board = Array();
    var id;
    var menu = chrome.contextMenus.create({"title": "ETI", "contexts":["page", "image", "selection"] });
		chrome.contextMenus.create({"title": "Search LUE", "parentId": menu, "onclick":searchLUE, "contexts":["selection"]});
		chrome.contextMenus.create({"title": "Transload image", "parentId": menu, "onclick":imageTransloader, "contexts":["image"]});
		chrome.contextMenus.create({
				"title": "View image map",
				"parentId": menu,
				"onclick": imageMap,
				"documentUrlPatterns": ["*://boards.endoftheinter.net/*", "*://endoftheinter.net/inboxthread.php?*"],
				"contexts": ["image"]
		});
		if (cfg.copy_in_context) {
    chrome.contextMenus.create({
        "title": "Copy img code",
        "parentId": menu,
        "onclick": imageCopy,
        "documentUrlPatterns": ["*://boards.endoftheinter.net/*", "*://endoftheinter.net/inboxthread.php?*"],
        "contexts": ["image"]
    });
		}	
    for(var i in boards){
        if(boards[i] != boards[0]){
            chrome.contextMenus.create({"type":"separator", "parentId":menu, "contexts":["page", "image"]});
        }
        for(var j in boards[i]){
            id = chrome.contextMenus.create({"title": j, "parentId": menu, "onclick":handleContext, "contexts":["page", "image"]});
            board[id] = boards[i][j];
        }
    }
}
function imageMap(info) {
    var str = info.srcUrl,
        tokens = str.split('/').slice(-2),
        imageURL = tokens.join('/'),
				imageMap = "http://images.endoftheinter.net/imap/" + imageURL;
    if (cfg.imagemap_new_tab) {
        chrome.tabs.create({
            url: imageMap
        });
    } else {
        chrome.tabs.update({
            url: imageMap
        });
    }
}

function imageCopy(info) {
    var imgURL = info.srcUrl.replace("dealtwith.it", "endoftheinter.net")
    imgCode = '<img src="' + imgURL + '"/>';
    clipboard = document.getElementById('clipboard');
    clipboard.value = imgCode;
    clipboard.select();
    document.execCommand("copy");
}


function searchLUE(info) {
    chrome.tabs.create({
        url: "http://boards.endoftheinter.net/topics/LUE?q=" + info.selectionText
    });
}

function handleContext(info){
    console.log(info, board[info.menuItemId]);
    if(!board[info.menuItemId].match('%extension%')){
        chrome.tabs.create({"url":"http://boards.endoftheinter.net/topics/" + board[info.menuItemId]});
    }else{
        var url = board[info.menuItemId].replace("%extension%", chrome.extension.getURL("/"));
        chrome.tabs.create({"url":url});
    }
}
function getDrama() {
    if(cfg.debug) console.log('fetching dramalinks from wiki...');
    var dramas;
    var xhr = new XMLHttpRequest();
	xhr.open("GET", "http://wiki.endoftheinter.net/index.php?title=Dramalinks/current&action=raw&section=0&maxage=30", true);	
    xhr.withCredentials = "true";
	xhr.send();
	xhr.onreadystatechange = function(){
		if(xhr.readyState == 4 && xhr.status == 200) {
			var t = xhr.responseText;
            t=t.replace(/\[\[(.+?)(\|(.+?))\]\]/g,"<a href=\"http://wiki.endoftheinter.net/index.php/$1\">$3</a>");
			t=t.replace(/\[\[(.+?)\]\]/g,"<a href=\"http://wiki.endoftheinter.net/index.php/$1\">$1</a>");
			t=t.replace(/\[(.+?)\]/g,"<a href=\"$1\" style=\"padding-left: 0px\"><img src=\"http://wiki.endoftheinter.net/skins/monobook/external.png\"></a>");
			t=t.replace(/href="\/index\.php/g,"href=\"http://wiki.endoftheinter.net/index.php");
			t=t.replace(/style=/gi,"");
			t=t.replace(/<script/gi,"<i");
			t=t.replace(/(on)([A-Za-z]*)(=)/gi,"");
			t=t.slice(t.indexOf("<!--- NEW STORIES GO HERE --->")+29);
			dramas=t.slice(0,t.indexOf("<!--- NEW STORIES END HERE --->"));
			t=t.slice(t.indexOf("<!--- CHANGE DRAMALINKS COLOR CODE HERE --->"));
			t=t.slice(t.indexOf("{{")+2);
			var bgcol=t.slice(0,t.indexOf("}}"));
			var col;
			var kermit=false;
			switch (bgcol.toLowerCase()){
                case "kermit":
                    document.getElementById("dramalinks_ticker").style.border="2px solid #990099";
					bgcol="black";
					kermit=true;
                case "black":
				case "blue":
				case "green":
                    col="white";
					break;
                default:
					col="black";
					break;
			}
            if (!kermit)				{
				dramas="<span style='text-transform:capitalize'>Current Dramalinks Level: <font color='" + bgcol + "'>" + bgcol + "</font></span><div style='background-color: "+bgcol+"; color: "+col+";'>" + dramas.slice(2).replace(/\*/g,"&nbsp;&nbsp;&nbsp;&nbsp;")+"</div>";
            }else{
                dramas="Current Dramalinks Level: <blink><font color='" + bgcol + "'>CODE KERMIT</font></blink><div style='background-color: "+bgcol+"; color: "+col+";'>" + dramas.slice(2).replace(/\*/g,"&nbsp;&nbsp;&nbsp;&nbsp;")+"</div>";
            }
            drama.txt = dramas;
            drama.time = parseInt(new Date().getTime() + (1800 * 1000));
        }
    }
    //return drama;
}
if(cfg.context_menu) buildContextMenu();
function handleHttpsRedirect(dest){
    return { redirectUrl: dest.url.replace(/^http:/i, "https:")}
}

for(var i in allBg.activeListeners){
    allBg.activeListeners[i] = cfg[i];
    console.log('setting listener: ' + i + " " + allBg.activeListeners[i]);
}
allBg.init_listener(cfg);
chrome.tabs.onActivated.addListener(function(tab){
    if(!tabPorts[tab.tabId]) return;
    currentTab = tab.tabId;
    tabPorts[tab.tabId].postMessage({action: 'focus_gained'});
    tabPorts[tab.tabId].postMessage({action: 'ignorator_update'});
});
chrome.tabs.onRemoved.addListener(function(tab){
    if(tabPorts[tab.tabId]){
        delete tabPorts[tab.tabId];
        delete ignoratorInfo[tab.tabId];
        delete scopeInfo[tab.tabId];
    }
});
chrome.extension.onConnect.addListener(function(port){
    tabPorts[port.sender.tab.id] = {};
    tabPorts[port.sender.tab.id] = port;
    tabPorts[port.sender.tab.id].onMessage.addListener(function(msg){ messagePort.handleIgnoratorMsg(port.sender.tab.id, msg);});
});
var messagePort = {
    handleIgnoratorMsg: function(tab, msg){
        switch(msg.action){
            case "ignorator_update":
                ignoratorInfo[tab] = msg.ignorator;
                scopeInfo[tab] = msg.scope;
                if(msg.ignorator.total_ignored > 0){
                    chrome.browserAction.setBadgeBackgroundColor({tabId: tab, color: "#ff0000"});
                    chrome.browserAction.setBadgeText({tabId: tab, text: "" + msg.ignorator.total_ignored});
                    noIgnores = false;
                }
                else if (msg.ignorator.total_ignored == 0) {
                    noIgnores = true;												
                }
                break;
            default:
                console.log('no', msg);
                break;
        }
    }
}

chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse) {
        switch(request.need){
            case "config":
                // page script needs extension config.
                cfg = JSON.parse(localStorage['ChromeLL-Config']);
                if(request.sub){
                    sendResponse({"data": cfg[request.sub]});
                }else if(request.tcs){
                    var tcs = JSON.parse(localStorage['ChromeLL-TCs']);
                    sendResponse({"data": cfg, "tcs": tcs});
                }else{
                    sendResponse({"data": cfg});
                }
                break;
            case "save":
                // page script needs config save.
                if(request.name === "tcs"){
                    localStorage['ChromeLL-TCs'] = JSON.stringify(request.data);
                }else{
                    cfg[request.name] = request.data;
                    cfg.last_saved = new Date().getTime();
                    localStorage['ChromeLL-Config'] = JSON.stringify(cfg);
                }
                if(cfg.debug) console.log('saving ', request.name, request.data);
                break;		
						case "notify":
								chrome.notifications.create('popup', {
								type: "basic",
								title: request.title,
								message: request.message,
								iconUrl: "src/images/lueshi_48.png"
								},
								function () {}
								);
						// todo - setTimeout needs user configurable option
								setTimeout(function () {
								chrome.notifications.clear('popup', function () {});
								}, 6000);
								break;	
            case "dramalinks":
                var time = parseInt(new Date().getTime());
                if(drama.time && (time < drama.time)){
                    if(cfg.debug) console.log('returning cached dramalinks. cache exp: ' + drama.time + ' current: ' + time);
                    sendResponse({"data": drama.txt});
                }else{
                    getDrama();
                    sendResponse({"data":drama.txt});
                }
                break;
            case "insertcss":
                if(cfg.debug) console.log('inserting css ', request.file);
                chrome.tabs.insertCSS(sender.tab.id, {file: request.file});
                sendResponse({});
                break;
            case "opentab":
                if(cfg.debug) console.log('opening tab ', request.url);
                chrome.tabs.create({url: request.url});
                break;
            case "noIgnored":
                chrome.tabs.getSelected(function(tab){
                    sendResponse({"noignores": noIgnores});
                });
                break;
            case "getIgnored":
                chrome.tabs.getSelected(function(tab){
                    sendResponse({"ignorator": ignoratorInfo[tab.id], "scope": scopeInfo[tab.id]});
                });
                break;
            case "showIgnorated":
                chrome.tabs.getSelected(function(tab){
                    tabPorts[tab.id].postMessage({action: 'showIgnorated', ids: request.ids});
                });
                if(cfg.debug) console.log('showing hidden data', request);
                break;
            default:
                if(cfg.debug) console.log("Error in request listener - undefined parameter?", request);
                break;
        }
    }
);

function getTCPData() {
    setTimeout(getTCPData, 86400 * 1000);
    getUserID();
}

getTCPData();

function getUserID() {
        var cfg = JSON.parse(localStorage['ChromeLL-Config']);
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "http://boards.endoftheinter.net/topics/LUE", true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                var html = document.createElement('html');
                html.innerHTML = xhr.responseText;
                var me = html.getElementsByClassName('userbar')[0]
                    .getElementsByTagName('a')[0].href
                    .match(/\?user=([0-9]+)/)[1];
                cfg.user_id = me;
                localStorage['ChromeLL-Config'] = JSON.stringify(cfg);
                scrapeUserProf();
            }
        }
        xhr.send();
}
		
function scrapeUserProf() {
    var cfg = JSON.parse(localStorage['ChromeLL-Config']);
    var me = cfg.user_id;
		var url = "http://endoftheinter.net/profile.php?user=" + me;
		var xhr = new XMLHttpRequest();
		var tag;
    var tagsArray = [];
    console.log("User Profile = " + url);
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var html = document.createElement('html');
            html.innerHTML = xhr.responseText;
            var htmlobj = ($(html.innerHTML).find("td"));

						var profileAdmin = $(htmlobj).filter(function () {
								return $(this).text() == "Administrator of";
						}).closest("tr").text();
						var tagsAdmin = profileAdmin.replace("Administrator of", "");
						
						var profileMod = $(htmlobj).filter(function () {
								return $(this).text() == "Moderator of";
						}).closest("tr").text();
						var tagsMod = profileMod.replace("Moderator of", "");	
						
						var tagsAll = tagsAdmin + tagsMod;				
						
						var pattern = /\[(.*?)\]/g;
            while ((tag = pattern.exec(tagsAll)) != null) {
                tagsArray.push(tag[1]);
            }
            console.log(tagsArray);
            delete cfg.tag_admin;
            cfg.tag_admin = tagsArray;
            localStorage['ChromeLL-Config'] = JSON.stringify(cfg);
            console.log("scraped profile for tag information");
        }
    }
    xhr.send();
}

chrome.runtime.onMessage.addListener(
// allows text content to be copied to clipboard from content scripts
    function(request, sender, sendResponse) {
        if (request.quote) {
            var quote = request.quote;
            var clipboard = document.getElementById('clipboard');
            clipboard.value = quote;
            clipboard.select();
            document.execCommand("copy");
            sendResponse({
                clipboard: "copied to clipboard"
            });
        }
    });
