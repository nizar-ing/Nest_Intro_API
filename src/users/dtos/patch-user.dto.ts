import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

/**
 * DTO for PATCH /users/:id.
 *
 * PartialType(CreateUserDto) re-exports every field from CreateUserDto but marks
 * each one as optional, so the client can send any subset of fields.
 * All existing validation rules (Matches, MinLength, etc.) are preserved on the
 * fields that ARE provided.
 */
export class PatchUserDto extends PartialType(CreateUserDto) {}
