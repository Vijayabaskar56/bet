import { NgModule } from "@angular/core";
import { RouterModule, type Routes } from "@angular/router";

const routes: Routes = [
  {path:'',component:Login},
  {path:'layout',component:Layout}
];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule],
})
export class AppRoutingModule {}
