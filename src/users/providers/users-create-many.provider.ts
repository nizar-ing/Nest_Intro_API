import {
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateManyUsersDto } from '../dtos/create-many-users.dto';
import { User } from '../user.entity';
import { DataSource, QueryFailedError } from 'typeorm';

@Injectable()
export class UsersCreateManyProvider {

  constructor(
    /**
     * Inject Datasource
     */
    private readonly datasource: DataSource
  ){}

  public async createMany(createManyUsersDto: CreateManyUsersDto) {
    let newUsers: User[] = [];

    // 1. Create Query runner instance.
    const queryRunner = this.datasource.createQueryRunner();

    // 2. Connect this Query runner instance to our datasource.
    await queryRunner.connect();

    // 3. Start transaction.
    await queryRunner.startTransaction();
    try {
      for (let user of createManyUsersDto.users) {
        let newUser = queryRunner.manager.create(User, user);
        let savedUser = await queryRunner.manager.save(newUser);
        newUsers.push(savedUser);
      }
      // 4. If successful --> commit.
      await queryRunner.commitTransaction();

    } catch (e) {
      // 5. If unsuccessful --> rollback.
      await queryRunner.rollbackTransaction();

      if (e instanceof HttpException) {
        throw e;
      }

      // Re-throw so the global filter can map pg SQLSTATE codes to HTTP responses.
      if (e instanceof QueryFailedError) {
        throw e;
      }

      throw new InternalServerErrorException(
        'Could not complete the bulk user creation',
      );
    } finally {
      // 6. Release our connection
      await queryRunner.release();
    }
    return newUsers;
  }
}
