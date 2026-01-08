import { Controller, Get, UseGuards, Patch, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from './user.entity';
import { GetUser } from '../auth/get-user.decorator';
import { AdminGuard } from '../auth/admin.guard';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UserController {

    @Get('/profile')
    getProfile(@GetUser() user: User) {
        return user;
    }

    @Patch('/:id/ban')
    @UseGuards(AdminGuard)
    banUser(@Param('id') id: string) {
        console.log(`Banning user ${id}`);
        return { message: 'User banned successfully' };
    }
}