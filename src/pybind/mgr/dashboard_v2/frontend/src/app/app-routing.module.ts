import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuardService } from './shared/services/auth-guard.service';
import { HostsComponent } from './ceph/cluster/hosts/hosts.component';
import { LoginComponent } from './core/auth/login/login.component';
import { OsdListComponent } from './ceph/osd/osd-list/osd-list.component';

const routes: Routes = [
  { path: '', redirectTo: 'hosts', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'hosts', component: HostsComponent, canActivate: [AuthGuardService] },
  { path: 'osd', component: OsdListComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
