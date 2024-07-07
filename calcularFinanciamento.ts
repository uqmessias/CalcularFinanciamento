const formatarDinheiro = (num: number): string =>
  `R$ ${num
    .toFixed(2)
    .replace('.', ',')
    .replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1.')}`;

const formatarPercentual = (num: number): string =>
  `${(num * 100).toFixed(4).replace('.', ',')}%`;

const formatarMeses = (num: number): string => {
  const meses = num % 12;
  const anos = num >= 12 ? (num - meses) / 12 : 0;

  const frase: string[] = [];

  if (anos > 0) {
    frase.push(`${anos} ${anos === 1 ? 'ano' : 'anos'}`);
  }
  if (meses > 0) {
    frase.push(`${meses} ${meses === 1 ? 'mês' : 'meses'}`);
  }

  return frase.length ? frase.join(' e ') : '0 meses';
};

type NumeroFormatado<
  T extends CalcularFinanciamentoResult | CalcularFinanciamentoParcela,
> = {
  [P in keyof T]: T[P] extends number
    ? // eslint-disable-next-line @typescript-eslint/no-unused-vars
      P extends `valor${infer _}` | `percentual${infer _}` | `meses${infer _}`
      ? string
      : T[P]
    : T[P];
};

type CalcularFinanciamentoFormatado<
  T extends CalcularFinanciamentoResult | CalcularFinanciamentoParcela,
> = NumeroFormatado<T>;

function formatarNumero<
  T extends CalcularFinanciamentoResult | CalcularFinanciamentoParcela,
>(objetoComNumero: T): CalcularFinanciamentoFormatado<T> {
  const dinheiroFormatado = Object.keys(objetoComNumero).reduce(
    (formatado, propriedade) => {
      const numero = objetoComNumero[
        propriedade as keyof typeof objetoComNumero
      ] as number;

      if (propriedade.startsWith('valor')) {
        return {
          ...formatado,
          [propriedade]: formatarDinheiro(numero),
        } as NumeroFormatado<T>;
      }

      if (propriedade.startsWith('percentual')) {
        return {
          ...formatado,
          [propriedade]: formatarPercentual(numero),
        } as NumeroFormatado<T>;
      }

      if (propriedade.startsWith('meses')) {
        return {
          ...formatado,
          [propriedade]: formatarMeses(numero),
        } as NumeroFormatado<T>;
      }

      return formatado;
    },
    objetoComNumero as NumeroFormatado<T>,
  ) as NumeroFormatado<T>;

  return dinheiroFormatado;
}

interface CalcularFinanciamentoParcela {
  numero: number;
  valorAPagarJuros: number;
  valorAPagarAmortizacao: number;
  /** Todo o valor que puder ser pago do {@link calcularFinanciamento(valorDisponivelPorMesParaAmortizacao)} depois de pagar o {@link valorAPagarTotal} */
  valorAPagarAmortizacaoExtra: number;
  /** Valor do {@link valorAPagarAmortizacao} + {@link valorAPagarJuros} */
  valorAPagarTotal: number;
  /** Valor que sobrar do {@link valorAPagarAmortizacaoExtra} + {@link valorAPagarTotal} */
  valorAPagarTotalComAmortizacao: number;
  valorDevedorTotalDepoisDestaParcela: number;
}

