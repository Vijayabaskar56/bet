import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Layout } from './components/layout/layout';

const routes: Routes = [
  {path:'',component:Login},
  {path:'layout',component:Layout}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
