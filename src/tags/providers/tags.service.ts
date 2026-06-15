import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { Tag } from '../tag.entity';
import { CreateTagDto } from '../dtos/create-tag.dto';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class TagsService {

  constructor(
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
  ) {}

  public async create(createTagDto: CreateTagDto): Promise<Tag> {
    const tag = this.tagsRepository.create(createTagDto);

    try {
      return await this.tagsRepository.save(tag);
    } catch (error) {
      // Rethrow HttpExceptions (e.g. from nested validators) unchanged.
      // Any other error (e.g. DB connectivity loss) surfaces as a clean 500.
      // The global filter converts PostgreSQL 23505 (unique_violation) to 409
      // when name or slug already exist, so no application-level check is needed here.
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to create tag');
    }
  }

  /**
   * Resolves an array of Tag IDs to their corresponding Tag entities.
   * Used by PostsService when creating or updating a post.
   *
   * TypeORM's In() operator translates to SQL:  WHERE id IN (1, 2, 3)
   * This is a single round-trip regardless of how many IDs are requested.
   *
   * Returns an empty array when tagsIds is an empty array (valid — post has no tags).
   * Call sites must pass `dto.tags ?? []` so undefined never reaches this method;
   * the guard below is a defensive last resort, not an expected code path.
   */
  public async findMultipleTags(tagsIds: number[] | undefined): Promise<Tag[]> {
    if (!tagsIds) {
      // The caller should have converted undefined → [] before invoking this method.
      throw new BadRequestException('tags must be an array of integers, not undefined');
    }
    return await this.tagsRepository.find({ where: { id: In(tagsIds) } });
  }

  // Permanently removes the tag row and the join-table entries (via onDelete CASCADE on the FK).
  public async delete(id: number) {
    // TypeORM's delete() silently returns { affected: 0 } for non-existent IDs,
    // so we check for existence first to return an honest 404 instead of a false success.
    const tag = await this.tagsRepository.findOneBy({ id });
    if (!tag) {
      throw new NotFoundException(`Tag with ID ${id} was not found`);
    }

    await this.tagsRepository.delete(id);
    return { deleted: true, id };
  }

  // Sets deleteDate to NOW(); the row is excluded from future queries automatically.
  public async softRemove(id: number) {
    // findOneBy automatically excludes already-soft-deleted rows (TypeORM appends
    // WHERE deleteDate IS NULL), so a second call on the same ID correctly throws 404.
    const tag = await this.tagsRepository.findOneBy({ id });
    if (!tag) {
      throw new NotFoundException(`Tag with ID ${id} was not found`);
    }

    await this.tagsRepository.softDelete(id);
    return { deleted: true, id };
  }
}
