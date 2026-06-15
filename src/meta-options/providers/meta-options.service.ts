import {
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreatePostMetaOptionsDto } from '../dtos/create-post-meta-options.dto';
import { Repository } from 'typeorm';
import { MetaOption } from '../meta-option.entity';
import { InjectRepository } from '@nestjs/typeorm';

/** Business logic for standalone MetaOption creation. */
@Injectable()
export class MetaOptionsService {

  constructor(
    @InjectRepository(MetaOption)
    private readonly metaOptionsRepository: Repository<MetaOption>,
  ) {}

  // Creates a MetaOption row not linked to any post.
  // The post association (post_id FK) will be NULL until set elsewhere.
  public async create(createPostMetaOptionsDto: CreatePostMetaOptionsDto): Promise<MetaOption> {
    try {
      const metaOption = this.metaOptionsRepository.create(createPostMetaOptionsDto);
      return await this.metaOptionsRepository.save(metaOption);
    } catch (error) {
      // The metaValue column is stored as PostgreSQL JSON. Although @IsJSON() in the DTO
      // validates the string, edge-case inputs could still reach the DB as malformed JSON.
      // Without this catch, that surfaces as an opaque 500 with a raw stack trace.
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to create meta option');
    }
  }
}
