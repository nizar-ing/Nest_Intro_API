import { forwardRef, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './providers/auth.service';
import { UsersModule } from '../users/users.module';

/**
 * AuthModule handles authentication concerns (currently a placeholder).
 *
 * Circular dependency: AuthModule ↔ UsersModule
 *   AuthService needs UsersService (to look up users by credentials).
 *   UsersService needs AuthService (to check isAuth()).
 *   forwardRef(() => UsersModule) on this side + forwardRef(() => AuthModule) in
 *   UsersModule resolves the cycle — NestJS injects proxies that are populated
 *   after both modules are fully initialised.
 *
 * AuthService is exported so UsersService can call isAuth() without re-declaring it.
 */
@Module({
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
  imports: [forwardRef(() => UsersModule)],
})
export class AuthModule {}
