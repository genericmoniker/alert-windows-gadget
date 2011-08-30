
function ServiceLocator() {

	// Create services
	this.logger = loggerCtor();
	this.localStorage = localStorageCtor({ logger: this.logger });
	this.prefsService = {};
	this.httpClient = httpClientCtor({ logger: this.logger, prefsService: this.prefsService });
	this.authService = authServiceCtor({ httpClient: this.httpClient, localStorage: this.localStorage, logger: this.logger });
	this.siteService = siteServiceCtor({ httpClient: this.httpClient, logger: this.logger, prefsService: this.prefsService });
	this.netService = new NetService();

	// Resolve dependencies
	this.prefsService.localStorage = this.localStorage;
	this.netService.httpClient = this.httpClient;
	
	// Other setup
}

