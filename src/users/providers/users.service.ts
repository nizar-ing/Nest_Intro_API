import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from '../dtos/create-user.dto';
import { ConfigService } from '@nestjs/config';

/**
 * Core business logic for the users domain.
 *
 * forwardRef + @Inject(forwardRef(...)) on AuthService is required because
 * UsersModule and AuthModule import each other — NestJS needs the lazy wrapper
 * to resolve the circular dependency without a ReferenceError at startup.
 */
@Injectable()
export class UsersService {

  constructor(
    // @Inject with forwardRef prevents the circular-dependency ReferenceError
    // that would occur if we used a normal constructor injection here.
    // @Inject(forwardRef(() => AuthService))
    // private readonly authService: AuthService,

    // @InjectRepository ties the TypeORM repository for User to this service.
    // The User entity must be registered in the same module via TypeOrmModule.forFeature([User]).
    @InjectRepository(User)
    private usersRepository: Repository<User>,

    private readonly configService: ConfigService,
  ) {}

  // TODO: replace stub data with a real paginated DB query using skip/take.
  public findAll(limit: number, page: number) {
    try {
      return [
        { firstName: 'John', email: 'john@doe.com' },
        { firstName: 'Alice', email: 'alice@doe.com' },
      ];
    } catch {
      throw new InternalServerErrorException('Failed to retrieve users');
    }
  }

  public async findOneById(id: number) {
    const user = await this.usersRepository.findOneBy({ id });

    // Return null silently would give callers a false 200 with an empty body.
    // 404 is semantically correct: the ID is valid in form but absent from the DB.
    if (!user) {
      throw new NotFoundException(`User with ID ${id} was not found`);
    }

    return user;
  }

  public async createUser(createUserDto: CreateUserDto) {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    // Fast-path guard: throw a descriptive 409 before attempting the INSERT.
    // If a race condition bypasses this check and two concurrent requests both pass,
    // the DB UNIQUE constraint on users.email triggers a QueryFailedError (pg code 23505),
    // which the global HttpExceptionFilter converts to a generic 409. The two layers
    // serve different goals: this one gives a precise, human-readable message; the DB
    // constraint is the authoritative safety net.
    if (existingUser) {
      throw new ConflictException(
        `A user with the email ${createUserDto.email} is already registered`,
      );
    }

    // repository.create() maps the DTO plain object to a User entity instance (no DB call).
    // repository.save() then INSERTs the new row and returns the persisted entity with its generated id.
    let newUser = this.usersRepository.create(createUserDto);
    newUser = await this.usersRepository.save(newUser);
    return newUser;
  }

  // TODO: replace stub with a real PATCH that persists to the DB.
  // When implemented: call findOneById(id) first — it already throws NotFoundException
  // if the user does not exist, so no extra guard will be needed here.
  public update(id: string, patchUserDto: any) {
    return { id, ...patchUserDto };
  }
}
