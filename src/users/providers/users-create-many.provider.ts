import {
  ConflictException,
  Injectable,
  RequestTimeoutException,
} from '@nestjs/common';
import { CreateManyUsersDto } from '../dtos/create-many-users.dto';
import { User } from '../user.entity';
import { DataSource } from 'typeorm';

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
    // 3. Start transaction.
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
    } catch {
      throw new RequestTimeoutException(
        'Could not connect to the database or start a transaction',
      );
    }
    try {
      for (let user of createManyUsersDto.users) {
        let newUser = queryRunner.manager.create(User, user);
        let savedUser = await queryRunner.manager.save(newUser);
        newUsers.push(savedUser);
      }
      // 4. If successful --> commit.
      await queryRunner.commitTransaction();

    } catch (error) {
      // 5. If unsuccessful --> rollback.
      await queryRunner.rollbackTransaction();
      throw new ConflictException('Could not complete the transaction', {
        description: String(error),
      });
    } finally {
      // 6. Release our connection
      await queryRunner.release();
    }
    return newUsers;
  }
}
