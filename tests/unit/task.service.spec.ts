import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { AppDataSource } from '../../src/config/data-source';
import { TaskRepository } from '../../src/repositories/task.repository';
import { BoardRepository } from '../../src/repositories/board.repository';
import { TaskService } from '../../src/services/task.service';
import { Task } from '../../src/models/task.entity';
import { TaskStatus, TaskPriority } from '../../src/enums';

/**
 * Unit tests для TaskService
 * Тестируют бизнес-логику сервиса в изоляции от HTTP слоя
 */
describe('TaskService Unit Tests', () => {
  let taskService: TaskService;
  let taskRepository: TaskRepository;
  let boardRepository: BoardRepository;
  let testUserId: string;
  let testBoardId: string;

  beforeAll(async () => {
    // Инициализируем базу данных
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    taskRepository = new TaskRepository(AppDataSource);
    boardRepository = new BoardRepository(AppDataSource);
    taskService = new TaskService(taskRepository, boardRepository);

    // Создаём тестового пользователя
    const userResult = await AppDataSource.getRepository('user').insert({
      login: `task_unit_test_${Date.now()}`,
      passwordHash: 'hash',
      failedLoginAttempts: 0,
      refreshToken: null,
      lockedUntil: null,
    });

    testUserId = userResult.identifiers[0].id;

    // Создаём тестовую доску
    const boardResult = await AppDataSource.getRepository('board').insert({
      title: 'Task Unit Test Board',
      description: 'Board for task unit tests',
      ownerId: testUserId,
    });

    testBoardId = boardResult.identifiers[0].id;
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      // Очистка
      await AppDataSource.query(`DELETE FROM task WHERE title LIKE 'task_unit_%'`);
      await AppDataSource.query(`DELETE FROM board WHERE title LIKE 'Task Unit Test%'`);
      await AppDataSource.query(`DELETE FROM "user" WHERE login LIKE 'task_unit_%'`);
      await AppDataSource.destroy();
    }
  });

  beforeEach(async () => {
    // Очистка перед каждым тестом
    await AppDataSource.query(`DELETE FROM task WHERE title LIKE 'task_unit_%'`);
  });

  describe('createTask', () => {
    it('должен создать задачу с корректными данными', async () => {
      const taskData = {
        title: 'task_unit_test_create',
        description: 'Test description',
        boardId: testBoardId,
      };

      const task = await taskService.createTask(taskData, testUserId);

      expect(task).toHaveProperty('id');
      expect(task.title).toBe(taskData.title);
      expect(task.description).toBe(taskData.description);
      expect(task.boardId).toBe(testBoardId);
      expect(task.status).toBe(TaskStatus.BACKLOG); // default
      expect(task.priority).toBe(TaskPriority.MEDIUM); // default
    });

    it('должен создать задачу с указанными status и priority', async () => {
      const taskData = {
        title: 'task_unit_test_with_status',
        boardId: testBoardId,
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
      };

      const task = await taskService.createTask(taskData, testUserId);

      expect(task.status).toBe(TaskStatus.TODO);
      expect(task.priority).toBe(TaskPriority.HIGH);
    });

    it('должен установить дефолтные значения', async () => {
      const taskData = {
        title: 'task_unit_test_defaults',
        boardId: testBoardId,
      };

      const task = await taskService.createTask(taskData, testUserId);

      expect(task.status).toBe(TaskStatus.BACKLOG);
      expect(task.priority).toBe(TaskPriority.MEDIUM);
    });

    it('должен бросить ошибку при попытке создать задачу на чужой доске', async () => {
      const fakeUserId = '00000000-0000-0000-0000-000000000000';

      const taskData = {
        title: 'task_unit_test_unauthorized',
        boardId: testBoardId,
      };

      await expect(taskService.createTask(taskData, fakeUserId)).rejects.toThrow();
    });
  });

  describe('findByBoard', () => {
    beforeEach(async () => {
      // Создаём тестовые задачи
      await taskService.createTask(
        {
          title: 'task_unit_test_find_1',
          boardId: testBoardId,
          status: TaskStatus.BACKLOG,
          priority: TaskPriority.HIGH,
        },
        testUserId
      );

      await taskService.createTask(
        {
          title: 'task_unit_test_find_2',
          boardId: testBoardId,
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
        },
        testUserId
      );
    });

    it('должен вернуть все задачи доски', async () => {
      const result = await taskService.findByBoard(testBoardId, testUserId);

      expect(result.data).toHaveLength(2);
      expect(result.data.every((task: Task) => task.boardId === testBoardId)).toBe(true);
    });

    it('должен поддерживать пагинацию', async () => {
      const result = await taskService.findByBoard(testBoardId, testUserId, {
        page: 1,
        pageSize: 1,
      });

      expect(result.data).toHaveLength(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(1);
      expect(result.total).toBe(2);
      expect(result.totalPages).toBe(2);
    });

    it('должен фильтровать по статусу', async () => {
      const result = await taskService.findByBoard(testBoardId, testUserId, {
        status: TaskStatus.BACKLOG,
      });

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((task: Task) => {
        expect(task.status).toBe(TaskStatus.BACKLOG);
      });
    });

    it('должен фильтровать по приоритету', async () => {
      const result = await taskService.findByBoard(testBoardId, testUserId, {
        priority: TaskPriority.HIGH,
      });

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((task: Task) => {
        expect(task.priority).toBe(TaskPriority.HIGH);
      });
    });

    it('должен вернуть пустой массив если у доски нет задач', async () => {
      // Создаём пустую доску
      const emptyBoard = await boardRepository.create({
        title: 'Empty Board',
        ownerId: testUserId,
      });

      const result = await taskService.findByBoard(emptyBoard.id, testUserId);

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('findById', () => {
    it('должн найти задачу по ID с проверкой владения', async () => {
      const created = await taskService.createTask(
        {
          title: 'task_unit_test_find_id',
          boardId: testBoardId,
        },
        testUserId
      );

      const found = await taskService.findById(created.id, testUserId);

      expect(found).not.toBeNull();
      expect(found.id).toBe(created.id);
      expect(found.title).toBe('task_unit_test_find_id');
    });

    it('должен бросить ошибку для несуществующей задачи', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await expect(taskService.findById(fakeId, testUserId)).rejects.toThrow();
    });

    it('должен бросить ошибку при попытке получить задачу с чужой доски', async () => {
      // Создаём задачу
      const created = await taskService.createTask(
        {
          title: 'task_unit_test_not_owner',
          boardId: testBoardId,
        },
        testUserId
      );

      const fakeUserId = '00000000-0000-0000-0000-000000000000';
      await expect(taskService.findById(created.id, fakeUserId)).rejects.toThrow();
    });
  });

  describe('updateTask', () => {
    it('должен обновить title задачи', async () => {
      const created = await taskService.createTask(
        {
          title: 'task_unit_test_update_title',
          boardId: testBoardId,
        },
        testUserId
      );

      const updated = await taskService.updateTask(
        created.id,
        { title: 'Updated Title' },
        testUserId
      );

      expect(updated?.title).toBe('Updated Title');
    });

    it('должен обновить status задачи', async () => {
      const created = await taskService.createTask(
        {
          title: 'task_unit_test_update_status',
          boardId: testBoardId,
          status: TaskStatus.BACKLOG,
        },
        testUserId
      );

      const updated = await taskService.updateTask(
        created.id,
        { status: TaskStatus.IN_PROGRESS },
        testUserId
      );

      expect(updated?.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it('должен обновить priority задачи', async () => {
      const created = await taskService.createTask(
        {
          title: 'task_unit_test_update_priority',
          boardId: testBoardId,
          priority: TaskPriority.LOW,
        },
        testUserId
      );

      const updated = await taskService.updateTask(
        created.id,
        { priority: TaskPriority.CRITICAL },
        testUserId
      );

      expect(updated?.priority).toBe(TaskPriority.CRITICAL);
    });

    it('должен обновить все поля задачи', async () => {
      const created = await taskService.createTask(
        {
          title: 'task_unit_test_update_all',
          boardId: testBoardId,
          description: 'Original',
          status: TaskStatus.BACKLOG,
          priority: TaskPriority.LOW,
        },
        testUserId
      );

      const updated = await taskService.updateTask(
        created.id,
        {
          title: 'New Title',
          description: 'New Description',
          status: TaskStatus.DONE,
          priority: TaskPriority.HIGH,
        },
        testUserId
      );

      expect(updated?.title).toBe('New Title');
      expect(updated?.description).toBe('New Description');
      expect(updated?.status).toBe(TaskStatus.DONE);
      expect(updated?.priority).toBe(TaskPriority.HIGH);
    });

    it('должен бросить ошибку при обновлении задачи с чужой доски', async () => {
      const created = await taskService.createTask(
        {
          title: 'task_unit_test_unauthorized_update',
          boardId: testBoardId,
        },
        testUserId
      );

      const fakeUserId = '00000000-0000-0000-0000-000000000000';
      await expect(
        taskService.updateTask(created.id, { title: 'Hacked' }, fakeUserId)
      ).rejects.toThrow();
    });
  });

  describe('deleteTask', () => {
    it('должен удалить задачу', async () => {
      const created = await taskService.createTask(
        {
          title: 'task_unit_test_delete',
          boardId: testBoardId,
        },
        testUserId
      );

      await taskService.deleteTask(created.id, testUserId);

      // Проверяем что задача удалена
      const found = await taskService.getOne({ id: created.id } as any);
      expect(found).toBeNull();
    });

    it('должен бросить ошибку при удалении задачи с чужой доски', async () => {
      const created = await taskService.createTask(
        {
          title: 'task_unit_test_unauthorized_delete',
          boardId: testBoardId,
        },
        testUserId
      );

      const fakeUserId = '00000000-0000-0000-0000-000000000000';
      await expect(taskService.deleteTask(created.id, fakeUserId)).rejects.toThrow();
    });
  });

  describe('validateBoardOwnership', () => {
    it('должн подтвердить владение задачей через доску', async () => {
      const created = await taskService.createTask(
        {
          title: 'task_unit_test_ownership',
          boardId: testBoardId,
        },
        testUserId
      );

      const isOwner = await taskService.validateBoardOwnership(created.id, testUserId);

      expect(isOwner).toBe(true);
    });

    it('должн отклонить владение для чужой задачи', async () => {
      const created = await taskService.createTask(
        {
          title: 'task_unit_test_not_owner_task',
          boardId: testBoardId,
        },
        testUserId
      );

      const fakeUserId = '00000000-0000-0000-0000-000000000000';
      const isOwner = await taskService.validateBoardOwnership(created.id, fakeUserId);

      expect(isOwner).toBe(false);
    });

    it('должн бросить ошибку для несуществующей задачи', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await expect(taskService.validateBoardOwnership(fakeId, testUserId)).rejects.toThrow();
    });
  });
});
