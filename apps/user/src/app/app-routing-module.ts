import { NgModule } from "@angular/core";
import { RouterModule, type Routes } from "@angular/router";
import { Home } from "./components/home/home";

const routes: Routes = [{ path: "", component: Home }];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule],
})
export class AppRoutingModule {}
