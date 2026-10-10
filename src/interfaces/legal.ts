export interface LegalNotice {
	title: string;
	heading: string;
	intro: string;
	address: string;
	sections: {
		userConcept: string;
		links: string;
		externalLinks: string;
		cookies: string;
		liability: string;
		technical: string;
		intellectualProperty: string;
		close: string;
	};
	sectionTitles: {
		userConcept: string;
		links: string;
		externalLinks: string;
		cookies: string;
		liability: string;
		technical: string;
		intellectualProperty: string;
	};
}
export interface CookiePolicy {
	title: string;
	heading: string;
	definitionTitle: string;
	definition: string;
	definitionBody: string;
	typesTitle: string;
	typesByTime: string;
	sessionCookies: string;
	persistentCookies: string;
	typesByPurpose: string;
	ownCookies: string;
	thirdPartyCookies: string;
	technicalCookies: string;
	analyticsCookies: string;
	advertisingCookies: string;
	configureTitle: string;
	configure: string;
	configureHelp: string;
	thirdPartyTitle: string;
	googleCookies: string;
	close: string;
}
export interface PrivacyPolicy {
	title: string;
	heading: string;
	sections: {
		object: string;
		responsible: string;
		collectedData: string;
		purpose: string;
		recipients: string;
		retention: string;
		rights: string;
		incidents: string;
		contact: string;
		userCommitment: string;
		userLiability: string;
		lssi: string;
		cookiesInfo: string;
		socialInfo: string;
	};
	sectionTitles: {
		object: string;
		responsible: string;
		collectedData: string;
		purpose: string;
		recipients: string;
		retention: string;
		rights: string;
		incidents: string;
		contact: string;
		userCommitment: string;
		userLiability: string;
		lssi: string;
		cookiesInfo: string;
		socialInfo: string;
	};
}
export interface CookieBanner {
	intro: string;
	accept: string;
	deny: string;
	settings: string;
	privacyTitle: string;
	privacyDesc: string;
	technicalTitle: string;
	technicalDesc: string;
	sessionCookie: string;
	xsrfCookie: string;
	analyticsTitle: string;
	analyticsDesc: string;
	googleAnalytics: string;
	lastReview: string;
	rejectAll: string;
	acceptAll: string;
	save: string;
}
export interface Legal {
	legalNotice: LegalNotice;
	cookiePolicy: CookiePolicy;
	privacyPolicy: PrivacyPolicy;
	cookieBanner: CookieBanner;
}
