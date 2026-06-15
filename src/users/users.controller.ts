import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CreateUserDto } from './dtos/create-user.dto';
import { PatchUserDto } from './dtos/patch-user.dto';
import { UsersService } from './providers/users.service';

/**
 * Handles all HTTP traffic under the /users route prefix.
 *
 * Route summary:
 *   GET    /users           → paginated list of users
 *   GET    /users/:id       → single user by primary key
 *   POST   /users           → create a new user
 *   PATCH  /users/:id       → partial update of an existing user
 */
@Controller('users')
@ApiTags('Users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users?limit=10&page=1
  // DefaultValuePipe provides fallback values when query params are omitted.
  // ParseIntPipe then coerces the string to a number (the global transform pipe handles DTOs,
  // but query primitives still need an explicit pipe in the method signature).
  @Get()
  @ApiOperation({ summary: 'Fetches a list of registered users' })
  @ApiResponse({ status: 200, description: 'Users fetched successfully based on the query' })
  @ApiQuery({ name: 'limit', required: false, description: 'The number of entries returned per query', example: 10 })
  @ApiQuery({ name: 'page', required: false, description: 'The page number you want the API to return', example: 1 })
  getUsers(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ) {
    return this.usersService.findAll(limit, page);
  }

  // GET /users/:id
  @Get(':id')
  @ApiOperation({ summary: 'Fetch a single user by id' })
  @ApiResponse({ status: 200, description: 'User fetched successfully' })
  @ApiParam({ name: 'id', required: true, example: '1234' })
  getUserById(@Param('id') id: number) {
    return this.usersService.findOneById(id);
  }

  // POST /users
  @Post()
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  // PATCH /users/:id
  // ParseIntPipe coerces the route segment to a number before it reaches the service,
  // consistent with how query params are handled in getUsers().
  @Patch(':id')
  @ApiParam({ name: 'id', required: true, example: '1234' })
  patchUser(@Param('id', ParseIntPipe) id: number, @Body() patchUserDto: PatchUserDto) {
    return this.usersService.update(id, patchUserDto);
  }
}
