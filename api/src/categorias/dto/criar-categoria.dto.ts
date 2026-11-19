import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
import { aparar } from '../../common/transformadores';
import { OpcionalNaoNulo } from '../../common/validadores';

export class CriarCategoriaDto {
  @ApiProperty({ example: 'Leituras' })
  @Transform(aparar)
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  nome: string;

  @ApiPropertyOptional({ example: '#1e88e5' })
  @OpcionalNaoNulo()
  @Matches(/^#[0-9a-fA-F]{6}$/, {
    message: 'cor deve estar no formato #RRGGBB',
  })
  cor?: string;
}
