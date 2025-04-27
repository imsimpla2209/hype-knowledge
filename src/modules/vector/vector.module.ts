import { Module } from '@nestjs/common';
import { VectorService } from './services/vector.service';
import { MemoryVectorProvider } from './services/memory.provider';
import { VectorProvider } from './types/vector.types';
import { EmbedModule } from '../embed/embed.module';
import { VectorController } from './controllers/vector.controller';

@Module({
  imports: [EmbedModule],
  controllers: [VectorController],
  providers: [
    VectorService,
    MemoryVectorProvider,
    {
      provide: 'VECTOR_PROVIDERS_INIT',
      useFactory: (vectorService: VectorService, memoryProvider: MemoryVectorProvider) => {
        // Register providers
        vectorService.registerProvider(VectorProvider.MEMORY, memoryProvider);

        // Initialize service
        return vectorService.initialize();
      },
      inject: [VectorService, MemoryVectorProvider],
    },
  ],
  exports: [VectorService],
})
export class VectorModule {}
