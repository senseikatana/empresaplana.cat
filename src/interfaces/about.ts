export interface AboutJobs {
	title: string;
	desc: string;
	sendCvTitle: string;
	sendCvCta: string;
	applyOffer: string;
	viewOffers: string;
}
export interface AboutSocial {
	title: string;
	subtitle: string;
}
export interface About {
	title: string;
	heroTagline: string;
	heroTitle: string;
	qualityTitle: string;
	qualityIntro: string;
	qualityBody: string;
	qualityCommitment: string;
	qualityBullets: string[];
	qualityClosing: string;
	contactCtaTitle: string;
	contactCta: string;
	phoneHours: string;
	jobs: AboutJobs;
	social: AboutSocial;
	aboutUsTitle: string;
	aboutFooter: string;
	fundedBy: string;
}