function calcularFinanciamentoParcela(
  numero: number,
  mesesParaPagar: number,
  valorDisponivelPorMesParaAmortizacao: number,
  valorDevedorTotalDepoisDestaParcela: number,
  percentualCustoEfetivoTotalMensal: number,
): CalcularFinanciamentoParcela {
  const parcelasRestantes = mesesParaPagar - (numero - 1);
  const valorAPagarAmortizacao =
    parcelasRestantes <= 0
      ? 0
      : Math.floor(
          (valorDevedorTotalDepoisDestaParcela / parcelasRestantes) * 100,
        ) / 100;

  const valorAPagarJuros =
    valorDevedorTotalDepoisDestaParcela * percentualCustoEfetivoTotalMensal;
  const valorAPagarTotal = valorAPagarAmortizacao + valorAPagarJuros;

  const valorAPagarAmortizacaoExtra =
    valorDevedorTotalDepoisDestaParcela > 0
      ? Math.max(
          0,
          Math.min(
            valorDevedorTotalDepoisDestaParcela,
            valorDisponivelPorMesParaAmortizacao - valorAPagarTotal,
          ),
        )
      : 0;

  const valorAPagarTotalComAmortizacao =
    valorAPagarTotal + valorAPagarAmortizacaoExtra;

  // Desconta o valor pago na parcela do mês
  if (valorDevedorTotalDepoisDestaParcela > 0) {
    valorDevedorTotalDepoisDestaParcela -= valorAPagarAmortizacao;
  }

  if (valorDevedorTotalDepoisDestaParcela > 0) {
    valorDevedorTotalDepoisDestaParcela -= valorAPagarAmortizacaoExtra;
  }

  return {
    numero,
    valorAPagarJuros,
    valorAPagarAmortizacao,
    valorAPagarAmortizacaoExtra,
    valorAPagarTotal,
    valorAPagarTotalComAmortizacao,
    valorDevedorTotalDepoisDestaParcela,
  };
}

interface CalcularFinanciamentoResult {
  valorTotalImovel: number;
  valorTotalImovelEntrada: number;
  valorTotalImovelFinanciadoCalculado: number;
  valorTotalImovelFinanciadoCalculadoDepoisDasAmortizacoes: number;
  valorTotalImovelEconomizadoComAmortizacoes: number;
  mesesParaPagar: number;
  mesesParaPagarDepoisDasAmortizacoes: number;
  percentualCustoEfetivoTotalAnual: number;
  // Depois de pagar todas as amortizações, qual é o CET final?
  percentualCustoEfetivoTotal: number;
  percentualCustoEfetivoTotalComAmortizacoes: number;
  // Depois de pagar todas as amortizações, qual é o CET final ao ano?
  percentualCustoEfetivoTotalAnualCalculado: number;
  percentualCustoEfetivoTotalAnualCalculadoComAmortizacoes: number;
  percentualCustoEfetivoTotalMensal: number;
  valorDisponivelPorMesParaAmortizacao: number;
  parcelas: CalcularFinanciamentoParcela[];
}

