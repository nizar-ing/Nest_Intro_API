import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { User } from '../user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from '../dtos/create-user.dto';
import { CreateManyUsersDto } from '../dtos/create-many-users.dto';
import { PatchUserDto } from '../dtos/patch-user.dto';
import { ConfigService } from '@nestjs/config';
import { UsersCreateManyProvider } from './users-create-many.provider';

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

    // /**
    //  * Inject Datasource
    //  */
    // private readonly datasource: DataSource,

    /**
     * Inject usersCreateMany Provider
     */
    private readonly usersCreateManyProvider: UsersCreateManyProvider
  ) {
  }

  public async findAll(limit: number, page: number): Promise<User[]> {
    try {
      // skip = offset into the full result set; take = max rows per page.
      // page 1 → skip 0, page 2 → skip limit, page 3 → skip 2*limit, etc.
      return await this.usersRepository.find({
        skip: (page - 1) * limit,
        take: limit,
      });
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

  public async createMany(createManyUsersDto: CreateManyUsersDto ) {
    // let newUsers: User[] = [];
    //
    // // 1. Create Query runner instance.
    // const queryRunner = this.datasource.createQueryRunner();
    //
    // // 2. Connect this Query runner instance to our datasource.
    // await queryRunner.connect();
    //
    // // 3. Start transaction.
    // await queryRunner.startTransaction();
    // try {
    //   for (let user of createUserDtos) {
    //     let newUser = queryRunner.manager.create(User, user);
    //     let savedUser = await queryRunner.manager.save(newUser);
    //     newUsers.push(savedUser);
    //   }
    //   // 4. If successful --> commit.
    //   await queryRunner.commitTransaction();
    //
    // } catch (e) {
    //   // 5. If unsuccessful --> rollback.
    //   await queryRunner.rollbackTransaction();
    // } finally {
    //   // 6. Release our connection
    //   await queryRunner.release();
    // }

    return await this.usersCreateManyProvider.createMany(createManyUsersDto);
  }
}
