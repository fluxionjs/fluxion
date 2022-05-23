import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FluxionConfigModule } from './config/config.module';
import { DatabaseModule } from './common/database.module';
import { AtomModule } from './domain/Atom/atom.module';
import { PipelineModule } from './domain/Pipeline/pipeline.module';
import { TaskModule } from './domain/Task/task.module';
import { QueueModule } from './common/queue.module';

@Module({
  imports: [
    FluxionConfigModule,
    QueueModule,
    DatabaseModule,
    AtomModule,
    PipelineModule,
    TaskModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