function calcularFinanciamento(
  valorTotalImovel: number,
  valorTotalImovelEntrada: number,
  mesesParaPagar: number,
  percentualCustoEfetivoTotalAnual: number,
  valorDisponivelPorMesParaAmortizacao: number,
): CalcularFinanciamentoResult {
  const parcelasCalculadasComAmortizacao: CalcularFinanciamentoParcela[] = [];
  const parcelasCalculadasOriginalmente: CalcularFinanciamentoParcela[] = [];
  const percentualCustoEfetivoTotalMensal =
    (1 + percentualCustoEfetivoTotalAnual) ** (1 / 12) - 1;
  const valorTotalImovelFinanciado = valorTotalImovel - valorTotalImovelEntrada;

  let financiamentoCalculado = {
    valorTotalImovel,
    valorTotalImovelEntrada,
    valorTotalImovelFinanciado,
    mesesParaPagar,
    percentualCustoEfetivoTotalAnual,
    valorDisponivelPorMesParaAmortizacao,
    percentualCustoEfetivoTotalMensal,
    parcelas: parcelasCalculadasComAmortizacao,
  };

  let valorDevedorTotalDepoisDestaParcelaOriginal = valorTotalImovelFinanciado;
  let valorDevedorTotalDepoisDestaParcelaComAmortizacao =
    valorTotalImovelFinanciado;

  for (let numero = 1; numero <= mesesParaPagar; numero++) {
    const parcelaOriginal = calcularFinanciamentoParcela(
      numero,
      mesesParaPagar,
      0,
      valorDevedorTotalDepoisDestaParcelaOriginal,
      percentualCustoEfetivoTotalMensal,
    );
    valorDevedorTotalDepoisDestaParcelaOriginal =
      parcelaOriginal.valorDevedorTotalDepoisDestaParcela;

    parcelasCalculadasOriginalmente.push(parcelaOriginal);

    if (valorDevedorTotalDepoisDestaParcelaComAmortizacao > 0) {
      const parcelaComAmortizacao = calcularFinanciamentoParcela(
        numero,
        mesesParaPagar,
        valorDisponivelPorMesParaAmortizacao,
        valorDevedorTotalDepoisDestaParcelaComAmortizacao,
        percentualCustoEfetivoTotalMensal,
      );

      valorDevedorTotalDepoisDestaParcelaComAmortizacao =
        parcelaComAmortizacao.valorDevedorTotalDepoisDestaParcela;
      parcelasCalculadasComAmortizacao.push(parcelaComAmortizacao);
    }
  }

  const valorTotalImovelFinanciadoCalculado =
    parcelasCalculadasOriginalmente.reduce(
      (soma, {valorAPagarTotal}) => soma + valorAPagarTotal,
      0,
    );
  const valorTotalImovelFinanciadoCalculadoDepoisDasAmortizacoes =
    parcelasCalculadasComAmortizacao.reduce(
      (soma, {valorAPagarTotalComAmortizacao}) =>
        soma + valorAPagarTotalComAmortizacao,
      0,
    );
  const mesesParaPagarDepoisDasAmortizacoes =
    parcelasCalculadasComAmortizacao.length;

  const percentualCustoEfetivoTotalComAmortizacoes =
    (valorTotalImovelFinanciadoCalculadoDepoisDasAmortizacoes -
      valorTotalImovelFinanciado) /
    valorTotalImovelFinanciado;
  const percentualCustoEfetivoTotalAnualCalculadoComAmortizacoes =
    (1 + percentualCustoEfetivoTotalComAmortizacoes) **
      (1 / (parcelasCalculadasComAmortizacao.length / 12)) -
    1;

  const percentualCustoEfetivoTotal =
    (valorTotalImovelFinanciadoCalculado - valorTotalImovelFinanciado) /
    valorTotalImovelFinanciado;

  const percentualCustoEfetivoTotalAnualCalculado =
    (1 + percentualCustoEfetivoTotal) **
      (1 / (parcelasCalculadasOriginalmente.length / 12)) -
    1;

  const valorTotalImovelEconomizadoComAmortizacoes =
    valorTotalImovelFinanciadoCalculado -
    valorTotalImovelFinanciadoCalculadoDepoisDasAmortizacoes;

  if (
    parcelasCalculadasComAmortizacao.length !==
    parcelasCalculadasOriginalmente.length
  ) {
    console.warn(
      `Estava planejado pagar em ${formatarMeses(
        parcelasCalculadasOriginalmente.length,
      )}, mas foi pago em ${formatarMeses(
        parcelasCalculadasComAmortizacao.length,
      )}`,
    );
  }

  if (parcelasCalculadasOriginalmente.length !== mesesParaPagar) {
    throw new Error(
      `A quantidade de parcelas fornecidas ("${mesesParaPagar}") é diferente das calculadas originalmente ("${parcelasCalculadasOriginalmente}")`,
    );
  }

  return {
    ...financiamentoCalculado,
    valorTotalImovelFinanciadoCalculado,
    valorTotalImovelFinanciadoCalculadoDepoisDasAmortizacoes,
    valorTotalImovelEconomizadoComAmortizacoes,
    mesesParaPagarDepoisDasAmortizacoes,
    // Depois de pagar todas as amortizações, qual é o CET final?
    percentualCustoEfetivoTotal,
    percentualCustoEfetivoTotalComAmortizacoes,
    percentualCustoEfetivoTotalAnualCalculado,
    percentualCustoEfetivoTotalAnualCalculadoComAmortizacoes,
  };
}
const resumoMapaDeChaves = {
  mesesParaPagar: 'Tempo proposto de pagamento',
  mesesParaPagarDepoisDasAmortizacoes: 'Tempo de pagamento amortizado',
  valorTotalImovelFinanciado: 'Valor financiado',
  valorTotalImovelFinanciadoCalculado: 'Valor pago no tempo proposto',
  valorTotalImovelFinanciadoCalculadoDepoisDasAmortizacoes:
    'Valor pago amortizado',
  valorDisponivelPorMesParaAmortizacao: 'Valor disponível para pagamento',
  valorTotalImovelEconomizadoComAmortizacoes: 'Economia por amortizar',
  percentualCustoEfetivoTotal: 'CET',
  percentualCustoEfetivoTotalAnualCalculado: 'CET calculado',
  percentualCustoEfetivoTotalAnual: 'CET / ano',
  percentualCustoEfetivoTotalMensal: 'CET / mês',
  percentualCustoEfetivoTotalComAmortizacoes: 'CET amortização',
  percentualCustoEfetivoTotalAnualCalculadoComAmortizacoes:
    'CET / ano calculado amortização',
} as const;

