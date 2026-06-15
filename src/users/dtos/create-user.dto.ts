import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

/**
 * DTO for POST /users.
 *
 * class-validator decorators run inside the global ValidationPipe.
 * Any property that fails a constraint returns a structured 400 response
 * with the constraint message before the request reaches the controller method.
 */
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(96)
  firstName: string;

  // Optional — missing field is allowed; `undefined` passes @IsOptional().
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(96)
  lastName?: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(96)
  email: string;

  // Regex requires at least one letter, one digit, and one special character.
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(96)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, {
    message: 'Password must be at least 8 characters long and include 1 letter, 1 number, and 1 special character',
  })
  password: string;
}
