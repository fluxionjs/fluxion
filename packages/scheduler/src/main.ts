import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Logger } from './common/logger.service';
import { PipelineService } from './domain/Pipeline/service/pipeline.service';

async function bootstrap(port: number) {
  const app = await NestFactory.create(AppModule, {
    logger: new Logger(),
  });
  const microservice = app.connectMicroservice({
    transport: Transport.NATS,
    options: {
      servers: ['nats://localhost:4222'],
    },
  });

  const config = new DocumentBuilder()
    .setTitle('Fluxion')
    .setDescription('The Fluxion API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.startAllMicroservices();
  await microservice.listen();
  await app.listen(port);
  console.log(`Fluxion listen on http://localhost:${port}`);
}
bootstrap(3000);
