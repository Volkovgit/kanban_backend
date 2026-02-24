import { validate } from 'class-validator';
import { UpdateTaskDto } from '../../src/dto/task/update-task.dto';
import { TaskStatus } from '../../src/enums/task-status.enum';
import { TaskPriority } from '../../src/enums/task-priority.enum';
import { plainToInstance } from 'class-transformer';

describe('UpdateTaskDto Validation', () => {
  it('should pass with valid status and priority', async () => {
    const dto = plainToInstance(UpdateTaskDto, {
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should pass with only status', async () => {
    const dto = plainToInstance(UpdateTaskDto, {
      status: TaskStatus.DONE,
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should pass with only priority', async () => {
    const dto = plainToInstance(UpdateTaskDto, {
      priority: TaskPriority.LOW,
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail with invalid status', async () => {
    const dto = plainToInstance(UpdateTaskDto, {
      status: 'INVALID_STATUS' as any,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('status');
  });

  it('should fail with invalid priority', async () => {
    const dto = plainToInstance(UpdateTaskDto, {
      priority: 'INVALID_PRIORITY' as any,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('priority');
  });

  it('should pass with valid title', async () => {
    const dto = plainToInstance(UpdateTaskDto, {
      title: 'New Title',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail with empty title', async () => {
    const dto = plainToInstance(UpdateTaskDto, {
      title: '',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('title');
  });

  it('should fail with too long title', async () => {
    const dto = plainToInstance(UpdateTaskDto, {
      title: 'a'.repeat(256),
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('title');
  });
});
