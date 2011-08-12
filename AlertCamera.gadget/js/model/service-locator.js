
function ServiceLocator() {

	// Create services
	this.localStorage = new LocalStorage();
	this.prefsService = new PrefsService();
	this.httpClient = httpClientCtor({ prefsService: this.prefsService });
	this.authService = authServiceCtor({ httpClient: this.httpClient, localStorage: this.localStorage });
	this.siteService = siteServiceCtor({ httpClient: this.httpClient, prefsService: this.prefsService });
	this.netService = new NetService();

	// Resolve dependencies
	this.prefsService.localStorage = this.localStorage;
	this.netService.httpClient = this.httpClient;
	
	// Other setup
	this.prefsService.load();
}

