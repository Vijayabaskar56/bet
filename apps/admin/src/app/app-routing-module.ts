import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Layout } from './components/layout/layout';
import { Login } from './components/login/login';

const routes: Routes = [
  {path:'',component:Login},
  {path:'layout',component:Layout}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }