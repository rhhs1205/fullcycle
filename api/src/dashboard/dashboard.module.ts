import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tarefa } from '../tarefas/tarefa.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tarefa])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
