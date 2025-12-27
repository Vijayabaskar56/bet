import { Component } from "@angular/core";

@Component({
	selector: "app-header",
	standalone: false,
	templateUrl: "./header.html",
	styleUrl: "./header.scss",
})
export class Header {
	homeContens: any[] = [
		{ name: "cricket" },
		{ name: "football" },
		{ name: "tennis" },
		{ name: "lottery" },
		{ name: "table tennis" },
		{ name: "baccard" },
		{ name: "32 cards" },
		{ name: "teenapati" },
	];
}
