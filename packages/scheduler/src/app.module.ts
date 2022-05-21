import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FluxionConfigModule } from './config/config.module';
import { DatabaseModule } from './common/database/database.module';
import { AtomModule } from './domain/Atom/atom.module';
import { PipelineModule } from './domain/Pipeline/pipeline.module';
import { TaskModule } from './domain/Task/task.module';

@Module({
  imports: [
    FluxionConfigModule,
    DatabaseModule,
    AtomModule,
    PipelineModule,
    TaskModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
