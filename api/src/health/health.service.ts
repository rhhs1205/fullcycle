import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { StatusDto } from './dto/status.dto';

@Injectable()
export class HealthService {
  constructor(private readonly dataSource: DataSource) {}

  async verificar(): Promise<StatusDto> {
    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      throw new ServiceUnavailableException({
        status: 'erro',
        banco: 'indisponível',
      });
    }
    return { status: 'ok', banco: 'ok', horario: new Date().toISOString() };
  }
}
