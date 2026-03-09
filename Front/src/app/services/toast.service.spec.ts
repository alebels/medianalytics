import { MessageService } from 'primeng/api';
import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';
import { TranslateService } from '@ngx-translate/core';

describe('ToastService', () => {
  let service: ToastService;
  let mockMessageService: { clear: jest.Mock; add: jest.Mock };
  let mockTranslateService: { instant: jest.Mock };

  beforeEach(() => {
    mockMessageService = { clear: jest.fn(), add: jest.fn() };
    mockTranslateService = { instant: jest.fn((key: string) => `translated:${key}`) };

    TestBed.configureTestingModule({
      providers: [
        ToastService,
        { provide: MessageService, useValue: mockMessageService },
        { provide: TranslateService, useValue: mockTranslateService },
      ],
    });

    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('showWarn should call MessageService.clear() before adding', () => {
    service.showWarn('test_msg');
    expect(mockMessageService.clear).toHaveBeenCalledTimes(1);
  });

  it('showWarn should call MessageService.add() with warn severity', () => {
    service.showWarn('test_msg');
    expect(mockMessageService.add).toHaveBeenCalledTimes(1);
    expect(mockMessageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'warn',
        life: 5000,
        closable: true,
      })
    );
  });

  it('showWarn should use messages.warning as summary and messages.<msg> as detail', () => {
    service.showWarn('min_max_range');

    expect(mockTranslateService.instant).toHaveBeenCalledWith('messages.warning');
    expect(mockTranslateService.instant).toHaveBeenCalledWith('messages.min_max_range');

    const addCall = mockMessageService.add.mock.calls[0][0];
    expect(addCall.summary).toBe('translated:messages.warning');
    expect(addCall.detail).toBe('translated:messages.min_max_range');
  });

  it('showWarn should call clear before add (order matters)', () => {
    const callOrder: string[] = [];
    mockMessageService.clear.mockImplementation(() => callOrder.push('clear'));
    mockMessageService.add.mockImplementation(() => callOrder.push('add'));

    service.showWarn('any_msg');

    expect(callOrder).toEqual(['clear', 'add']);
  });

  it('showWarn should translate different message keys correctly', () => {
    service.showWarn('empty_filters');
    expect(mockTranslateService.instant).toHaveBeenCalledWith('messages.empty_filters');

    service.showWarn('no_changes');
    expect(mockTranslateService.instant).toHaveBeenCalledWith('messages.no_changes');
  });
});
