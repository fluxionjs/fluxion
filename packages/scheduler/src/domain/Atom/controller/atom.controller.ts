import {
  Controller,
  Get,
  Query,
  ClassSerializerInterceptor,
  UseInterceptors,
  Post,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { pick } from 'lodash';
import { ServiceResult } from '@/common/service-result.dto';
import { AtomCreateDTO, AtomQueryDTO } from '../dto/Atom.dto';
import { AtomService } from '../service/atom.service';
import { Pagination } from '@/utils/orm';
import { ParseInstance } from '@/utils/dto';

@ApiTags('atom')
@Controller('atom')
@UseInterceptors(ClassSerializerInterceptor)
export class AtomController {
  constructor(private atomService: AtomService) {}

  @Post()
  @ApiOperation({
    description: 'Create Atom',
  })
  async create(
    @Query('user-id') creatorId: string,
    @Body(ParseInstance()) data: AtomCreateDTO,
  ) {
    const atomEntity = await this.atomService.create(data, creatorId);
    return ServiceResult.successful(atomEntity);
  }

  @Get('/:id')
  async get(
    @Param('id', ParseIntPipe) id: number,
    @Query('user-id') creatorId: string,
  ) {
    const atomEntity = await this.atomService.getById(id, creatorId);
    return ServiceResult.successful;
  }

  @Get()
  @GrpcMethod('AtomService', 'Query')
  @ApiOperation({
    description: 'Query atoms',
  })
  async query(
    @Query('user-id') creatorId: string,
    @Query(ParseInstance()) query: AtomQueryDTO,
  ) {
    const pagination: Pagination = pick(query, ['page', 'perPage']);
    const [list, total] = await this.atomService.findByQuery(
      query,
      creatorId,
      pagination,
    );

    return ServiceResult.successfuls(list, total, pagination.page || 1);
  }
}
