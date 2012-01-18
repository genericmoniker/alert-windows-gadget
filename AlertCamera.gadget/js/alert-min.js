var browserLocalStorageCtor=function(c){var d=c.logger;var b=function(f){return""};var e=function(f,g){};var a=function(f){};return{getValue:b,setValue:e,remove:a}};function BrowserServiceLocator(){this.logger=loggerCtor();this.localStorage=browserLocalStorageCtor({logger:this.logger});this.prefsService={};this.httpClient=httpClientCtor({logger:this.logger,prefsService:this.prefsService});this.authService=authServiceCtor({httpClient:this.httpClient,localStorage:this.localStorage,logger:this.logger});this.siteService=siteServiceCtor({httpClient:this.httpClient,logger:this.logger,prefsService:this.prefsService});this.clipService=clipServiceCtor({httpClient:this.httpClient,logger:this.logger});this.netService=new NetService();this.prefsService.localStorage=this.localStorage;this.netService.httpClient=this.httpClient}var authServiceCtor=function(i){var b=false;var e="";var h=i.logger;var a=function(k){k.replace(/&/g,"&amp;");k.replace(/</g,"&lt;");return k};var f=function(n,l,m){var k=i.localStorage.getValue("authToken");if(k){e=i.localStorage.getValue("username");i.httpClient.setAuthToken(k);i.httpClient.get("membership.svc/validate",null,false,function(o){b=true;n(o)},l)}else{if(m){m()}}};var c=function(p,k,n,o,l){var m="<AuthInfo><UserName>"+a(p)+"</UserName><Password>"+a(k)+"</Password></AuthInfo>";i.httpClient.post("membership.svc/authenticate",null,m,true,function(r){var q=r.getHeader("X-Authorization-Token");if(q){h.log("Authenticate succeeded: %0  Token: %1",r.status,q);i.httpClient.setAuthToken(q);if(n){i.localStorage.setValue("authToken",q);i.localStorage.setValue("username",p)}b=true;if(o){o(r)}}else{h.log("HTTPClient reports success, but no auth token.");l(r)}},l)};var j=function(){i.localStorage.remove("authToken");i.localStorage.remove("username");b=false;e=""};var d=function(){return b};var g=function(){return e};return{authenticateFromStorage:f,authenticate:c,logout:j,getUserIsAuthenticated:d,getUsername:g}};var clipServiceCtor=function(j){var i=j.logger;var c=function(k){return k.replace(/^\s\s*/,"").replace(/\s\s*$/,"")};var d=function(l){var k="/"+l.getUTCFullYear().toString()+"/"+(l.getUTCMonth()+1).toString()+"/"+l.getUTCDate().toString();i.log("Date path: "+k);return k};var b=function(l,k){var m=l.getElementsByTagName(k)[0].childNodes[0].nodeValue;return c(m)};var h=function(l){var k=j.httpClient.resolveURL("clip.svc/"+l.mac+"/"+l.id,false,true);k+="&format=mjpeg";return k};var a=function(l){var k={id:b(l,"ClipId"),mac:b(l,"MacAddress"),start:b(l,"StartTime")};k.url=h(k);return k};var g=function(l){var o;var k=[];if(l!==null){var m=l.getElementsByTagName("Clip");for(o=0;o<m.length;++o){var n=a(m[o]);k.push(n)}}else{i.log("No XML returned for this clip request.")}return k};var f=function(n,k,m,l){i.log("Clip search date (camera local time): "+k.toString());j.httpClient.get("search.svc/"+n+d(k),null,true,function(p){var o=g(p.responseXML);m(o)},l)};var e=function(l){l.date=l.date||getDefaultDate();l.count=l.count||10;l.thumbnail=l.thumbnail||false;i.log("Clip search date (camera local time): "+l.date.toString());var k="search.svc/"+l.mac+"/between?start=2000-01-01&end="+l.date+"&results="+l.count.toString()+"&thumbnail="+l.thumbnail;j.httpClient.get(k,null,true,function(n){var m=g(n.responseXML);onSuccess(m)},onFailure)};return{getClipsForDate:f}};var httpClientCtor=function(n){var j="";var i="alert.logitech.com";var m=n.logger;var e=function(p){j=p};var o=function(){if(n.prefsService.useServerOverrides){var p=n.prefsService.webServerOverride;if(p&&p.length>0){return p}}return i};var d=function(r){var p=o();var q=null;if(n.prefsService.useServerOverrides){r=false}if(r){q="https://"+p+"/Services/"}else{q="http://"+p+"/Services/"}return q};var h=function(p,r,s){var q=d(r)+p;if(s){q+="?_auth="+j}return q};var l=function(p){if(j!==null&&j.length>0){p.Authorization=j}};var a=function(p,q){m.log("HTTP request exception: %0",q.message)};var g=function(p){m.log("HTTP request complete: %0 %1 URL: %2",p.status,p.statusText,p.request.url)};var c=function(p,r){var q=h(p,r.secure,false);r.requestHeaders=r.requestHeaders||{};l(r.requestHeaders);r.onException=a;r.onComplete=g;var s=new Ajax.Request(q,r)};var k=function(p,u,r,s,t,q){c(p,{secure:s,method:"post",contentType:"application/xml",postBody:r,requestHeaders:u,onSuccess:t,onFailure:q,onException:a,onComplete:g})};var f=function(p,t,r,s,q){c(p,{secure:r,method:"get",requestHeaders:t,onSuccess:s,onFailure:q,onException:a,onComplete:g})};var b=function(p,t,s,q){t=t||{};var r=new Ajax.Request(p,{method:"get",requestHeaders:t,onSuccess:s,onFailure:q,onException:a,onComplete:g})};return{setAuthToken:e,post:k,get:f,getExternal:b,resolveURL:h}};var loggerCtor=function(c){var a=10;c=c||{};var b=c.output||function(f){console.log(f)};var e=function(k,h,g,l){var i;g=g||"";if(l>a){return g+h+": <Maximum Depth Reached>\n"}if(k===null){return g+h+": (null)\n"}if(typeof k==="object"){var m=null;var f=g+h+"\n";g+="    ";for(i in k){if(k.hasOwnProperty(i)){try{m=k[i]}catch(j){m="<Unable to Evaluate>"}if(m===null){f+=g+i+": (null)\n"}else{if(typeof m==="object"){f+=e(m,i,g,l+1)}else{if(typeof m==="function"){f+=g+i+": function\n"}else{f+=g+i+": "+m+"\n"}}}}}return f}else{return k.toString()}};var d=function(h){if(typeof arguments==="undefined"){return}if(arguments.length===0){return}if(typeof h!=="string"){return}for(var g=1;g<arguments.length;++g){var j=new RegExp("%"+(g-1),"g");var f=(typeof arguments[g]!=="object")?arguments[g]:e(arguments[g],"");h=h.replace(j,f)}b(h)};return{log:d}};function NetService(){this.ipAddressRegExp=/([0-9]+)\.([0-9]+)\.([0-9]+)\.([0-9]+)/;this.httpClient=null;this.isInternetConnectionAvailable=false;this.ipExternal=null;this.init()}NetService.prototype.init=function(){this.isInternetConnectionAvailable=navigator.onLine};NetService.prototype.refreshIPExternal=function(){};function PrefsService(){this.VIDEO_MODE_AUTO=0;this.VIDEO_MODE_DIRECT=1;this.VIDEO_MODE_RELAY=2;this.localStorage=null;this.resetToDefaults()}PrefsService.prototype.resetToDefaults=function(){this.videoMode=this.VIDEO_MODE_AUTO;this.useServerOverrides=false;this.webServerOverride="";this.mediaServerOverride="";this.selectedSite=""};PrefsService.prototype.loadPref=function(b,a){var c=this.localStorage.getValue(b);if(c){return c}else{return a}};PrefsService.prototype.load=function(){Mojo.Log.info("Loading preferences");this.videoMode=parseInt(this.loadPref("videoMode",this.videoMode));this.useServerOverrides=this.loadPref("useServerOverrides",this.useServerOverrides);this.webServerOverride=this.loadPref("webServerOverride",this.webServerOverride);this.mediaServerOverride=this.loadPref("mediaServerOverride",this.mediaServerOverride);this.selectedSite=this.loadPref("selectedSite",this.selectedSite)};PrefsService.prototype.save=function(){Mojo.Log.info("Saving preferences");this.localStorage.setValue("videoMode",this.videoMode);this.localStorage.setValue("useServerOverrides",this.useServerOverrides);this.localStorage.setValue("webServerOverride",this.webServerOverride);this.localStorage.setValue("mediaServerOverride",this.mediaServerOverride);this.localStorage.setValue("selectedSite",this.selectedSite)};var siteServiceCtor=function(g){var l=null;var m=null;var r=g.logger;var n=function(s){return s.replace(/^\s\s*/,"").replace(/\s\s*$/,"")};var o=function(t){return(t==="true")};var h=function(u){var t;for(t=0;t<l.length;++t){if(l[t].id===u){return l[t]}}return null};var q=function(s){return g.httpClient.resolveURL("camera2.svc/"+s.mac+"/snapshotviewable",false,true)};var e=function(s){if(!s.isOnline){return"camera-offline"}else{if(s.productId===17){return"camera-snowbird"}else{return"camera-alta"}}};var i=function(){var t=g.prefsService.selectedSite;var s=h(t);if(s){return s}return l[0]};var b=function(){return l};var c=function(){return m};var k=function(t){var s=this.findSiteById(t);if(s){this.selectedSite=s;this.prefsService.selectedSite=s.id}};var d=function(t,s){var u=t.getElementsByTagName(s)[0].childNodes[0].nodeValue;return n(u)};var a=function(s){var t={mac:d(s,"Mac"),name:d(s,"Name"),isOnline:o(d(s,"IsOnline")),ip:d(s,"InternalIPAddress"),ipExternal:d(s,"IPAddress"),productId:d(s,"ProductId"),siteName:d(s,"SiteName")};t.snapshotURL=q(t);t.className=e(t);r.log("Camera: %0",t);return t};var j=function(s){var t={name:d(s,"SiteName"),id:d(s,"SiteId")};var v=s.getElementsByTagName("CameraInfo");t.cameras=[];for(var w=0;w<v.length;++w){var u=a(v[w]);t.cameras.push(u)}return t};var p=function(w){var u=w.getElementsByTagName("SiteInfo");var t=[];for(var x=0;x<u.length;++x){var v=j(u[x]);t.push(v)}return t};var f=function(t,s){g.httpClient.get("site.svc/?cameras=all&user=default",null,true,function(u){l=p(u.responseXML);m=i();t(l)},s)};return{loadSites:f,getSites:b,selectSiteById:k,getSelectedSite:c,findSiteById:h}};var gadgetLocalStorageCtor=function(c){var d=c.logger;var b=function(f){var g=System.Gadget.Settings.readString(f);d.log("getValue - %0: %1",f,g);return g};var e=function(f,g){System.Gadget.Settings.writeString(f,g)};var a=function(f){System.Gadget.Settings.writeString(f,null)};return{getValue:b,setValue:e,remove:a}};function GadgetServiceLocator(){this.logger=loggerCtor({output:function(a){System.Debug.outputString(a)}});this.localStorage=gadgetLocalStorageCtor({logger:this.logger});this.prefsService={};this.httpClient=httpClientCtor({logger:this.logger,prefsService:this.prefsService});this.authService=authServiceCtor({httpClient:this.httpClient,localStorage:this.localStorage,logger:this.logger});this.siteService=siteServiceCtor({httpClient:this.httpClient,logger:this.logger,prefsService:this.prefsService});this.clipService=clipServiceCtor({httpClient:this.httpClient,logger:this.logger});this.netService=new NetService();this.prefsService.localStorage=this.localStorage;this.netService.httpClient=this.httpClient};