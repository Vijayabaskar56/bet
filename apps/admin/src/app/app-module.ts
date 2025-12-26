import { NgModule, provideBrowserGlobalErrorListeners } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { App } from "./app";
import { AppRoutingModule } from "./app-routing-module";

@NgModule({
	declarations: [App],
	imports: [BrowserModule, AppRoutingModule],
	providers: [provideBrowserGlobalErrorListeners()],
	bootstrap: [App],
})
export class AppModule {}
