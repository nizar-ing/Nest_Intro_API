import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from '../../users/providers/users.service';
import { CreatePostDto } from '../dtos/create-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { MetaOption } from '../../meta-options/meta-option.entity';
import { Repository } from 'typeorm';
import { Post } from '../post.entity';
import { TagsService } from '../../tags/providers/tags.service';
import { PatchPostDTO } from '../dtos/patch-post.dto';

/**
 * Core business logic for the posts domain.
 *
 * Two repositories are injected here:
 *   postsRepository       — for CRUD on `posts`
 *   metaOptionsRepository — for manually cleaning up orphaned MetaOption rows on delete
 *     (TypeORM's OneToOne cascade does not propagate DELETE from Post → MetaOption).
 */
@Injectable()
export class PostsService {

  constructor(
    private readonly usersService: UsersService,
    private readonly tagsService: TagsService,

    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,

    // Required for manual orphan cleanup — see delete() below.
    @InjectRepository(MetaOption)
    private readonly metaOptionsRepository: Repository<MetaOption>,
  ) {}

  // metaOptions and author are explicitly joined here because only metaOptions is eager.
  // tags are NOT eager — they are omitted from this query intentionally.
  public async findAll(userId: number) {
    try {
      return await this.postsRepository.find({
        relations: { metaOptions: true, author: true },
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to retrieve posts');
    }
  }

  public async create(createPostDto: CreatePostDto) {
    try {
      // Resolve foreign-key IDs to full entities before persisting.
      // TypeORM needs entity objects (not raw IDs) to build relationships.
      // usersService.findOneById() throws NotFoundException if the user does not exist.
      const author = await this.usersService.findOneById(createPostDto.authorId);

      // Pass `?? []` so TagsService.findMultipleTags() never receives undefined.
      // An empty array means the post has no tags, which is valid.
      const tags = await this.tagsService.findMultipleTags(createPostDto.tags ?? []);

      // TypeORM's find({ where: { id: In([...]) } }) silently ignores IDs that match no
      // row. Without this length check, a post would be saved with a silent subset of
      // the requested tags and the caller would never know which ones were dropped.
      if (createPostDto.tags && createPostDto.tags.length !== tags.length) {
        throw new NotFoundException('One or more of the provided tag IDs do not exist');
      }

      // postsRepository.create() builds a Post instance in memory (no DB call).
      // The spread copies scalar DTO fields; author and tags override the raw IDs.
      // Because cascade: true is on the OneToOne, metaOptions inside createPostDto
      // is also INSERT-ed automatically when postsRepository.save() runs.
      const post = this.postsRepository.create({ ...createPostDto, author, tags });
      return await this.postsRepository.save(post);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to create post');
    }
  }

  public async update(patchPostDto: PatchPostDTO) {
    try {
      // Pass `?? []` so TagsService never receives undefined (no tags = empty array).
      const tags = await this.tagsService.findMultipleTags(patchPostDto.tags ?? []);
      const post = await this.postsRepository.findOneBy({ id: patchPostDto.id });

      if (!post) {
        throw new NotFoundException(`Post with ID ${patchPostDto.id} was not found`);
      }

      // Same silent-subset guard as in create(): tags not found in DB are silently dropped
      // by TypeORM's In() query, so we must detect the mismatch before saving.
      if (patchPostDto.tags && patchPostDto.tags.length !== tags.length) {
        throw new NotFoundException('One or more of the provided tag IDs do not exist');
      }

      // Nullish coalescing (??) keeps the existing value when the DTO field is undefined.
      post.title            = patchPostDto.title            ?? post.title;
      post.content          = patchPostDto.content          ?? post.content;
      post.postType         = patchPostDto.postType         ?? post.postType;
      post.status           = patchPostDto.status           ?? post.status;
      post.featuredImageUrl = patchPostDto.featuredImageUrl ?? post.featuredImageUrl;
      post.slug             = patchPostDto.slug             ?? post.slug;
      post.schema           = patchPostDto.schema           ?? post.schema;
      post.publishOn        = patchPostDto.publishOn        ?? post.publishOn;

      // Tags are always replaced in full — there is no partial tag update.
      post.tags = tags;

      return await this.postsRepository.save(post);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to update post');
    }
  }

  public async delete(id: number) {
    try {
      // Fetch the post BEFORE deleting so we can:
      //   (a) confirm it exists — TypeORM delete() returns affected: 0 silently for
      //       non-existent IDs; without this check the caller gets a false { deleted: true }.
      //   (b) read metaOptions.id — metaOptions is eager, so no extra join is needed.
      const post = await this.postsRepository.findOneBy({ id });

      if (!post) {
        throw new NotFoundException(`Post with ID ${id} was not found`);
      }

      await this.postsRepository.delete(id);

      // Manual orphan cleanup: TypeORM's OneToOne cascade does not issue a DELETE on
      // the MetaOption row when the owning Post is deleted, so we do it explicitly.
      if (post.metaOptions?.id) {
        await this.metaOptionsRepository.delete(post.metaOptions.id);
      }

      return { deleted: true, id };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to delete post');
    }
  }
}
