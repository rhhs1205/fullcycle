import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  validateSync,
} from 'class-validator';

export class VariaveisAmbiente {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  API_PORT?: number;

  @IsString()
  @Matches(/^postgres(ql)?:\/\//, {
    message: 'DATABASE_URL deve começar com postgresql://',
  })
  DATABASE_URL: string;

  @IsOptional()
  @IsIn(['true', 'false'])
  DB_SYNCHRONIZE?: string;

  @IsOptional()
  @IsString()
  CORS_ORIGIN?: string;
}

export function validarAmbiente(
  configuracao: Record<string, unknown>,
): VariaveisAmbiente {
  const variaveis = plainToInstance(VariaveisAmbiente, configuracao, {
    enableImplicitConversion: true,
  });
  const erros = validateSync(variaveis);
  if (erros.length > 0) {
    const detalhes = erros.flatMap((erro) =>
      Object.values(erro.constraints ?? {}),
    );
    throw new Error(
      `Variáveis de ambiente inválidas:\n- ${detalhes.join('\n- ')}`,
    );
  }
  return variaveis;
}