type ResumoMapaDeChaves = typeof resumoMapaDeChaves;
type ResumoMapaDeChavesChaves = keyof ResumoMapaDeChaves;

function resumirInformacoes(
  financiamentoCalculado: CalcularFinanciamentoResult,
): Record<ResumoMapaDeChaves[ResumoMapaDeChavesChaves], number> {
  const financiamentoCalculadoFormatado = formatarNumero(
    financiamentoCalculado,
  );

  return (
    Object.keys(resumoMapaDeChaves) as Array<ResumoMapaDeChavesChaves>
  ).reduce(
    (financiamento, propriedade) => ({
      ...financiamento,
      [resumoMapaDeChaves[propriedade]]:
        financiamentoCalculadoFormatado[
          propriedade as keyof typeof financiamentoCalculadoFormatado
        ],
    }),
    {} as Record<ResumoMapaDeChaves[ResumoMapaDeChavesChaves], number>,
  );
}

const valorTotalImovel = 250_000;
const valorTotalImovelEntrada = 120_000;
const mesesParaPagar = 12 * 30;
const percentualCustoEfetivoTotalAnual = 11.66 / 100;
const valorDisponivelPorMesParaAmortizacao = 3_000;

const financiamentoCalculado = calcularFinanciamento(
  valorTotalImovel,
  valorTotalImovelEntrada,
  mesesParaPagar,
  percentualCustoEfetivoTotalAnual,
  valorDisponivelPorMesParaAmortizacao,
);
const parcelasResumidas = financiamentoCalculado.parcelas
  .slice(0, 1)
  .concat(
    financiamentoCalculado.parcelas.slice(
      financiamentoCalculado.parcelas.length - 2,
      financiamentoCalculado.parcelas.length,
    ),
  );
const totalParcela = financiamentoCalculado.parcelas.length;
// @ts-ignore
delete financiamentoCalculado.parcelas;

console.log('\nINFORMAÇÕES BÁCISAS ' + totalParcela);
console.table(resumirInformacoes(financiamentoCalculado));

// parcelasResumidas.forEach((parcela) => {
//   console.log(`\nPARCELA ${parcela.numero}`);
//   console.table(formatarNumero(parcela));
// });

/**
 * Output esperado:
 *
 * Estava planejado pagar em 30 anos, mas foi pago em 4 anos e 8 meses
 *
 * INFORMAÇÕES BÁCISAS 96
 * ┌─────────────────────────────────┬────────────────────┐
 * │ (idx)                           │ Values             │
 * ├─────────────────────────────────┼────────────────────┤
 * │ Tempo proposto de pagamento     │ "30 anos"          │
 * │ Tempo de pagamento amortizado   │ "4 anos e 8 meses" │
 * │ Valor financiado                │ "R$ 130.000,00"    │
 * │ Valor pago no tempo proposto    │ "R$ 346.654,34"    │
 * │ Valor pago amortizado           │ "R$ 166.805,36"    │
 * │ Valor disponível para pagamento │ "R$ 3.000,00"      │
 * │ Economia por amortizar          │ "R$ 179.848,98"    │
 * │ CET                             │ "166,6572%"        │
 * │ CET calculado                   │ "3,3233%"          │
 * │ CET / ano                       │ "11,6600%"         │
 * │ CET / mês                       │ "0,9233%"          │
 * │ CET amortização                 │ "28,3118%"         │
 * │ CET / ano calculado amortização │ "5,4873%"          │
 * └─────────────────────────────────┴────────────────────┘
 */
