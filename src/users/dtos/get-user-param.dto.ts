import { IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for the optional :id route parameter on GET /users/:id.
 *
 * @Type(() => Number) tells class-transformer to coerce the raw string from
 * the URL (e.g. "42") into a JavaScript number before validation runs.
 * This is needed because URL parameters are always strings at the HTTP layer.
 *
 * Note: the controller currently uses @Param('id') directly with ParseIntPipe
 * instead of this DTO — this DTO is kept for future refactoring.
 */
export class GetUserParamDto {
  @ApiPropertyOptional({ description: 'Get user with a specific ID', example: 1234 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  id: number;
}
