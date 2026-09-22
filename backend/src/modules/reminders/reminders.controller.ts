import { Controller, Get, Put, Body } from '@nestjs/common';
import { DataStoreService } from '../../database/data-store.service';
import { IUserReminder } from '@brain-exercises/shared';

@Controller('reminders')
export class RemindersController {
  constructor(private readonly dataStore: DataStoreService) {}

  @Get()
  getReminders() {
    return {
      success: true,
      data: this.dataStore.getReminders()
    };
  }

  @Put()
  updateReminders(@Body() body: { reminders: IUserReminder[] }) {
    const updated = this.dataStore.updateReminders(body.reminders || []);
    return {
      success: true,
      data: updated
    };
  }
}
