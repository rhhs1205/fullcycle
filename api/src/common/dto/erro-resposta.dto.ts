import { ApiProperty } from '@nestjs/swagger';

export class ErroRespostaDto {
  @ApiProperty({ type: 'integer', description: 'Código HTTP do erro' })
  statusCode: number;

  @ApiProperty({
    description:
      'Motivo do erro; na validação, uma mensagem para cada regra que falhou',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  message: string | string[];

  @ApiProperty({ description: 'Nome do status HTTP' })
  error: string;
}
