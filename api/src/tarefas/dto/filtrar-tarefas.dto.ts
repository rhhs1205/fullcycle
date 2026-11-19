import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ID_MAXIMO } from '../../common/id';
import {
  aparar,
  paraBooleano,
  paraInteiro,
} from '../../common/transformadores';
import { EhId } from '../../common/validadores';
import { PRIORIDADES } from '../prioridade';
import type { Prioridade } from '../prioridade';

export class FiltrarTarefasDto {
  @Transform(paraBooleano)
  @IsOptional()
  @IsBoolean()
  concluida?: boolean;

  @ApiPropertyOptional({ enum: PRIORIDADES })
  @IsOptional()
  @IsIn(PRIORIDADES)
  prioridade?: Prioridade;

  @ApiPropertyOptional({
    description: 'Mostra só as tarefas desta categoria',
    type: 'integer',
    minimum: 1,
    maximum: ID_MAXIMO,
  })
  @Transform(paraInteiro)
  @IsOptional()
  @EhId()
  categoriaId?: number;

  @Transform(aparar)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  busca?: string;
}
