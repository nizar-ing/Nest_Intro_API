import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ObjectLiteral, Repository, FindManyOptions } from 'typeorm';
import { Request } from 'express';
import { PaginationQueryDto } from '../dtos/pagination-query.dto';
import { Paginated } from '../interfaces/paginated.interface';

@Injectable()
export class PaginationProvider {
  async paginateQuery<T extends ObjectLiteral>(
    paginationQuery: PaginationQueryDto,
    repository: Repository<T>,
    request: Request,
    findOptions?: Omit<FindManyOptions<T>, 'skip' | 'take'>,
  ): Promise<Paginated<T>> {
    const { limit = 10, page = 1 } = paginationQuery;

    let data: T[];
    let totalItems: number;

    try {
      [data, totalItems] = await repository.findAndCount({
        ...(findOptions as FindManyOptions<T>),
        skip: (page - 1) * limit,
        take: limit,
      });
    } catch {
      throw new InternalServerErrorException('Failed to execute paginated query');
    }

    const totalPages = Math.ceil(totalItems / limit) || 1;
    const baseUrl = `${request.protocol}://${request.get('host')}${request.path}`;

    return {
      data,
      meta: {
        itemsPerPage: limit,
        totalItems,
        currentPage: page,
        totalPages,
      },
      links: {
        first:    `${baseUrl}?limit=${limit}&page=1`,
        last:     `${baseUrl}?limit=${limit}&page=${totalPages}`,
        current:  `${baseUrl}?limit=${limit}&page=${page}`,
        next:     `${baseUrl}?limit=${limit}&page=${Math.min(page + 1, totalPages)}`,
        previous: `${baseUrl}?limit=${limit}&page=${Math.max(page - 1, 1)}`,
      },
    };
  }
}
