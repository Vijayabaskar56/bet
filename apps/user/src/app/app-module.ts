import { NgModule, provideBrowserGlobalErrorListeners } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { App } from "./app";
import { AppRoutingModule } from "./app-routing-module";
import { Header } from "./components/header/header";
import { Home } from "./components/home/home";

@NgModule({
	declarations: [App, Header, Home],
	imports: [BrowserModule, AppRoutingModule],
	providers: [provideBrowserGlobalErrorListeners()],
	bootstrap: [App],
})
export class AppModule {}
