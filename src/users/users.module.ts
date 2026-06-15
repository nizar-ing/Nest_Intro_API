import { forwardRef, Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './providers/users.service';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';

/**
 * UsersModule owns everything related to the `users` table.
 *
 * Circular dependency note:
 *   UsersModule imports AuthModule  (to call AuthService.isAuth())
 *   AuthModule   imports UsersModule (to call UsersService.findOneById())
 *   forwardRef(() => ...) on both sides breaks the circular import at module
 *   resolution time — NestJS resolves each lazily instead of up-front.
 *
 * UsersService is exported so PostsService and AuthService can inject it
 * without re-declaring it as a provider in their own modules.
 */
@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
  imports: [
    forwardRef(() => AuthModule),              // breaks circular dep with AuthModule
    TypeOrmModule.forFeature([User]),          // registers User repo for injection
  ],
})
export class UsersModule {}
