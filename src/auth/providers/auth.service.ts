import { forwardRef, Injectable, Inject } from '@nestjs/common';
import { UsersService } from '../../users/providers/users.service';

/**
 * Placeholder authentication service — real JWT/session logic is not yet implemented.
 *
 * forwardRef + @Inject(forwardRef(() => UsersService)) mirrors the setup in UsersService
 * to resolve the circular dependency between AuthModule and UsersModule at runtime.
 */
@Injectable()
export class AuthService {

  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly userService: UsersService,
  ) {}

  // TODO: validate credentials against the DB and return a signed JWT.
  public login(username: string, password: string, id: number) {
    return 'GENERATING_SIMPLE_PLAIN_TEXT_TOKEN';
  }

  // Stub that always returns true — replace with real session/token validation.
  public isAuth() {
    return true;
  }
}
