import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { ComponentsModule } from './components/components.module';
import { PasswordButtonDirective } from './directives/password-button.directive';
import { PipesModule } from './pipes/pipes.module';
import { AuthGuardService } from './services/auth-guard.service';
import { AuthStorageService } from './services/auth-storage.service';
import { AuthService } from './services/auth.service';
import { FormatterService } from './services/formatter.service';
import { HostService } from './services/host.service';
import { PoolService } from './services/pool.service';
import { ServicesModule } from './services/services.module';

@NgModule({
  imports: [
    CommonModule,
    PipesModule,
    ComponentsModule,
    ServicesModule
  ],
  exports: [
    PipesModule,
    ServicesModule,
    PasswordButtonDirective
  ],
  declarations: [
    PasswordButtonDirective
  ],
  providers: [
    AuthService,
    AuthStorageService,
    AuthGuardService,
    HostService,
    PoolService,
    FormatterService,
    HostService
  ],
  exports: [
    PipesModule,
    ComponentsModule
  ]
})
export class SharedModule {}
