import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CategoriasModule } from './categorias/categorias.module';
import { validarAmbiente } from './config/variaveis-ambiente';
import { DashboardModule } from './dashboard/dashboard.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { TarefasModule } from './tarefas/tarefas.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validarAmbiente }),
    DatabaseModule,
    CategoriasModule,
    TarefasModule,
    DashboardModule,
    HealthModule,
  ],
})
export class AppModule {}
