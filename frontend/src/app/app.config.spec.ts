import { formatDate, formatNumber, formatPercent } from '@angular/common';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { appConfig } from './app.config';

describe('appConfig', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: appConfig.providers });
  });

  it('usa o português do Brasil para números e datas', () => {
    const idioma = TestBed.inject(LOCALE_ID);

    expect(idioma).toBe('pt-BR');
    expect(formatNumber(1234.5, idioma)).toBe('1.234,5');
    expect(formatPercent(0.25, idioma)).toBe('25%');
    expect(formatDate('2026-03-01T12:00:00', 'MMMM', idioma)).toBe('março');
  });
});
