import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuardService } from './shared/services/auth-guard.service';
import { HostsComponent } from './ceph/cluster/hosts/hosts.component';
import { DashboardComponent } from './ceph/dashboard/dashboard/dashboard.component';
import { LoginComponent } from './core/auth/login/login.component';
import { OsdListComponent } from './ceph/osd/osd-list/osd-list.component';
import { PoolDetailComponent } from './ceph/block/pool-detail/pool-detail.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuardService]
  },
  { path: 'login', component: LoginComponent },
  { path: 'hosts', component: HostsComponent, canActivate: [AuthGuardService] },
  { path: 'block/pool/:name', component: PoolDetailComponent, canActivate: [AuthGuardService] },
  { path: 'osd', component: OsdListComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
