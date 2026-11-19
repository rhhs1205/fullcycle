import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ID_MAXIMO } from '../../common/id';
import { aparar, apararOuNulo } from '../../common/transformadores';
import { EhId, OpcionalNaoNulo } from '../../common/validadores';
import { PRIORIDADES } from '../prioridade';
import type { Prioridade } from '../prioridade';

export class CriarTarefaDto {
  @ApiProperty({ example: 'Estudar NestJS' })
  @Transform(aparar)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  titulo: string;

  @ApiPropertyOptional({ example: 'Ler a documentação de pipes e DTOs' })
  @Transform(apararOuNulo)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  descricao?: string | null;

  @ApiPropertyOptional({ enum: PRIORIDADES, example: 'alta' })
  @OpcionalNaoNulo()
  @IsIn(PRIORIDADES)
  prioridade?: Prioridade;

  @ApiPropertyOptional({ example: false })
  @OpcionalNaoNulo()
  @IsBoolean()
  concluida?: boolean;

  @ApiPropertyOptional({
    description:
      'Id de uma categoria existente (veja GET /categorias); null deixa a tarefa sem categoria',
    type: 'integer',
    minimum: 1,
    maximum: ID_MAXIMO,
    nullable: true,
    example: null,
  })
  @IsOptional()
  @EhId()
  categoriaId?: number | null;
}
